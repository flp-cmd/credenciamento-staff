// src/lib/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

/**
 * Hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verificar senha
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gerar JWT token
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extrair token do header Authorization
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) return null;

  return token;
}
