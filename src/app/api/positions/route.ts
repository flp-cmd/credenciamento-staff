// src/app/api/positions/route.ts
import { query, getClient } from "@/src/lib/db";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const createPositionSchema = z.object({
  team_id: z.number().int().positive("Team ID deve ser um número positivo"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
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
 * GET /api/positions?team_id=1 - Listar cargos de um time
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team_id");

    if (!teamId) {
      return errorResponse("team_id é obrigatório", 400);
    }

    // Verificar se o time pertence ao admin
    const teamCheck = await query(
      `SELECT t.id FROM teams t
       INNER JOIN events e ON t.event_id = e.id
       WHERE t.id = $1 AND e.admin_id = $2`,
      [teamId, auth.admin.adminId]
    );

    if (teamCheck.rows.length === 0) {
      return errorResponse("Time não encontrado", 404);
    }

    // Buscar cargos com seus campos obrigatórios
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
       WHERE p.team_id = $1
       GROUP BY p.id, p.team_id, p.name, p.created_at
       ORDER BY p.created_at DESC`,
      [teamId]
    );

    return successResponse({
      positions: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return errorResponse("Erro ao buscar cargos", 500);
  }
}

/**
 * POST /api/positions - Criar novo cargo
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  const client = await getClient();

  try {
    const body = await request.json();

    const validation = createPositionSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { team_id, name, required_fields } = validation.data;

    // Verificar se o time pertence ao admin
    const teamCheck = await query(
      `SELECT t.id FROM teams t
       INNER JOIN events e ON t.event_id = e.id
       WHERE t.id = $1 AND e.admin_id = $2`,
      [team_id, auth.admin.adminId]
    );

    if (teamCheck.rows.length === 0) {
      return errorResponse("Time não encontrado", 404);
    }

    await client.query("BEGIN");

    // Inserir cargo
    const positionResult = await client.query(
      `INSERT INTO positions (team_id, name) 
       VALUES ($1, $2) 
       RETURNING id, team_id, name, created_at`,
      [team_id, name]
    );

    const position = positionResult.rows[0];

    // Inserir campos obrigatórios se fornecidos
    if (required_fields && required_fields.length > 0) {
      for (const field of required_fields) {
        await client.query(
          `INSERT INTO position_required_fields (position_id, field_id, required) 
           VALUES ($1, $2, $3)`,
          [position.id, field.field_id, field.required]
        );
      }
    }

    await client.query("COMMIT");

    // Buscar cargo com campos
    const fullPosition = await query(
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
      [position.id]
    );

    return successResponse(
      {
        message: "Cargo criado com sucesso",
        position: fullPosition.rows[0],
      },
      201
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating position:", error);
    return errorResponse("Erro ao criar cargo", 500);
  } finally {
    client.release();
  }
}
