// src/app/api/staff/[id]/route.ts
import { query } from "@/src/lib/db";
import {
  authenticate,
  authenticateTeamCode,
  errorResponse,
  successResponse,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateStaffSchema = z.object({
  position_id: z.number().int().positive().optional(),
  name: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  car_plate: z.string().optional(),
});

/**
 * GET /api/staff/[id] - Buscar staff específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Tentar autenticação admin primeiro
    const adminAuth = await authenticate(request);
    if (adminAuth.success) {
      const result = await query(
        `SELECT 
          s.id,
          s.team_id,
          s.position_id,
          s.name,
          s.cpf,
          s.email,
          s.phone,
          s.address,
          s.car_plate,
          s.created_at,
          e.admin_id
         FROM staff s
         INNER JOIN teams t ON s.team_id = t.id
         INNER JOIN events e ON t.event_id = e.id
         WHERE s.id = $1 AND e.admin_id = $2`,
        [id, adminAuth.admin.adminId]
      );

      if (result.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

      const { admin_id, ...staff } = result.rows[0];
      return successResponse({ staff });
    }

    // Tentar autenticação team_code
    const teamAuth = await authenticateTeamCode(request);
    if (teamAuth.success) {
      const result = await query(
        `SELECT 
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
         WHERE s.id = $1 AND s.team_id = $2`,
        [id, teamAuth.teamId]
      );

      if (result.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

      return successResponse({ staff: result.rows[0] });
    }

    return errorResponse("Não autorizado", 401);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return errorResponse("Erro ao buscar staff", 500);
  }
}

/**
 * PUT /api/staff/[id] - Atualizar staff
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = updateStaffSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    // Tentar autenticação admin primeiro
    const adminAuth = await authenticate(request);
    if (adminAuth.success) {
      const checkResult = await query(
        `SELECT s.id, s.team_id FROM staff s
         INNER JOIN teams t ON s.team_id = t.id
         INNER JOIN events e ON t.event_id = e.id
         WHERE s.id = $1 AND e.admin_id = $2`,
        [id, adminAuth.admin.adminId]
      );

      if (checkResult.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

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

      // Validar position_id se fornecido
      if (validation.data.position_id) {
        const positionCheck = await query(
          "SELECT id FROM positions WHERE id = $1 AND team_id = $2",
          [validation.data.position_id, checkResult.rows[0].team_id]
        );

        if (positionCheck.rows.length === 0) {
          return errorResponse(
            "Posição não encontrada ou não pertence ao time",
            404
          );
        }
      }

      values.push(id);

      const result = await query(
        `UPDATE staff 
         SET ${updates.join(", ")} 
         WHERE id = $${paramCount}
         RETURNING id, team_id, position_id, name, cpf, email, phone, address, car_plate, created_at`,
        values
      );

      return successResponse({
        message: "Staff atualizado com sucesso",
        staff: result.rows[0],
      });
    }

    // Tentar autenticação team_code
    const teamAuth = await authenticateTeamCode(request);
    if (teamAuth.success) {
      const checkResult = await query(
        "SELECT id, team_id, position_id FROM staff WHERE id = $1 AND team_id = $2",
        [id, teamAuth.teamId]
      );

      if (checkResult.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

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

      // Validar position_id se fornecido
      if (validation.data.position_id) {
        const positionCheck = await query(
          "SELECT id FROM positions WHERE id = $1 AND team_id = $2",
          [validation.data.position_id, teamAuth.teamId]
        );

        if (positionCheck.rows.length === 0) {
          return errorResponse(
            "Posição não encontrada ou não pertence ao time",
            404
          );
        }

        // Validar campos obrigatórios da nova posição
        const requiredFields = await query(
          `SELECT f.key, prf.required 
           FROM position_required_fields prf
           JOIN fields f ON prf.field_id = f.id
           WHERE prf.position_id = $1`,
          [validation.data.position_id]
        );

        const currentData = checkResult.rows[0];

        for (const field of requiredFields.rows) {
          if (field.required && !currentData[field.key]) {
            const provided =
              validation.data[field.key as keyof typeof validation.data];
            if (!provided) {
              return errorResponse(
                `Campo obrigatório ausente: ${field.key}`,
                400
              );
            }
          }
        }
      }

      values.push(id);

      const result = await query(
        `UPDATE staff 
         SET ${updates.join(", ")} 
         WHERE id = $${paramCount}
         RETURNING id, team_id, position_id, name, cpf, email, phone, address, car_plate, created_at`,
        values
      );

      return successResponse({
        message: "Staff atualizado com sucesso",
        staff: result.rows[0],
      });
    }

    return errorResponse("Não autorizado", 401);
  } catch (error) {
    console.error("Error updating staff:", error);
    return errorResponse("Erro ao atualizar staff", 500);
  }
}

/**
 * DELETE /api/staff/[id] - Deletar staff
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Tentar autenticação admin primeiro
    const adminAuth = await authenticate(request);
    if (adminAuth.success) {
      const result = await query(
        `DELETE FROM staff 
         WHERE id = $1 
         AND team_id IN (
           SELECT t.id FROM teams t
           INNER JOIN events e ON t.event_id = e.id
           WHERE e.admin_id = $2
         )
         RETURNING id`,
        [id, adminAuth.admin.adminId]
      );

      if (result.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

      return successResponse({
        message: "Staff deletado com sucesso",
        id: result.rows[0].id,
      });
    }

    // Tentar autenticação team_code
    const teamAuth = await authenticateTeamCode(request);
    if (teamAuth.success) {
      const result = await query(
        `DELETE FROM staff 
         WHERE id = $1 AND team_id = $2
         RETURNING id`,
        [id, teamAuth.teamId]
      );

      if (result.rows.length === 0) {
        return errorResponse("Staff não encontrado", 404);
      }

      return successResponse({
        message: "Staff deletado com sucesso",
        id: result.rows[0].id,
      });
    }

    return errorResponse("Não autorizado", 401);
  } catch (error) {
    console.error("Error deleting staff:", error);
    return errorResponse("Erro ao deletar staff", 500);
  }
}
