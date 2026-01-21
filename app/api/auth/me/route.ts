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
    console.log(`[API /auth/me] Requête reçue`)
    
    // Récupérer les données utilisateur depuis le header ajouté par le middleware
    const userHeader = request.headers.get("x-user-data")
    console.log(`[API /auth/me] Header x-user-data présent: ${!!userHeader}`)
    console.log(`[API /auth/me] Header x-user-data valeur: ${userHeader ? userHeader.substring(0, 50) + '...' : 'N/A'}`)

    if (!userHeader) {
      console.error(`[API /auth/me] ERREUR: Header x-user-data manquant`)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Non authentifié - Header x-user-data manquant (le middleware n'a pas ajouté les données utilisateur)",
        },
        { status: 401 },
      )
    }

    let userData
    try {
      userData = JSON.parse(userHeader)
      console.log(`[API /auth/me] Données utilisateur parsées: ${userData.email}`)
    } catch (error) {
      console.error(`[API /auth/me] ERREUR: Impossible de parser x-user-data:`, error)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Données utilisateur invalides - Impossible de parser le header x-user-data",
        },
        { status: 401 },
      )
    }

    // Récupérer l'utilisateur complet depuis la base de données
    console.log(`[API /auth/me] Recherche de l'utilisateur avec ID: ${userData.id}`)
    const user = await prisma.user.findUnique({
      where: { id: userData.id }
    })

    if (!user) {
      console.error(`[API /auth/me] ERREUR: Utilisateur non trouvé dans la base avec ID: ${userData.id}`)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Utilisateur non trouvé",
        },
        { status: 404 },
      )
    }

    console.log(`[API /auth/me] ✓ Utilisateur trouvé: ${user.email}`)

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