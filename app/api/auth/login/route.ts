import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"
import type { ApiResponse } from "@/lib/api-types"
import type { User } from "@/lib/types"
import { signAccessToken, signRefreshToken } from "@/lib/auth"
import { loginRateLimiter } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"

// Forcer la route à être dynamique (ne pas pré-rendre)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Appliquer le rate limiting pour les tentatives de connexion
    const rateLimitResponse = loginRateLimiter(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    logger.debug('Login API called')
    
    const body = await request.json()
    const { email, password } = body

    logger.debug('Login attempt', { email })

    if (!email || !password) {
      logger.warn('Missing email or password')
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Email et mot de passe requis",
        },
        { status: 400 },
      )
    }

    // Chercher l'utilisateur par email
    logger.debug('Searching for user in database')
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      logger.warn('User not found', { email })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Email ou mot de passe incorrect",
        },
        { status: 401 },
      )
    }

    logger.debug('User found', { email: user.email, isActive: user.isActive })

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      logger.warn('User account is inactive', { email })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Ce compte est désactivé",
        },
        { status: 403 },
      )
    }

    // Vérifier le mot de passe
    logger.debug('Verifying password')
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      logger.warn('Invalid password', { email })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Email ou mot de passe incorrect",
        },
        { status: 401 },
      )
    }

    logger.info('Login successful', { email: user.email })
    console.log(`[Login API] ✓ Connexion réussie pour: ${user.email}`)

    // Générer les tokens JWT
    console.log(`[Login API] Génération des tokens JWT...`)
    let accessToken: string
    let refreshToken: string

    try {
      accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })
      console.log(`[Login API] ✓ Token d'accès généré`)

      refreshToken = signRefreshToken({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })
      console.log(`[Login API] ✓ Token de rafraîchissement généré`)
    } catch (tokenError) {
      console.error(`[Login API] ERREUR lors de la génération des tokens:`, tokenError)
      logger.error('Token generation error', tokenError)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Erreur lors de la génération des tokens: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`,
        },
        { status: 500 },
      )
    }

    // Ne pas retourner le mot de passe
    const { password: _, ...userWithoutPassword } = user

    console.log(`[Login API] ✓ Retour des tokens et données utilisateur`)
    // Retourner les tokens et les données utilisateur
    return NextResponse.json<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>({
      success: true,
      data: {
        user: userWithoutPassword as User,
        accessToken,
        refreshToken,
      },
      message: "Connexion réussie",
    })
  } catch (error) {
    logger.error('Login error', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors de la connexion",
      },
      { status: 500 },
    )
  }
}