// src/app/api/events/[id]/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateEventSchema = z.object({
  name: z.string().min(3).optional(),
  location: z.string().optional(),
  event_date: z.string().optional(),
});

/**
 * GET /api/events/[id] - Buscar evento específico
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
      `SELECT id, admin_id, name, location, event_date, created_at 
       FROM events 
       WHERE id = $1 AND admin_id = $2`,
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Evento não encontrado", 404);
    }

    return successResponse({ event: result.rows[0] });
  } catch (error) {
    console.error("Error fetching event:", error);
    return errorResponse("Erro ao buscar evento", 500);
  }
}

/**
 * PUT /api/events/[id] - Atualizar evento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updateEventSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const checkResult = await query(
      "SELECT id FROM events WHERE id = $1 AND admin_id = $2",
      [id, auth.admin.adminId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse("Evento não encontrado", 404);
    }

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

    values.push(id, auth.admin.adminId);

    const result = await query(
      `UPDATE events 
       SET ${updates.join(", ")} 
       WHERE id = $${paramCount} AND admin_id = $${paramCount + 1}
       RETURNING id, admin_id, name, location, event_date, created_at`,
      values
    );

    return successResponse({
      message: "Evento atualizado com sucesso",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return errorResponse("Erro ao atualizar evento", 500);
  }
}

/**
 * DELETE /api/events/[id] - Deletar evento
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
      "DELETE FROM events WHERE id = $1 AND admin_id = $2 RETURNING id",
      [id, auth.admin.adminId]
    );

    if (result.rows.length === 0) {
      return errorResponse("Evento não encontrado", 404);
    }

    return successResponse({
      message: "Evento deletado com sucesso",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return errorResponse("Erro ao deletar evento", 500);
  }
}
