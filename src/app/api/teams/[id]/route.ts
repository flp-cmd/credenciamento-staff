// src/app/api/teams/[id]/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  responsible_name: z.string().optional(),
  responsible_email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
});

/**
 * GET /api/teams/[id] - Buscar time específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const result = await query(
      `SELECT t.id, t.event_id, t.name, t.responsible_name, t.responsible_email, 
              t.team_code, t.created_at, e.admin_id
       FROM teams t
       INNER JOIN events e ON t.event_id = e.id
       WHERE t.id = $1 AND e.admin_id = $2`,
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Time não encontrado", 404);
    }

    const { admin_id, ...team } = result.rows[0];
    return successResponse({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return errorResponse("Erro ao buscar time", 500);
  }
}

/**
 * PUT /api/teams/[id] - Atualizar time
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

    const validation = updateTeamSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    // Verificar se time existe e pertence ao admin
    const checkResult = await query(
      `SELECT t.id FROM teams t
       INNER JOIN events e ON t.event_id = e.id
       WHERE t.id = $1 AND e.admin_id = $2`,
      [id, auth.admin.adminId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse("Time não encontrado", 404);
    }

    // Construir query dinâmica
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(validation.data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value === "" ? null : value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return errorResponse("Nenhum campo para atualizar", 400);
    }

    values.push(id);

    const result = await query(
      `UPDATE teams 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount}
       RETURNING id, event_id, name, responsible_name, responsible_email, 
                 team_code, created_at`,
      values
    );

    return successResponse({
      message: "Time atualizado com sucesso",
      team: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return errorResponse("Erro ao atualizar time", 500);
  }
}

/**
 * DELETE /api/teams/[id] - Deletar time
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const result = await query(
      `DELETE FROM teams 
       WHERE id = $1 
       AND event_id IN (SELECT id FROM events WHERE admin_id = $2)
       RETURNING id`,
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Time não encontrado", 404);
    }

    return successResponse({
      message: "Time deletado com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return errorResponse("Erro ao deletar time", 500);
  }
}
