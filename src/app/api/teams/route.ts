// src/app/api/teams/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const createTeamSchema = z.object({
  event_id: z.number().int().positive("Event ID deve ser um número positivo"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  responsible_name: z.string().optional(),
  responsible_email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
});

/**
 * GET /api/teams?event_id=1 - Listar times de um evento
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return errorResponse("Id do evento é obrigatório", 400);
    }

    // Verificar se o evento pertence ao admin
    const eventCheck = await query(
      "SELECT id FROM events WHERE id = $1 AND admin_id = $2",
      [eventId, auth.admin.adminId]
    );

    if (eventCheck.rows.length === 0) {
      return errorResponse("Evento não encontrado", 404);
    }

    // Buscar times do evento
    const result = await query(
      `SELECT id, event_id, name, responsible_name, responsible_email, 
              team_code, created_at 
       FROM teams 
       WHERE event_id = $1 
       ORDER BY created_at DESC`,
      [eventId]
    );

    return successResponse({
      teams: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return errorResponse("Erro ao buscar times", 500);
  }
}

/**
 * POST /api/teams - Criar novo time
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();

    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { event_id, name, responsible_name, responsible_email } =
      validation.data;

    // Verificar se o evento pertence ao admin
    const eventCheck = await query(
      "SELECT id FROM events WHERE id = $1 AND admin_id = $2",
      [event_id, auth.admin.adminId]
    );

    if (eventCheck.rows.length === 0) {
      return errorResponse("Evento não encontrado", 404);
    }

    // Inserir time (team_code será gerado automaticamente pelo banco)
    const result = await query(
      `INSERT INTO teams (event_id, name, responsible_name, responsible_email) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, event_id, name, responsible_name, responsible_email, 
                 team_code, created_at`,
      [event_id, name, responsible_name || null, responsible_email || null]
    );

    return successResponse(
      {
        message: "Time criado com sucesso",
        team: result.rows[0],
      },
      201
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return errorResponse("Erro ao criar time", 500);
  }
}
