/**
 * Helper pour vérifier l'authentification dans les routes API
 * À utiliser dans les routes API qui nécessitent une authentification
 * (Le middleware Next.js ne peut pas utiliser jsonwebtoken car il s'exécute dans Edge Runtime)
 */

import { type NextRequest } from "next/server"
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth"
import { logger } from "@/lib/logger"

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

/**
 * Vérifie le token JWT et retourne les données utilisateur
 * @throws {Error} Si le token est invalide ou manquant
 */
export function verifyAuth(request: NextRequest): { id: string; email: string; firstName: string; lastName: string; role: string } {
  const authHeader = request.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    logger.warn("Unauthorized API request - No token provided", { pathname: request.nextUrl.pathname })
    throw new Error("Authentification requise. Token manquant.")
  }

  try {
    const payload = verifyAccessToken(token)
    logger.debug("Token verified", { email: payload.email })
    
    return {
      id: payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.warn("Unauthorized API request - Invalid token", { pathname: request.nextUrl.pathname, error: errorMessage })
    throw new Error(`Token invalide ou expiré: ${errorMessage}`)
  }
}

