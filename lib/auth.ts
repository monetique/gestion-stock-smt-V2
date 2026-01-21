/**
 * Gestion de l'authentification avec JWT
 * Fournit des fonctions pour signer, vérifier et décoder les tokens JWT
 */

import jwt from "jsonwebtoken"
import { env } from "./env"

// Secret pour signer les JWT (utilise les valeurs validées depuis lib/env.ts)
// En production, ces secrets DOIVENT être définis dans les variables d'environnement
const JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-in-production-min-32-chars")
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-refresh-secret-change-in-production-min-32-chars")

// Vérifier que les secrets sont définis en production
if (process.env.NODE_ENV === "production") {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET doit être défini et contenir au moins 32 caractères en production")
  }
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    throw new Error("JWT_REFRESH_SECRET doit être défini et contenir au moins 32 caractères en production")
  }
}

// Durée de vie des tokens (en secondes)
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60 // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 // 7 jours

export interface JWTPayload {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Génère un token JWT d'accès
 */
export function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: "gestion-stock-smt",
    audience: "gestion-stock-smt-users",
  })
}

/**
 * Génère un token JWT de rafraîchissement
 */
export function signRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: "gestion-stock-smt",
      audience: "gestion-stock-smt-users",
    }
  )
}

/**
 * Vérifie et décode un token JWT d'accès
 * @throws {Error} Si le token est invalide ou expiré
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "gestion-stock-smt",
      audience: "gestion-stock-smt-users",
    }) as JWTPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expiré")
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token invalide")
    }
    throw error
  }
}

/**
 * Vérifie et décode un token JWT de rafraîchissement
 * @throws {Error} Si le token est invalide ou expiré
 */
export function verifyRefreshToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "gestion-stock-smt",
      audience: "gestion-stock-smt-users",
    }) as { userId: string; email: string }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token de rafraîchissement expiré")
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token de rafraîchissement invalide")
    }
    throw error
  }
}

/**
 * Décode un token sans vérifier sa signature (utilisé uniquement pour des raisons de debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Extrait le token du header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

