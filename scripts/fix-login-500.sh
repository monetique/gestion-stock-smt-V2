#!/bin/bash

# Script de résolution automatique de l'erreur 500 sur /api/auth/login
# Usage: ./scripts/fix-login-500.sh

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Résolution Erreur 500 sur /api/auth/login${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Fonctions utilitaires
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Erreur: package.json introuvable."
    error "Exécutez ce script depuis le répertoire racine de l'application."
    exit 1
fi

APP_NAME="stock-managment"

echo -e "${BLUE}Étape 1: Vérification des fichiers d'environnement...${NC}"

# Déterminer quel fichier .env utiliser
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    warn ".env.production non trouvé, utilisation de .env"
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    error "Aucun fichier .env ou .env.production trouvé!"
    exit 1
fi

info "Fichier d'environnement: $ENV_FILE"

echo ""
echo -e "${BLUE}Étape 2: Vérification et ajout des secrets JWT...${NC}"

# Vérifier et ajouter JWT_SECRET
if ! grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    warn "JWT_SECRET manquant, génération..."
    JWT_SECRET=$(openssl rand -base64 32)
    echo "JWT_SECRET=\"$JWT_SECRET\"" >> "$ENV_FILE"
    info "JWT_SECRET ajouté dans $ENV_FILE"
else
    info "JWT_SECRET déjà présent"
fi

# Vérifier et ajouter JWT_REFRESH_SECRET
if ! grep -q "^JWT_REFRESH_SECRET=" "$ENV_FILE"; then
    warn "JWT_REFRESH_SECRET manquant, génération..."
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"" >> "$ENV_FILE"
    info "JWT_REFRESH_SECRET ajouté dans $ENV_FILE"
else
    info "JWT_REFRESH_SECRET déjà présent"
fi

echo ""
echo -e "${BLUE}Étape 3: Vérification de NODE_ENV...${NC}"

if ! grep -q "^NODE_ENV=" "$ENV_FILE"; then
    warn "NODE_ENV manquant, ajout..."
    echo 'NODE_ENV="production"' >> "$ENV_FILE"
    info "NODE_ENV=\"production\" ajouté"
else
    NODE_ENV_VALUE=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ "$NODE_ENV_VALUE" != "production" ]; then
        warn "NODE_ENV=$NODE_ENV_VALUE, devrait être 'production'"
        # Ne pas modifier automatiquement, juste avertir
    else
        info "NODE_ENV correctement défini"
    fi
fi

echo ""
echo -e "${BLUE}Étape 4: Vérification de DATABASE_URL...${NC}"

if ! grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    error "DATABASE_URL manquant dans $ENV_FILE!"
    warn "Vous devez configurer DATABASE_URL manuellement"
else
    info "DATABASE_URL présent"
    # Masquer le mot de passe pour l'affichage
    DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/:[^:]*@/:****@/g')
    echo "   $DB_URL"
fi

echo ""
echo -e "${BLUE}Étape 5: Vérification des permissions...${NC}"

chmod 600 "$ENV_FILE" 2>/dev/null || warn "Impossible de modifier les permissions de $ENV_FILE"
info "Permissions vérifiées"

echo ""
echo -e "${BLUE}Étape 6: Test de connexion à la base de données...${NC}"

if command -v psql &> /dev/null; then
    # Essayer de tester la connexion
    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        info "Connexion à la base de données OK"
    else
        warn "Impossible de tester la connexion à la base de données"
        warn "Vérifiez que PostgreSQL est démarré et que DATABASE_URL est correct"
    fi
else
    warn "psql non trouvé, test de connexion ignoré"
fi

echo ""
echo -e "${BLUE}Étape 7: Vérification de PM2...${NC}"

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    error "PM2 non trouvé!"
    warn "Installez PM2 avec: npm install -g pm2"
    warn "Puis démarrez l'application manuellement avec: npm start"
    exit 1
fi

info "PM2 trouvé"

