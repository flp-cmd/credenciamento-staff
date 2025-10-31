// src/app/api/positions/[id]/route.ts
import { query, getClient } from "@/src/lib/db";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const updatePositionSchema = z.object({
  name: z.string().min(2).optional(),
  required_fields: z
    .array(
      z.object({
        field_id: z.number().int().positive(),
        required: z.boolean(),
      })
    )
    .optional(),
});

/**
 * GET /api/positions/[id] - Buscar cargo específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const result = await query(
      `SELECT 
        p.id, 
        p.team_id, 
        p.name, 
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'field_id', prf.field_id,
              'field_key', f.key,
              'field_label', f.label,
              'field_type', f.field_type,
              'required', prf.required
            ) ORDER BY f.id
          ) FILTER (WHERE prf.field_id IS NOT NULL),
          '[]'
        ) as required_fields
       FROM positions p
       INNER JOIN teams t ON p.team_id = t.id
       INNER JOIN events e ON t.event_id = e.id
       LEFT JOIN position_required_fields prf ON p.id = prf.position_id
       LEFT JOIN fields f ON prf.field_id = f.id
       WHERE p.id = $1 AND e.admin_id = $2
       GROUP BY p.id, p.team_id, p.name, p.created_at`,
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Cargo não encontrado", 404);
    }

    return successResponse({ position: result.rows[0] });
  } catch (error) {
    console.error("Error fetching position:", error);
    return errorResponse("Erro ao buscar cargo", 500);
  }
}

/**
 * PUT /api/positions/[id] - Atualizar cargo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const client = await getClient();

  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updatePositionSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    // Verificar se cargo existe e pertence ao admin
    const checkResult = await query(
      `SELECT p.id FROM positions p
       INNER JOIN teams t ON p.team_id = t.id
       INNER JOIN events e ON t.event_id = e.id
       WHERE p.id = $1 AND e.admin_id = $2`,
      [id, auth.admin.adminId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse("Cargo não encontrado", 404);
    }

    await client.query("BEGIN");

    // Atualizar nome se fornecido
    if (validation.data.name) {
      await client.query("UPDATE positions SET name = $1 WHERE id = $2", [
        validation.data.name,
        id,
      ]);
    }

    // Atualizar campos obrigatórios se fornecidos
    if (validation.data.required_fields) {
      // Deletar campos antigos
      await client.query(
        "DELETE FROM position_required_fields WHERE position_id = $1",
        [id]
      );

      // Inserir novos campos
      for (const field of validation.data.required_fields) {
        await client.query(
          `INSERT INTO position_required_fields (position_id, field_id, required) 
           VALUES ($1, $2, $3)`,
          [id, field.field_id, field.required]
        );
      }
    }

    await client.query("COMMIT");

    // Buscar cargo atualizado
    const result = await query(
      `SELECT 
        p.id, 
        p.team_id, 
        p.name, 
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'field_id', prf.field_id,
              'field_key', f.key,
              'field_label', f.label,
              'field_type', f.field_type,
              'required', prf.required
            ) ORDER BY f.id
          ) FILTER (WHERE prf.field_id IS NOT NULL),
          '[]'
        ) as required_fields
       FROM positions p
       LEFT JOIN position_required_fields prf ON p.id = prf.position_id
       LEFT JOIN fields f ON prf.field_id = f.id
       WHERE p.id = $1
       GROUP BY p.id, p.team_id, p.name, p.created_at`,
      [id]
    );

    return successResponse({
      message: "Cargo atualizado com sucesso",
      position: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating position:", error);
    return errorResponse("Erro ao atualizar cargo", 500);
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/positions/[id] - Deletar cargo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const result = await query(
      `DELETE FROM positions 
       WHERE id = $1 
       AND team_id IN (
         SELECT t.id FROM teams t
         INNER JOIN events e ON t.event_id = e.id
         WHERE e.admin_id = $2
       )
       RETURNING id`,
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Cargo não encontrado", 404);
    }

    return successResponse({
      message: "Cargo deletado com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting position:", error);
    return errorResponse("Erro ao deletar cargo", 500);
  }
}
