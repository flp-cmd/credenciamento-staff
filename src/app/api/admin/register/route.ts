// src/app/api/admin/register/route.ts
import { hashPassword, generateToken } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { errorResponse, successResponse } from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, email, password } = validation.data;

    // Verificar se email já existe
    const existingAdmin = await query(
      "SELECT id FROM admins WHERE email = $1",
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      return errorResponse("Email já cadastrado", 409);
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Inserir admin
    const result = await query(
      `INSERT INTO admins (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const admin = result.rows[0];

    // Gerar token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
    });

    return successResponse(
      {
        message: "Admin registrado com sucesso",
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          created_at: admin.created_at,
        },
        token,
      },
      201
    );
  } catch (error) {
    console.error("Error registering admin:", error);
    return errorResponse("Erro ao registrar admin", 500);
  }
}
