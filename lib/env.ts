/**
 * Validation des variables d'environnement
 * Utilise Zod pour valider et typer les variables d'environnement au démarrage
 */

import { z } from "zod"

// Schéma de validation pour les variables d'environnement côté serveur
const serverEnvSchema = z.object({
  // Base de données
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  
  // Environnement
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // URL de l'API (optionnel, avec valeur par défaut)
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  
  // JWT Secrets (optionnels en développement, requis en production)
  JWT_SECRET: z.string().min(32, "JWT_SECRET doit contenir au moins 32 caractères").optional(),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET doit contenir au moins 32 caractères").optional(),
  
  // Variables optionnelles pour le développement
  ESLINT_DISABLE: z.string().optional(),
  TYPESCRIPT_DISABLE: z.string().optional(),
})

// Schéma pour les variables publiques (accessibles côté client)
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
})

/**
 * Valide et retourne les variables d'environnement côté serveur
 * @throws {Error} Si une variable requise est manquante ou invalide
 */
function getServerEnv() {
  try {
    return serverEnvSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV || "development",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      ESLINT_DISABLE: process.env.ESLINT_DISABLE,
      TYPESCRIPT_DISABLE: process.env.TYPESCRIPT_DISABLE,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n")
      throw new Error(
        `❌ Variables d'environnement invalides ou manquantes:\n${missingVars}\n\n` +
        `Veuillez vérifier votre fichier .env et ajouter les variables manquantes.\n` +
        `Consultez .env.example pour la liste complète des variables requises.`
      )
    }
    throw error
  }
}

/**
 * Valide et retourne les variables d'environnement publiques
 */
function getPublicEnv() {
  try {
    return publicEnvSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("⚠️ Variables d'environnement publiques invalides:", error.errors)
    }
    return {
      NEXT_PUBLIC_API_URL: undefined,
    }
  }
}

// Valider les variables au chargement du module
let serverEnv: z.infer<typeof serverEnvSchema>
let publicEnv: z.infer<typeof publicEnvSchema>

try {
  serverEnv = getServerEnv()
  publicEnv = getPublicEnv()
  
  // Logger les variables chargées (masquer les valeurs sensibles)
  if (serverEnv.NODE_ENV === "development") {
    console.log("✅ Variables d'environnement validées:")
    console.log(`  - NODE_ENV: ${serverEnv.NODE_ENV}`)
    console.log(`  - DATABASE_URL: ${serverEnv.DATABASE_URL ? "✓ Configuré" : "✗ Manquant"}`)
    console.log(`  - NEXT_PUBLIC_API_URL: ${serverEnv.NEXT_PUBLIC_API_URL || "Non défini (utilisera localhost:3000)"}`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Erreur de validation des variables d'environnement")
  
  // En production, on veut que l'application crash si les variables sont invalides
  const nodeEnv = process.env.NODE_ENV || "development"
  if (nodeEnv === "production") {
    throw error
  }
  
  // En développement, on peut continuer avec des valeurs par défaut pour éviter de bloquer
  console.warn("⚠️ Continuation avec des valeurs par défaut en développement...")
  serverEnv = {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/db",
    NODE_ENV: "development",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  } as z.infer<typeof serverEnvSchema>
  
  publicEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
}

/**
 * Variables d'environnement validées côté serveur
 * Utilisez cette constante au lieu de process.env directement
 */
export const env: z.infer<typeof serverEnvSchema> = serverEnv

/**
 * Variables d'environnement publiques (accessibles côté client)
 */
export const publicEnvValidated: z.infer<typeof publicEnvSchema> = publicEnv

/**
 * Helper pour obtenir l'URL de l'API avec fallback (côté serveur)
 */
export function getServerApiUrl(): string {
  return publicEnvValidated.NEXT_PUBLIC_API_URL || "http://localhost:3000"
}

/**
 * Helper pour obtenir l'URL de l'API avec fallback (côté client)
 */
export function getClientApiUrl(): string {
  if (typeof window !== "undefined") {
    return publicEnvValidated.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.host}`
  }
  return publicEnvValidated.NEXT_PUBLIC_API_URL || "http://localhost:3000"
}

/**
 * Helper pour obtenir l'URL de l'API avec fallback (compatible client et serveur)
 * @deprecated Utilisez getServerApiUrl() ou getClientApiUrl() selon le contexte
 */
export function getApiUrl(): string {
  return typeof window !== "undefined" ? getClientApiUrl() : getServerApiUrl()
}

