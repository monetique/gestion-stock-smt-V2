"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/lib/types"
import { saveAuthTokens } from "@/lib/api-client"
import Image from "next/image"

interface LoginFormProps {
  onLogin: (user: User) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      console.log('[LoginForm] Réponse du serveur:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
      })

      if (result.success && result.data) {
        // L'API retourne { user, accessToken, refreshToken }
        const { user, accessToken, refreshToken } = result.data
        
        console.log('[LoginForm] Données reçues:', {
          hasUser: !!user,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          userEmail: user?.email,
        })
        
        if (!user || !accessToken || !refreshToken) {
          console.error('[LoginForm] ERREUR: Données incomplètes', {
            user: !!user,
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
          })
          setError("Erreur lors de la connexion : données incomplètes")
          setIsLoading(false)
          return
        }

        // Sauvegarder les tokens dans localStorage
        console.log('[LoginForm] Sauvegarde des tokens dans localStorage...')
        saveAuthTokens(accessToken, refreshToken, user)
        console.log('[LoginForm] ✓ Tokens sauvegardés')
        
        // Appeler le callback avec l'utilisateur
        console.log('[LoginForm] Redirection vers /dashboard...')
        onLogin(user)
      } else {
        console.error('[LoginForm] ERREUR: Connexion échouée', result.error)
        setError(result.error || "Email ou mot de passe incorrect")
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("Erreur de connexion au serveur")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/monetique-logo.png"
              alt="Monétique Tunisie"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Gestion de Stocks</CardTitle>
          <CardDescription className="text-slate-600">Connectez-vous à votre plateforme de gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
