// src/app/api/events/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  successResponse,
  errorResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const createEventSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  location: z.string().optional(),
  event_date: z.string().optional(),
});

/**
 * GET /api/events - Listar eventos do admin autenticado
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const result = await query(
      `SELECT id, admin_id, name, location, event_date, created_at 
       FROM events 
       WHERE admin_id = $1 
       ORDER BY created_at DESC`,
      [auth.admin.adminId]
    );

    return successResponse({
      events: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return errorResponse("Erro ao buscar eventos", 500);
  }
}

/**
 * POST /api/events - Criar novo evento
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();

    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, location, event_date } = validation.data;

    const result = await query(
      `INSERT INTO events (admin_id, name, location, event_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, admin_id, name, location, event_date, created_at`,
      [auth.admin.adminId, name, location || null, event_date || null]
    );

    return successResponse(
      {
        message: "Evento criado com sucesso",
        event: result.rows[0],
      },
      201
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return errorResponse("Erro ao criar evento", 500);
  }
}
