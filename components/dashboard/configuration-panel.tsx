"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { AppConfig } from "@/lib/types"
import { getAuthHeaders } from "@/lib/api-client"
import { Mail, Bell, Eye, Shield, Save, Building2 } from "lucide-react"

export default function ConfigurationPanel() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isTestingSmtp, setIsTestingSmtp] = useState(false)
  const [smtpTestMessage, setSmtpTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<"welcome" | "lowStock" | "movement" | "userActivity">("welcome")

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config')
      const data = await response.json()
      if (data.success && data.data) {
        setConfig(data.data)
    } else {
      const defaultConfig: AppConfig = {
        general: {
          companyName: "Stock Management",
          logo: "",
          language: "fr",
          currency: "XAF",
          timezone: "Africa/Douala",
        },
        smtp: {
          host: "",
          port: 587,
          secure: true,
          username: "",
          password: "",
          fromEmail: "",
          fromName: "Stock Management",
        },
        notifications: {
          enabled: true,
          lowStockAlerts: true,
          movementNotifications: true,
          userActivityAlerts: true,
          emailNotifications: false,
          inAppNotifications: true,
          emailRecipients: [],
          lowStockThreshold: 50,
          criticalStockThreshold: 20,
        },
        display: {
          dateFormat: "DD/MM/YYYY",
          timeFormat: "24h",
          numberFormat: "fr-FR",
          itemsPerPage: 10,
          theme: "light",
        },
        security: {
          sessionDuration: 480, // 8 hours
          requireStrongPassword: true,
          minPasswordLength: 8,
          twoFactor: {
            enabled: false,
            appName: "Stock Management",
            issuer: "Stock Management Platform",
            codeLength: 6,
            codePeriod: 30,
            algorithm: "SHA1",
            mandatory: false,
            mandatoryRoles: [],
            gracePeriodDays: 7,
          },
          maxLoginAttempts: 5,
          lockoutDuration: 30,
        },
      }
      setConfig(defaultConfig)
      // Sauvegarder la config par défaut
      await fetch('/api/config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(defaultConfig)
      })
    }
    } catch (error) {
      console.error('Error loading config:', error)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      })
      const data = await response.json()
      
      if (data.success) {
        setSaveMessage({ type: "success", text: "Configuration enregistrée avec succès" })
      } else {
        setSaveMessage({ type: "error", text: data.error || "Erreur lors de l'enregistrement" })
      }
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving config:', error)
      setSaveMessage({ type: "error", text: "Erreur lors de l'enregistrement" })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestSmtp = async () => {
    if (!config) return

    setIsTestingSmtp(true)
    setSmtpTestMessage(null)
    
    try {
      const response = await fetch('/api/config/test-smtp', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          smtp: config.smtp,
          testEmail: config.smtp.fromEmail || 'test@example.com'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSmtpTestMessage({ 
          type: "success", 
          text: "Email de test envoyé avec succès ! Vérifiez votre boîte de réception." 
        })
      } else {
        setSmtpTestMessage({ 
          type: "error", 
          text: data.error || "Erreur lors du test SMTP. Vérifiez votre configuration." 
        })
      }
      
      setTimeout(() => setSmtpTestMessage(null), 5000)
    } catch (error) {
      console.error('Error testing SMTP:', error)
      setSmtpTestMessage({ 
        type: "error", 
        text: "Erreur lors du test SMTP. Vérifiez votre configuration." 
      })
      setTimeout(() => setSmtpTestMessage(null), 5000)
    } finally {
      setIsTestingSmtp(false)
    }
  }

  // Fonctions pour générer les aperçus des templates email
  const getWelcomeEmailPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Bienvenue sur la Plateforme de Gestion de Stocks</h2>
          
          <p>Bonjour Jean Dupont,</p>
          
          <p>Votre compte a été créé avec succès sur la plateforme de gestion de stocks de la Société Monétique Tunisie.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0;">Vos informations de connexion :</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Email :</strong> jean.dupont@example.com</li>
              <li style="margin: 10px 0;"><strong>Mot de passe temporaire :</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">TempPass123!</code></li>
              <li style="margin: 10px 0;"><strong>Rôle :</strong> Manager</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important :</strong> Veuillez vous connecter et changer votre mot de passe dès que possible pour des raisons de sécurité.
            </p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="#" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accéder à la plateforme
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Cet email a été envoyé automatiquement par la plateforme de gestion de stocks.<br>
            Si vous n'avez pas demandé ce compte, veuillez contacter l'administrateur.
          </p>
          
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
            Société Monétique Tunisie<br>
            Centre urbain Nord, Sana Center, bloc C – 1082, Tunis
          </p>
        </div>
      </body>
      </html>
    `
  }

  const getLowStockEmailPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">
            Alerte Stock FAIBLE
          </h2>
          
          <p>Bonjour,</p>
          
          <p>Une alerte de stock a été détectée pour la carte suivante :</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de l'alerte :</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Carte :</strong> Carte Visa Classic</li>
              <li style="margin: 10px 0;"><strong>Emplacement :</strong> Agence Centre-Ville</li>
              <li style="margin: 10px 0;"><strong>Banque :</strong> Banque Zitouna</li>
              <li style="margin: 10px 0;"><strong>Stock actuel :</strong> <span style="color: #f59e0b; font-weight: bold; font-size: 18px;">45</span></li>
              <li style="margin: 10px 0;"><strong>Seuil minimum :</strong> 100</li>
              <li style="margin: 10px 0;"><strong>Déficit :</strong> <span style="color: #f59e0b; font-weight: bold;">55 unités</span></li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Attention :</strong> Le stock est en dessous du seuil minimum. Veuillez prévoir une réapprovisionnement.
            </p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="#" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les cartes
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Cette notification a été envoyée automatiquement par la plateforme de gestion de stocks.
          </p>
        </div>
      </body>
      </html>
    `
  }

  const getMovementEmailPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">
            Mouvement de Stock : Transfert
          </h2>
          
          <p>Bonjour,</p>
          
          <p>Un nouveau mouvement de stock a été enregistré :</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails du mouvement :</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Type :</strong> <span style="color: #3b82f6; font-weight: bold;">Transfert</span></li>
              <li style="margin: 10px 0;"><strong>Carte :</strong> Carte Mastercard Gold</li>
              <li style="margin: 10px 0;"><strong>Quantité :</strong> <span style="font-weight: bold; font-size: 18px;">250</span> unités</li>
              <li style="margin: 10px 0;"><strong>De :</strong> Agence Centre-Ville</li>
              <li style="margin: 10px 0;"><strong>Vers :</strong> Agence Banlieue Nord</li>
              <li style="margin: 10px 0;"><strong>Motif :</strong> Réapprovisionnement</li>
              <li style="margin: 10px 0;"><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="#" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les mouvements
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Cette notification a été envoyée automatiquement par la plateforme de gestion de stocks.
          </p>
        </div>
      </body>
      </html>
    `
  }

  const getUserActivityEmailPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">
            Activité Utilisateur
          </h2>
          
          <p>Bonjour,</p>
          
          <p>Une activité utilisateur importante a été détectée :</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails de l'activité :</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Type d'activité :</strong> Création d'utilisateur</li>
              <li style="margin: 10px 0;"><strong>Utilisateur :</strong> Marie Martin</li>
              <li style="margin: 10px 0;"><strong>Email :</strong> marie.martin@example.com</li>
              <li style="margin: 10px 0;"><strong>Détails :</strong> Nouvel utilisateur créé avec le rôle "Operator"</li>
              <li style="margin: 10px 0;"><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="#" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir les logs
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Cette notification a été envoyée automatiquement par la plateforme de gestion de stocks.
          </p>
        </div>
      </body>
      </html>
    `
  }

  if (!config) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuration</h2>
          <p className="text-slate-600">Gérez les paramètres de l'application</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Eye className="h-4 w-4" />
            Affichage
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Informations de base de l'entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={config.general.companyName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, companyName: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo de l'entreprise</Label>
                <Input
                  id="logo"
                  value={config.general.logo}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, logo: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select
                  value={config.general.language}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, language: value },
                    })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={config.general.currency}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, currency: value },
                    })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XAF">XAF (Franc CFA)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select
                  value={config.general.timezone}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, timezone: value },
                    })
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Douala">Afrique/Douala (GMT+1)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    <SelectItem value="America/New_York">Amérique/New York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Settings */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Configuration SMTP</CardTitle>
              <CardDescription>Paramètres du serveur d'envoi d'emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Serveur SMTP</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.example.com"
                    value={config.smtp.host}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtp: { ...config.smtp, host: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.smtp.port}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtp: { ...config.smtp, port: Number.parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connexion sécurisée (SSL/TLS)</Label>
                  <p className="text-sm text-slate-500">Utiliser une connexion chiffrée</p>
                </div>
                <Switch
                  checked={config.smtp.secure}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      smtp: { ...config.smtp, secure: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="smtpUsername">Nom d'utilisateur</Label>
                <Input
                  id="smtpUsername"
                  value={config.smtp.username}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      smtp: { ...config.smtp, username: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Mot de passe</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={config.smtp.password}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      smtp: { ...config.smtp, password: e.target.value },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email d'envoi</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@example.com"
                  value={config.smtp.fromEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      smtp: { ...config.smtp, fromEmail: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">Nom de l'expéditeur</Label>
                <Input
                  id="fromName"
                  value={config.smtp.fromName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      smtp: { ...config.smtp, fromName: e.target.value },
                    })
                  }
                />
              </div>

              <Separator />

              {/* Aide pour Gmail */}
              {config.smtp.host?.includes('gmail') && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Configuration Gmail</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Pour utiliser Gmail avec cette application, vous devez :
                  </p>
                  <ol className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>1. Activer l'authentification à 2 facteurs sur votre compte Google</li>
                    <li>2. Générer un mot de passe d'application dans les paramètres de sécurité</li>
                    <li>3. Utiliser ce mot de passe d'application (pas votre mot de passe normal)</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-2">
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">
                      Guide complet pour créer un mot de passe d'application
                    </a>
                  </p>
                </div>
              )}

              {/* Bouton de test SMTP */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Test de configuration SMTP</Label>
                  <p className="text-sm text-slate-500">Envoyer un email de test pour vérifier la configuration</p>
                </div>
                <Button 
                  onClick={handleTestSmtp} 
                  disabled={isTestingSmtp || !config.smtp.host || !config.smtp.username}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isTestingSmtp ? "Test en cours..." : "Envoyer mail test"}
                </Button>
              </div>

              {/* Message de résultat du test SMTP */}
              {smtpTestMessage && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    smtpTestMessage.type === "success" 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {smtpTestMessage.text}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notifications</CardTitle>
              <CardDescription>Gérez les alertes et notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer les notifications</Label>
                  <p className="text-sm text-slate-500">Activer ou désactiver toutes les notifications</p>
                </div>
                <Switch
                  checked={config.notifications.enabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      notifications: { ...config.notifications, enabled: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Types de notifications</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes de stock bas</Label>
                    <p className="text-sm text-slate-500">Recevoir des alertes quand le stock est bas</p>
                  </div>
                  <Switch
                    checked={config.notifications.lowStockAlerts}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, lowStockAlerts: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications de mouvements</Label>
                    <p className="text-sm text-slate-500">Recevoir des notifications pour les mouvements de stock</p>
                  </div>
                  <Switch
                    checked={config.notifications.movementNotifications}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, movementNotifications: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes d'activité utilisateur</Label>
                    <p className="text-sm text-slate-500">Recevoir des alertes pour les actions des utilisateurs</p>
                  </div>
                  <Switch
                    checked={config.notifications.userActivityAlerts}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, userActivityAlerts: checked },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Canaux de notification</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-slate-500">Envoyer les notifications par email</p>
                  </div>
                  <Switch
                    checked={config.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, emailNotifications: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications dans l'application</Label>
                    <p className="text-sm text-slate-500">Afficher les notifications dans l'interface</p>
                  </div>
                  <Switch
                    checked={config.notifications.inAppNotifications}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, inAppNotifications: checked },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Seuil de stock bas</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={config.notifications.lowStockThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      notifications: { ...config.notifications, lowStockThreshold: Number.parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-slate-500">
                  Déclencher une alerte quand le stock descend en dessous de ce seuil
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="criticalStockThreshold">Seuil critique de stock</Label>
                <Input
                  id="criticalStockThreshold"
                  type="number"
                  value={config.notifications.criticalStockThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      notifications: {
                        ...config.notifications,
                        criticalStockThreshold: Number.parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-sm text-slate-500">
                  Déclencher une alerte critique quand le stock descend en dessous de ce seuil
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailRecipients">Destinataires des emails</Label>
                <Input
                  id="emailRecipients"
                  placeholder="email1@example.com, email2@example.com"
                  value={config.notifications.emailRecipients.join(", ")}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      notifications: {
                        ...config.notifications,
                        emailRecipients: e.target.value.split(",").map((email) => email.trim()),
                      },
                    })
                  }
                />
                <p className="text-sm text-slate-500">Séparez les emails par des virgules</p>
              </div>

              <Separator />

              {/* Aperçu des templates email */}
              <div className="space-y-2">
                <Label>Aperçu des templates email</Label>
                <p className="text-sm text-slate-500 mb-4">
                  Visualisez l'apparence des emails envoyés aux utilisateurs
                </p>
                <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Voir l'aperçu des templates email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Aperçu des templates email</DialogTitle>
                      <DialogDescription>
                        Visualisez l'apparence des emails qui seront envoyés aux utilisateurs
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 flex flex-col space-y-4">
                      <Tabs value={selectedEmailTemplate} onValueChange={(v) => setSelectedEmailTemplate(v as any)}>
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="welcome">Bienvenue</TabsTrigger>
                          <TabsTrigger value="lowStock">Stock bas</TabsTrigger>
                          <TabsTrigger value="movement">Mouvement</TabsTrigger>
                          <TabsTrigger value="userActivity">Activité</TabsTrigger>
                        </TabsList>
                        <TabsContent value="welcome" className="flex-1 min-h-0 mt-4">
                          <div className="border rounded-lg overflow-hidden bg-white h-full">
                            <iframe
                              srcDoc={getWelcomeEmailPreview()}
                              className="w-full h-full min-h-[500px] border-0"
                              title="Aperçu email de bienvenue"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="lowStock" className="flex-1 min-h-0 mt-4">
                          <div className="border rounded-lg overflow-hidden bg-white h-full">
                            <iframe
                              srcDoc={getLowStockEmailPreview()}
                              className="w-full h-full min-h-[500px] border-0"
                              title="Aperçu email alerte stock bas"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="movement" className="flex-1 min-h-0 mt-4">
                          <div className="border rounded-lg overflow-hidden bg-white h-full">
                            <iframe
                              srcDoc={getMovementEmailPreview()}
                              className="w-full h-full min-h-[500px] border-0"
                              title="Aperçu email notification mouvement"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="userActivity" className="flex-1 min-h-0 mt-4">
                          <div className="border rounded-lg overflow-hidden bg-white h-full">
                            <iframe
                              srcDoc={getUserActivityEmailPreview()}
                              className="w-full h-full min-h-[500px] border-0"
                              title="Aperçu email alerte activité utilisateur"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'affichage</CardTitle>
              <CardDescription>Personnalisez l'apparence de l'interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Format de date</Label>
                <Select
                  value={config.display.dateFormat}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      display: { ...config.display, dateFormat: value },
                    })
                  }
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                    <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat">Format d'heure</Label>
                <Select
                  value={config.display.timeFormat}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      display: { ...config.display, timeFormat: value as "12h" | "24h" },
                    })
                  }
                >
                  <SelectTrigger id="timeFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="12h">12h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberFormat">Format de nombre</Label>
                <Select
                  value={config.display.numberFormat}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      display: { ...config.display, numberFormat: value },
                    })
                  }
                >
                  <SelectTrigger id="numberFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr-FR">1 234,56 (Français)</SelectItem>
                    <SelectItem value="en-US">1,234.56 (Anglais)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemsPerPage">Éléments par page</Label>
                <Select
                  value={config.display.itemsPerPage.toString()}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      display: { ...config.display, itemsPerPage: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger id="itemsPerPage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>Configurez les options de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Durée de session (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  value={config.security.sessionDuration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, sessionDuration: Number.parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-slate-500">Durée avant déconnexion automatique</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exiger un mot de passe fort</Label>
                  <p className="text-sm text-slate-500">Imposer des règles de complexité pour les mots de passe</p>
                </div>
                <Switch
                  checked={config.security.requireStrongPassword}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, requireStrongPassword: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Longueur minimale du mot de passe</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  value={config.security.minPasswordLength}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, minPasswordLength: Number.parseInt(e.target.value) },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Authentification à deux facteurs (2FA)</Label>
                    <p className="text-sm text-slate-500">
                      Compatible avec Google Authenticator et Microsoft Authenticator
                    </p>
                  </div>
                  <Switch
                    checked={config.security.twoFactor.enabled}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        security: {
                          ...config.security,
                          twoFactor: { ...config.security.twoFactor, enabled: checked },
                        },
                      })
                    }
                  />
                </div>

                {config.security.twoFactor.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="twoFactorAppName">Nom de l'application</Label>
                        <Input
                          id="twoFactorAppName"
                          value={config.security.twoFactor.appName}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: { ...config.security.twoFactor, appName: e.target.value },
                              },
                            })
                          }
                        />
                        <p className="text-xs text-slate-500">Affiché dans l'authenticator</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twoFactorIssuer">Émetteur</Label>
                        <Input
                          id="twoFactorIssuer"
                          value={config.security.twoFactor.issuer}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: { ...config.security.twoFactor, issuer: e.target.value },
                              },
                            })
                          }
                        />
                        <p className="text-xs text-slate-500">Nom de l'organisation</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="codeLength">Longueur du code</Label>
                        <Select
                          value={config.security.twoFactor.codeLength.toString()}
                          onValueChange={(value) =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: { ...config.security.twoFactor, codeLength: Number.parseInt(value) },
                              },
                            })
                          }
                        >
                          <SelectTrigger id="codeLength">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 chiffres</SelectItem>
                            <SelectItem value="8">8 chiffres</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codePeriod">Période (secondes)</Label>
                        <Select
                          value={config.security.twoFactor.codePeriod.toString()}
                          onValueChange={(value) =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: { ...config.security.twoFactor, codePeriod: Number.parseInt(value) },
                              },
                            })
                          }
                        >
                          <SelectTrigger id="codePeriod">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 secondes</SelectItem>
                            <SelectItem value="60">60 secondes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="algorithm">Algorithme</Label>
                        <Select
                          value={config.security.twoFactor.algorithm}
                          onValueChange={(value: "SHA1" | "SHA256" | "SHA512") =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: { ...config.security.twoFactor, algorithm: value },
                              },
                            })
                          }
                        >
                          <SelectTrigger id="algorithm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SHA1">SHA1</SelectItem>
                            <SelectItem value="SHA256">SHA256</SelectItem>
                            <SelectItem value="SHA512">SHA512</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>2FA obligatoire</Label>
                        <p className="text-sm text-slate-500">Forcer tous les utilisateurs à activer la 2FA</p>
                      </div>
                      <Switch
                        checked={config.security.twoFactor.mandatory}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            security: {
                              ...config.security,
                              twoFactor: { ...config.security.twoFactor, mandatory: checked },
                            },
                          })
                        }
                      />
                    </div>

                    {config.security.twoFactor.mandatory && (
                      <div className="space-y-2">
                        <Label htmlFor="gracePeriodDays">Période de grâce (jours)</Label>
                        <Input
                          id="gracePeriodDays"
                          type="number"
                          value={config.security.twoFactor.gracePeriodDays}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              security: {
                                ...config.security,
                                twoFactor: {
                                  ...config.security.twoFactor,
                                  gracePeriodDays: Number.parseInt(e.target.value),
                                },
                              },
                            })
                          }
                        />
                        <p className="text-xs text-slate-500">Délai accordé aux utilisateurs pour activer la 2FA</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="mandatoryRoles">Rôles obligatoires</Label>
                      <Input
                        id="mandatoryRoles"
                        placeholder="admin, manager"
                        value={(config.security.twoFactor.mandatoryRoles || []).join(", ")}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            security: {
                              ...config.security,
                              twoFactor: {
                                ...config.security.twoFactor,
                                mandatoryRoles: e.target.value.split(",").map((role) => role.trim()),
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Tentatives de connexion maximales</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={config.security.maxLoginAttempts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, maxLoginAttempts: Number.parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-slate-500">Nombre de tentatives avant blocage du compte</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Durée de verrouillage (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  value={config.security.lockoutDuration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, lockoutDuration: Number.parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-slate-500">Durée de blocage après échec des tentatives de connexion</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
