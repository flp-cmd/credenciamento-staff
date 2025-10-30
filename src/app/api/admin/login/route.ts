// src/app/api/admin/login/route.ts
import { verifyPassword, generateToken } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { errorResponse, successResponse } from "@/src/lib/middleware";
import { NextRequest } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { email, password } = validation.data;

    // Buscar admin
    const result = await query(
      "SELECT id, name, email, password_hash, created_at FROM admins WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return errorResponse("Credenciais inválidas", 401);
    }

    const admin = result.rows[0];

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, admin.password_hash);

    if (!isPasswordValid) {
      return errorResponse("Credenciais inválidas", 401);
    }

    // Gerar token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
    });

    return successResponse({
      message: "Login realizado com sucesso",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        created_at: admin.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return errorResponse("Erro ao fazer login", 500);
  }
}
