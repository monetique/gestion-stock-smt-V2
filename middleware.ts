/**
 * Middleware Next.js pour l'authentification et la protection des routes
 * Vérifie les tokens JWT sur toutes les routes protégées
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth"
import { logger } from "@/lib/logger"

// Routes publiques (ne nécessitent pas d'authentification)
const publicRoutes = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/refresh",
]

// Routes API qui nécessitent une authentification
const protectedApiRoutes = ["/api"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Requête entrante: ${pathname}`)
  console.log(`[Middleware] Méthode: ${request.method}`)

  // Ignorer les routes publiques
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
  console.log(`[Middleware] Route publique: ${isPublicRoute}`)
  
  if (isPublicRoute) {
    console.log(`[Middleware] Route publique détectée, passage sans vérification`)
    return NextResponse.next()
  }

  // Vérifier si c'est une route API protégée
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route))
  console.log(`[Middleware] Route API protégée: ${isProtectedApiRoute}`)

  if (isProtectedApiRoute) {
    // Extraire le token du header Authorization
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)

    console.log(`[Middleware] Route API protégée: ${pathname}`)
    console.log(`[Middleware] Authorization header présent: ${!!authHeader}`)
    console.log(`[Middleware] Token extrait: ${token ? 'Oui (' + token.substring(0, 20) + '...)' : 'Non'}`)

    if (!token) {
      logger.warn("Unauthorized API request - No token provided", { pathname })
      console.error(`[Middleware] ERREUR: Aucun token fourni pour ${pathname}`)
      return NextResponse.json(
        {
          success: false,
          error: "Authentification requise. Token manquant.",
        },
        { status: 401 }
      )
    }

    try {
      // Vérifier le token
      console.log(`[Middleware] Vérification du token pour ${pathname}...`)
      const payload = verifyAccessToken(token)
      console.log(`[Middleware] ✓ Token valide pour utilisateur: ${payload.email}`)

      // Ajouter les données de l'utilisateur dans les headers pour les routes API
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set(
        "x-user-data",
        JSON.stringify({
          id: payload.userId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: payload.role,
        })
      )

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.warn("Unauthorized API request - Invalid token", { pathname, error: errorMessage })
      console.error(`[Middleware] ERREUR: Token invalide pour ${pathname}`)
      console.error(`[Middleware] Détails de l'erreur:`, errorMessage)
      console.error(`[Middleware] Type d'erreur:`, error instanceof Error ? error.constructor.name : typeof error)
      return NextResponse.json(
        {
          success: false,
          error: `Token invalide ou expiré. Veuillez vous reconnecter. (${errorMessage})`,
        },
        { status: 401 }
      )
    }
  }

  // Pour les routes dashboard, on ne peut pas vérifier le token côté serveur
  // car les tokens sont dans localStorage côté client.
  // La vérification sera faite côté client dans les composants.
  // On autorise l'accès et la page client vérifiera l'authentification.
  // Note: Les API appelées depuis ces pages seront protégées par le middleware ci-dessus.

  // Par défaut, autoriser l'accès
  return NextResponse.next()
}

// Configurer les matchers pour optimiser les performances
export const config = {
  matcher: [
    /*
     * Match toutes les requêtes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - fichiers images
     * 
     * IMPORTANT: Le pattern doit matcher les routes API
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Inclure explicitement toutes les routes API (syntaxe Next.js)
    "/api/(.*)",
  ],
}

