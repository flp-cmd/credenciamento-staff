// src/lib/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "./auth";
import { JWTPayload } from "../types";

export interface AuthenticatedRequest extends NextRequest {
  admin?: JWTPayload;
}

/**
 * Middleware para verificar autenticação
 */
export async function authenticate(
  request: NextRequest
): Promise<
  | { success: false; response: NextResponse }
  | { success: true; admin: JWTPayload }
> {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    admin: payload,
  };
}

/**
 * Helper para criar respostas de erro padronizadas
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Helper para criar respostas de sucesso padronizadas
 */
export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Middleware para verificar autenticação via team_code
 * Permite que líderes de equipe cadastrem staff usando o team_code
 */
export async function authenticateTeamCode(
  request: NextRequest
): Promise<
  { success: false; response: NextResponse } | { success: true; teamId: number }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Team code não fornecido" },
        { status: 401 }
      ),
    };
  }

  const teamCode = authHeader.replace("Bearer ", "");

  if (!teamCode) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Team code não fornecido" },
        { status: 401 }
      ),
    };
  }

  const { query } = await import("./db");
  const result = await query("SELECT id FROM teams WHERE team_code = $1", [
    teamCode,
  ]);

  if (result.rows.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Team code inválido" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    teamId: result.rows[0].id,
  };
}
