import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"
import type { ApiResponse } from "@/lib/api-types"
import type { User } from "@/lib/types"
import { logAudit } from "@/lib/audit-logger"

// GET /api/users/[id] - Récupérer un utilisateur par ID

// Forcer la route à être dynamique (ne pas pré-rendre)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id }
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
    console.error('Error fetching user:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors de la récupération de l'utilisateur",
      },
      { status: 500 },
    )
  }
}

// PUT /api/users/[id] - Mettre à jour un utilisateur
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Récupérer l'utilisateur depuis le header
    const userHeader = request.headers.get("x-user-data")
    let userData = null
    try {
      if (userHeader) {
        userData = JSON.parse(userHeader)
      }
    } catch (error) {
      console.error('Error parsing user header:', error)
    }

    // Si le mot de passe est fourni, le hasher
    const updateData: any = {}
    if (body.email !== undefined) updateData.email = body.email
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.role !== undefined) updateData.role = body.role
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    })

    // Logger l'action (toujours créer un log)
    await logAudit({
      userId: userData?.id || "system",
      userEmail: userData?.email || "system@monetique.tn",
      action: "update",
      module: "users",
      entityType: "user",
      entityId: updatedUser.id,
      entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      details: `Modification de l'utilisateur ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})${userData ? ` par ${userData.email}` : ' (utilisateur non identifié)'}`,
      status: "success"
    }, request)

    // Ne pas retourner le mot de passe
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: userWithoutPassword as User,
      message: "Utilisateur mis à jour avec succès",
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors de la mise à jour de l'utilisateur",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/users/[id] - Supprimer (désactiver) un utilisateur
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Récupérer l'utilisateur depuis le header
    const userHeader = request.headers.get("x-user-data")
    let userData = null
    try {
      if (userHeader) {
        userData = JSON.parse(userHeader)
      }
    } catch (error) {
      console.error('Error parsing user header:', error)
    }

    // Récupérer les infos avant suppression
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    // On désactive plutôt que de supprimer pour garder l'historique
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    // Logger l'action (toujours créer un log si l'utilisateur existe)
    if (user) {
      await logAudit({
        userId: userData?.id || "system",
        userEmail: userData?.email || "system@monetique.tn",
        action: "delete",
        module: "users",
        entityType: "user",
        entityId: user.id,
        entityName: `${user.firstName} ${user.lastName}`,
        details: `Suppression de l'utilisateur ${user.firstName} ${user.lastName} (${user.email})${userData ? ` par ${userData.email}` : ' (utilisateur non identifié)'}`,
        status: "success"
      }, request)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Utilisateur supprimé avec succès",
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Erreur lors de la suppression de l'utilisateur",
      },
      { status: 500 },
    )
  }
}