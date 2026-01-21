/**
 * Endpoint pour rafraîchir un token d'accès
 * Utilise un refresh token pour générer un nouveau access token
 */

import { type NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, signAccessToken } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { ApiResponse } from "@/lib/api-types"
import { logger } from "@/lib/logger"
import { apiRateLimiter } from "@/lib/rate-limiter"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Appliquer le rate limiting
    const rateLimitResponse = apiRateLimiter(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Refresh token requis",
        },
        { status: 400 }
      )
    }

    try {
      // Vérifier le refresh token
      const payload = verifyRefreshToken(refreshToken)

      // Vérifier que l'utilisateur existe toujours et est actif
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user || !user.isActive) {
        logger.warn("Refresh token for inactive or non-existent user", { userId: payload.userId })
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Utilisateur invalide ou désactivé",
          },
          { status: 401 }
        )
      }

      // Générer un nouveau access token
      const newAccessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })

      logger.info("Token refreshed successfully", { email: user.email })

      return NextResponse.json<ApiResponse<{ accessToken: string }>>({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: "Token rafraîchi avec succès",
      })
    } catch (error) {
      logger.warn("Invalid refresh token", { error: String(error) })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Refresh token invalide ou expiré",
        },
        { status: 401 }
      )
    }
  } catch (error) {
    logger.error("Error refreshing token", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors du rafraîchissement du token",
      },
      { status: 500 }
    )
  }
}

