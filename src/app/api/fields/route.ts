// src/app/api/fields/route.ts
import { query } from "@/src/lib/db";
import {
  successResponse,
  errorResponse,
  authenticate,
} from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const createFieldSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z_]+$/,
      "Key deve conter apenas letras minúsculas e underscore"
    ),
  label: z.string().min(2).max(100),
  field_type: z.enum(["text", "email", "number", "phone"], {
    message: "Tipo deve ser: text, email, number ou phone",
  }),
});

/**
 * GET /api/fields - Listar todos os campos disponíveis
 * Não requer autenticação para facilitar uso em formulários públicos
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT id, key, label, field_type, created_at 
       FROM fields 
       ORDER BY id ASC`
    );

    return successResponse({
      fields: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return errorResponse("Erro ao buscar campos", 500);
  }
}

/**
 * POST /api/fields - Criar novo campo (apenas admin)
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();

    const validation = createFieldSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { key, label, field_type } = validation.data;

    // Verificar se key já existe
    const existing = await query("SELECT id FROM fields WHERE key = $1", [key]);

    if (existing.rows.length > 0) {
      return errorResponse("Key já existe", 409);
    }

    // Inserir campo
    const result = await query(
      `INSERT INTO fields (key, label, field_type) 
       VALUES ($1, $2, $3) 
       RETURNING id, key, label, field_type, created_at`,
      [key, label, field_type]
    );

    return successResponse(
      {
        message: "Campo criado com sucesso",
        field: result.rows[0],
      },
      201
    );
  } catch (error) {
    console.error("Error creating field:", error);
    return errorResponse("Erro ao criar campo", 500);
  }
}
