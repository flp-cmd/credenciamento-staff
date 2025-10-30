// src/app/api/staff/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  authenticateTeamCode,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const createStaffSchema = z.object({
  team_id: z.number().int().positive("Team ID deve ser um número positivo"),
  position_id: z
    .number()
    .int()
    .positive("Position ID deve ser um número positivo"),
  name: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  car_plate: z.string().optional(),
});

/**
 * GET /api/staff?team_id=1&position_id=2 - Listar staff de um time/posição
 * Admin pode ver por team_id e position_id
 * Team leader via team_code pode ver todos do time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team_id");
    const positionId = searchParams.get("position_id");

    // Tentar autenticação admin primeiro
    const adminAuth = await authenticate(request);
    if (adminAuth.success) {
      if (!teamId) {
        return errorResponse("team_id é obrigatório", 400);
      }

      const teamCheck = await query(
        `SELECT t.id FROM teams t
         INNER JOIN events e ON t.event_id = e.id
         WHERE t.id = $1 AND e.admin_id = $2`,
        [teamId, adminAuth.admin.adminId]
      );

      if (teamCheck.rows.length === 0) {
        return errorResponse("Time não encontrado", 404);
      }

      let queryText = `SELECT 
        s.id, 
        s.team_id, 
        s.position_id,
        s.name,
        s.cpf,
        s.email,
        s.phone,
        s.address,
        s.car_plate,
        s.created_at 
       FROM staff s
       WHERE s.team_id = $1`;

      const params: unknown[] = [teamId];

      if (positionId) {
        queryText += ` AND s.position_id = $2`;
        params.push(positionId);
      }

      queryText += ` ORDER BY s.created_at DESC`;

      const result = await query(queryText, params);

      return successResponse({
        staff: result.rows,
        total: result.rows.length,
      });
    }

    // Tentar autenticação team_code
    const teamAuth = await authenticateTeamCode(request);
    if (teamAuth.success) {
      let queryText = `SELECT 
        s.id, 
        s.team_id, 
        s.position_id,
        s.name,
        s.cpf,
        s.email,
        s.phone,
        s.address,
        s.car_plate,
        s.created_at 
       FROM staff s
       WHERE s.team_id = $1`;

      const params: unknown[] = [teamAuth.teamId];

      if (positionId) {
        queryText += ` AND s.position_id = $2`;
        params.push(positionId);
      }

      queryText += ` ORDER BY s.created_at DESC`;

      const result = await query(queryText, params);

      return successResponse({
        staff: result.rows,
        total: result.rows.length,
      });
    }

    return errorResponse("Não autorizado", 401);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return errorResponse("Erro ao buscar staff", 500);
  }
}

/**
 * POST /api/staff - Criar novo staff
 * Admin pode criar via token JWT
 * Team leader pode criar via team_code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createStaffSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const {
      team_id,
      position_id,
      name,
      cpf,
      email,
      phone,
      address,
      car_plate,
    } = validation.data;

    // Tentar autenticação admin primeiro
    const adminAuth = await authenticate(request);
    if (adminAuth.success) {
      const teamCheck = await query(
        `SELECT t.id FROM teams t
         INNER JOIN events e ON t.event_id = e.id
         WHERE t.id = $1 AND e.admin_id = $2`,
        [team_id, adminAuth.admin.adminId]
      );

      if (teamCheck.rows.length === 0) {
        return errorResponse("Time não encontrado", 404);
      }

      const positionCheck = await query(
        "SELECT id FROM positions WHERE id = $1 AND team_id = $2",
        [position_id, team_id]
      );

      if (positionCheck.rows.length === 0) {
        return errorResponse(
          "Posição não encontrada ou não pertence ao time",
          404
        );
      }

      const result = await query(
        `INSERT INTO staff (team_id, position_id, name, cpf, email, phone, address, car_plate) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, team_id, position_id, name, cpf, email, phone, address, car_plate, created_at`,
        [
          team_id,
          position_id,
          name || null,
          cpf || null,
          email || null,
          phone || null,
          address || null,
          car_plate || null,
        ]
      );

      return successResponse(
        {
          message: "Staff criado com sucesso",
          staff: result.rows[0],
        },
        201
      );
    }

    // Tentar autenticação team_code
    const teamAuth = await authenticateTeamCode(request);
    if (teamAuth.success) {
      if (team_id !== teamAuth.teamId) {
        return errorResponse("Time ID não corresponde ao team code", 403);
      }

      const positionCheck = await query(
        "SELECT id FROM positions WHERE id = $1 AND team_id = $2",
        [position_id, team_id]
      );

      if (positionCheck.rows.length === 0) {
        return errorResponse(
          "Posição não encontrada ou não pertence ao time",
          404
        );
      }

      const requiredFields = await query(
        `SELECT f.key, prf.required 
         FROM position_required_fields prf
         JOIN fields f ON prf.field_id = f.id
         WHERE prf.position_id = $1`,
        [position_id]
      );

      // Validar campos obrigatórios
      const dataMap: Record<string, string | null | undefined> = {
        name: name || null,
        cpf: cpf || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        car_plate: car_plate || null,
      };

      for (const field of requiredFields.rows) {
        if (field.required && !dataMap[field.key]) {
          return errorResponse(`Campo obrigatório ausente: ${field.key}`, 400);
        }
      }

      const result = await query(
        `INSERT INTO staff (team_id, position_id, name, cpf, email, phone, address, car_plate) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, team_id, position_id, name, cpf, email, phone, address, car_plate, created_at`,
        [
          team_id,
          position_id,
          name || null,
          cpf || null,
          email || null,
          phone || null,
          address || null,
          car_plate || null,
        ]
      );

      return successResponse(
        {
          message: "Staff criado com sucesso",
          staff: result.rows[0],
        },
        201
      );
    }

    return errorResponse("Não autorizado", 401);
  } catch (error) {
    console.error("Error creating staff:", error);
    return errorResponse("Erro ao criar staff", 500);
  }
}