# Vérifier si l'application est dans PM2
if pm2 list | grep -q "$APP_NAME"; then
    info "Application trouvée dans PM2: $APP_NAME"
    
    echo ""
    echo -e "${BLUE}Étape 8: Redémarrage de l'application...${NC}"
    
    pm2 restart "$APP_NAME"
    info "Application redémarrée"
    
    # Attendre que l'application démarre
    echo "Attente du démarrage de l'application..."
    sleep 5
    
    # Vérifier le statut
    if pm2 list | grep -q "$APP_NAME.*online"; then
        info "Application en ligne"
    else
        error "Application non en ligne, vérifiez les logs: pm2 logs $APP_NAME"
    fi
else
    warn "Application '$APP_NAME' non trouvée dans PM2"
    warn "Liste des applications PM2:"
    pm2 list
    
    read -p "Voulez-vous démarrer l'application avec PM2? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}Démarrage de l'application...${NC}"
        pm2 start npm --name "$APP_NAME" -- start
        pm2 save
        info "Application démarrée"
        
        sleep 5
        
        if pm2 list | grep -q "$APP_NAME.*online"; then
            info "Application en ligne"
        else
            error "Erreur au démarrage, vérifiez les logs: pm2 logs $APP_NAME"
        fi
    else
        warn "Démarrez l'application manuellement avec: pm2 start npm --name \"$APP_NAME\" -- start"
    fi
fi

echo ""
echo -e "${BLUE}Étape 9: Vérification des logs récents...${NC}"

if pm2 list | grep -q "$APP_NAME.*online"; then
    echo "Derniers logs:"
    pm2 logs "$APP_NAME" --lines 10 --nostream 2>/dev/null | tail -10
    
    # Chercher les erreurs
    ERROR_COUNT=$(pm2 logs "$APP_NAME" --lines 50 --nostream 2>/dev/null | grep -i "error" | wc -l || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        warn "$ERROR_COUNT erreur(s) trouvée(s) dans les logs récents"
        echo "Pour voir les erreurs: pm2 logs $APP_NAME --err"
    else
        info "Aucune erreur récente détectée"
    fi
fi

echo ""
echo -e "${BLUE}Étape 10: Test de l'endpoint de login...${NC}"

# Tester l'endpoint
sleep 2
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>/dev/null || echo "000")

if [ "$RESPONSE" = "401" ]; then
    info "Endpoint /api/auth/login répond (erreur 401 normale pour credentials invalides)"
    info "✅ Le problème est résolu! Vous pouvez maintenant vous connecter."
elif [ "$RESPONSE" = "400" ]; then
    info "Endpoint /api/auth/login répond (erreur 400 normale)"
    info "✅ Le problème est résolu! Vous pouvez maintenant vous connecter."
elif [ "$RESPONSE" = "500" ]; then
    error "L'endpoint retourne toujours une erreur 500"
    warn "Vérifiez les logs pour plus de détails: pm2 logs $APP_NAME --lines 50"
elif [ "$RESPONSE" = "000" ]; then
    warn "Impossible de contacter l'application (pas de réponse)"
    warn "Vérifiez que l'application est bien démarrée: pm2 status"
else
    info "Endpoint répond avec le code HTTP: $RESPONSE"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Résolution terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Résumé des actions effectuées:"
echo "  • Secrets JWT vérifiés/ajoutés dans $ENV_FILE"
echo "  • NODE_ENV vérifié"
echo "  • Application redémarrée"
echo ""
echo "Commandes utiles:"
echo "  • Voir les logs: pm2 logs $APP_NAME"
echo "  • Voir les erreurs: pm2 logs $APP_NAME --err"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo "  • Statut: pm2 status"
echo ""
echo -e "${YELLOW}⚠ Important:${NC}"
echo "  • Testez maintenant la connexion depuis votre navigateur"
echo "  • Si le problème persiste, vérifiez les logs: pm2 logs $APP_NAME --lines 100"
echo ""

