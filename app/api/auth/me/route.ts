import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { ApiResponse } from "@/lib/api-types"
import type { User } from "@/lib/types"

// GET /api/auth/me - Récupérer l'utilisateur connecté

// Forcer la route à être dynamique (ne pas pré-rendre)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les données utilisateur depuis le header ajouté par le middleware
    const userHeader = request.headers.get("x-user-data")

    if (!userHeader) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Non authentifié",
        },
        { status: 401 },
      )
    }

    let userData
    try {
      userData = JSON.parse(userHeader)
    } catch (error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Données utilisateur invalides",
        },
        { status: 401 },
      )
    }

    // Récupérer l'utilisateur complet depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: userData.id }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Utilisateur non trouvé",
        },
        { status: 404 },
      )
    }

    // Ne pas retourner le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: userWithoutPassword as User,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors de la récupération de l'utilisateur",
      },
      { status: 500 },
    )
  }
}