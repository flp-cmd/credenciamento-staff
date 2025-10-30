// src/app/api/fields/[id]/route.ts
import { query } from "@/src/lib/db";
import {
  errorResponse,
  successResponse,
  authenticate,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateFieldSchema = z.object({
  label: z.string().min(2).max(100).optional(),
  field_type: z
    .enum(["text", "email", "number", "phone"], {
      message: "Tipo deve ser: text, email, number ou phone",
    })
    .optional(),
});

/**
 * GET /api/fields/[id] - Buscar campo específico
 * Não requer autenticação
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const result = await query(
      "SELECT id, key, label, field_type, created_at FROM fields WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse("Campo não encontrado", 404);
    }

    return successResponse({ field: result.rows[0] });
  } catch (error) {
    console.error("Error fetching field:", error);
    return errorResponse("Erro ao buscar campo", 500);
  }
}

/**
 * PUT /api/fields/[id] - Atualizar campo (apenas admin)
 * Nota: key não pode ser alterada para manter integridade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updateFieldSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    // Verificar se campo existe
    const checkResult = await query("SELECT id FROM fields WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return errorResponse("Campo não encontrado", 404);
    }

    // Construir query dinâmica
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(validation.data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return errorResponse("Nenhum campo para atualizar", 400);
    }

    values.push(id);

    const result = await query(
      `UPDATE fields 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount}
       RETURNING id, key, label, field_type, created_at`,
      values
    );

    return successResponse({
      message: "Campo atualizado com sucesso",
      field: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating field:", error);
    return errorResponse("Erro ao atualizar campo", 500);
  }
}

/**
 * DELETE /api/fields/[id] - Deletar campo (apenas admin)
 * CUIDADO: Isso pode afetar cargos que usam este campo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const usageCheck = await query(
      "SELECT COUNT(*) as count FROM position_required_fields WHERE field_id = $1",
      [id]
    );

    const usageCount = parseInt(usageCheck.rows[0].count);

    if (usageCount > 0) {
      return errorResponse(
        `Campo está sendo usado em ${usageCount} cargo(s). Remova as referências antes de deletar.`,
        409
      );
    }

    const result = await query(
      "DELETE FROM fields WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse("Campo não encontrado", 404);
    }

    return successResponse({
      message: "Campo deletado com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting field:", error);
    return errorResponse("Erro ao deletar campo", 500);
  }
}
