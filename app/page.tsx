"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import LoginForm from "@/components/auth/login-form"
import { authenticatedFetch, clearAuthTokens } from "@/lib/api-client"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté en vérifiant réellement le token
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken')
      const storedUser = localStorage.getItem('currentUser')
      
      // Si pas de token ou pas d'utilisateur stocké, pas de session
      if (!accessToken || !storedUser) {
        setIsLoading(false)
        return
      }

      try {
        // Vérifier que le token est valide en appelant /api/auth/me
        const response = await authenticatedFetch('/api/auth/me')
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Token valide, rediriger vers dashboard
            setCurrentUser(data.data)
            window.location.href = "/dashboard"
            return
          }
        }
        
        // Token invalide, nettoyer et rester sur la page de login
        clearAuthTokens()
        setIsLoading(false)
      } catch (error) {
        // Erreur lors de la vérification, nettoyer et rester sur la page de login
        console.error('Error checking auth:', error)
        clearAuthTokens()
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (user: User) => {
    // Les tokens sont déjà sauvegardés par LoginForm via saveAuthTokens
    // On met juste à jour l'état et on redirige
    setCurrentUser(user)
    // Utiliser window.location.href pour une redirection complète
    window.location.href = "/dashboard"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <LoginForm onLogin={handleLogin} />
}
