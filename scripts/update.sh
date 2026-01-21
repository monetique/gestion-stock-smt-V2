#!/bin/bash

# Script de mise à jour de gestion-stock-smt-V2
# Usage: ./scripts/update.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔄 Mise à jour - Gestion Stock SMT V2${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Configuration
APP_NAME="stock-app"
APP_DIR="/var/www/stock-management"
ADMIN_EMAIL="mohamed.boujelbane@monetiquetunisie.com"
ADMIN_PASSWORD="SMT@2025"
IP_ADDRESS="172.17.5.199"

info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que le répertoire existe
if [ ! -d "$APP_DIR" ]; then
    error "Répertoire $APP_DIR non trouvé!"
    warn "Utilisez scripts/install.sh pour une installation complète"
    exit 1
fi

cd "$APP_DIR" || exit 1

echo -e "${BLUE}Étape 1: Vérification de l'environnement...${NC}"

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    error "PM2 non trouvé!"
    exit 1
fi

# Vérifier que l'application existe dans PM2
if pm2 list | grep -q "$APP_NAME"; then
    info "Application trouvée dans PM2"
    APP_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    if [ "$APP_STATUS" = "online" ]; then
        info "Application en cours d'exécution"
    else
        warn "Application arrêtée"
    fi
else
    warn "Application non trouvée dans PM2 - sera redémarrée après mise à jour"
fi

echo ""
echo -e "${BLUE}Étape 2: Sauvegarde de la configuration...${NC}"

# Sauvegarder .env.production si existe
if [ -f ".env.production" ]; then
    BACKUP_ENV=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.production "$BACKUP_ENV"
    info "Configuration sauvegardée: $BACKUP_ENV"
else
    warn ".env.production non trouvé"
fi

# Sauvegarder les fichiers de configuration critiques
if [ -f ".env" ] && [ ! -f ".env.production" ]; then
    warn ".env trouvé mais pas .env.production - copie..."
    cp .env .env.production
fi

echo ""
echo -e "${BLUE}Étape 3: Arrêt de l'application...${NC}"

# Arrêter l'application
if pm2 list | grep -q "$APP_NAME"; then
    info "Arrêt de l'application..."
    pm2 stop "$APP_NAME" 2>/dev/null || warn "Application déjà arrêtée"
else
    warn "Application non trouvée dans PM2"
fi

echo ""
echo -e "${BLUE}Étape 4: Mise à jour depuis Git...${NC}"

# Vérifier que c'est un dépôt Git
if [ ! -d ".git" ]; then
    error "Ce n'est pas un dépôt Git!"
    warn "Initialisation du dépôt Git..."
    git init
    git remote add origin https://github.com/boujelbanemohamed/gestion-stock-smt-V2.git
    git fetch origin
    git branch -M main
    git reset --hard origin/main
    info "Dépôt Git initialisé"
else
    # Sauvegarder les modifications locales (stash)
    if [ -n "$(git status --porcelain)" ]; then
        warn "Modifications locales détectées - sauvegarde..."
        git stash save "Sauvegarde avant mise à jour $(date +%Y-%m-%d_%H:%M:%S)"
        info "Modifications sauvegardées dans stash"
    fi
    
    # Récupérer les dernières modifications
    info "Récupération des dernières modifications..."
    git fetch origin
    
    # Afficher les commits à venir
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        info "Déjà à jour avec origin/main"
    elif [ "$LOCAL" = "$BASE" ]; then
        info "Mise à jour disponible - application des modifications..."
        git pull origin main
    elif [ "$REMOTE" = "$BASE" ]; then
        warn "Déviations locales détectées - merge nécessaire..."
        git pull origin main || {
            error "Conflit de merge détecté!"
            warn "Résolvez les conflits manuellement puis relancez le script"
            exit 1
        }
    else
        warn "Divergences détectées - merge nécessaire..."
        git pull origin main || {
            error "Conflit de merge détecté!"
            warn "Résolvez les conflits manuellement puis relancez le script"
            exit 1
        }
    fi
    
    info "Code source mis à jour"
fi

echo ""
echo -e "${BLUE}Étape 5: Mise à jour des dépendances...${NC}"

# Installer/mettre à jour les dépendances
info "Installation des dépendances (cela peut prendre quelques minutes)..."
npm install
info "Dépendances mises à jour"

echo ""
echo -e "${BLUE}Étape 6: Vérification de la configuration...${NC}"

# Vérifier et compléter .env.production
if [ ! -f ".env.production" ]; then
    warn "Création de .env.production..."
    cat > .env.production << EOF
# Configuration Production
NODE_ENV="production"

# Base de données (à configurer)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stock_management?schema=public"

# Secrets JWT (générés automatiquement si manquants)
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# URL de l'API
NEXT_PUBLIC_API_URL="https://gstock.monetiquetunisie.com"
EOF
fi

# Générer les secrets JWT s'ils manquent
if ! grep -q "JWT_SECRET=" .env.production || grep -q "JWT_SECRET=\"\"" .env.production; then
    warn "Génération des secrets JWT..."
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    # Ajouter ou remplacer les secrets
    if grep -q "JWT_SECRET=" .env.production; then
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env.production
    else
        echo "JWT_SECRET=\"$JWT_SECRET\"" >> .env.production
    fi
    
    if grep -q "JWT_REFRESH_SECRET=" .env.production; then
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"|" .env.production
    else
        echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\"" >> .env.production
    fi
    
    info "Secrets JWT générés"
fi

# Vérifier NEXT_PUBLIC_API_URL
if ! grep -q "NEXT_PUBLIC_API_URL=" .env.production; then
    echo "NEXT_PUBLIC_API_URL=\"https://gstock.monetiquetunisie.com\"" >> .env.production
    info "NEXT_PUBLIC_API_URL ajouté"
fi

chmod 600 .env.production
info "Configuration vérifiée"

echo ""
echo -e "${BLUE}Étape 7: Mise à jour Prisma...${NC}"

# Générer le client Prisma
info "Génération du client Prisma..."
npx prisma generate
info "Client Prisma généré"

# Synchroniser le schéma (optionnel, commenté par défaut)
read -p "Synchroniser le schéma de base de données? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    info "Synchronisation du schéma..."
    npx prisma db push
    info "Schéma synchronisé"
else
    info "Synchronisation du schéma ignorée"
fi

echo ""
echo -e "${BLUE}Étape 8: Mise à jour de l'utilisateur admin...${NC}"

# Vérifier/créer l'utilisateur admin
read -p "Mettre à jour l'utilisateur admin ($ADMIN_EMAIL)? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Script pour créer/mettre à jour l'admin (dans le répertoire du projet pour accéder à node_modules)
    ADMIN_SCRIPT="$APP_DIR/update-admin-temp.js"
    cat > "$ADMIN_SCRIPT" << 'ADMINSCRIPT'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    
    if (!email || !password) {
      console.error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis');
      process.exit(1);
    }
    
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Chercher l'utilisateur existant
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      // Mettre à jour
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      });
      console.log(`✓ Utilisateur admin mis à jour: ${email}`);
    } else {
      // Créer
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Mohamed',
          lastName: 'Boujelbane',
          role: 'admin',
          isActive: true
        }
      });
      console.log(`✓ Utilisateur admin créé: ${email}`);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
ADMINSCRIPT

    # Exécuter depuis le répertoire du projet pour que node_modules soit accessible
    ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node "$ADMIN_SCRIPT"
    rm -f "$ADMIN_SCRIPT"
    info "Utilisateur admin mis à jour"
else
    info "Mise à jour de l'utilisateur admin ignorée"
fi

echo ""
echo -e "${BLUE}Étape 9: Build de l'application...${NC}"

# Nettoyer le cache Next.js
info "Nettoyage du cache Next.js..."
rm -rf .next
info "Cache nettoyé"

# Build
info "Build de production en cours (cela peut prendre quelques minutes)..."
npm run build

if [ $? -eq 0 ]; then
    info "Build réussi"
else
    error "Échec du build"
    warn "Vérifiez les erreurs ci-dessus"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 10: Redémarrage de l'application...${NC}"

# Redémarrer ou démarrer l'application
if pm2 list | grep -q "$APP_NAME"; then
    info "Redémarrage de l'application..."
    pm2 restart "$APP_NAME"
else
    info "Démarrage de l'application..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
fi

# Attendre le démarrage
echo "Attente du démarrage..."
sleep 5

# Vérifier le statut
if pm2 list | grep -q "$APP_NAME.*online"; then
    info "✅ Application démarrée avec succès"
else
    error "Application non démarrée correctement"
    warn "Vérifiez les logs: pm2 logs $APP_NAME"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 11: Vérifications finales...${NC}"

# Vérifier le port
if sudo netstat -tulpn 2>/dev/null | grep -q ":3000" || sudo ss -tulpn 2>/dev/null | grep -q ":3000"; then
    info "Application écoute sur le port 3000"
else
    warn "Port 3000 non détecté - vérifiez les logs"
fi

# Tester localement
sleep 3
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    info "✅ Application répond sur localhost:3000"
else
    warn "Application ne répond pas sur localhost:3000"
    warn "Vérifiez les logs: pm2 logs $APP_NAME"
fi

# Afficher les dernières lignes des logs
echo ""
echo -e "${BLUE}Dernières lignes des logs:${NC}"
pm2 logs "$APP_NAME" --lines 5 --nostream

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Mise à jour terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Résumé:"
echo "  • Code source mis à jour depuis Git"
echo "  • Dépendances mises à jour"
echo "  • Build de production effectué"
echo "  • Application redémarrée"
echo ""
echo "Informations:"
echo "  • Email admin: $ADMIN_EMAIL"
echo "  • Application: $APP_NAME"
echo "  • Répertoire: $APP_DIR"
echo ""
echo "Commandes utiles:"
echo "  • Logs: pm2 logs $APP_NAME"
echo "  • Statut: pm2 status"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo "  • Test local: curl http://localhost:3000"
echo ""
if [ -f "$BACKUP_ENV" ]; then
    echo -e "${YELLOW}⚠ Backup de configuration: $BACKUP_ENV${NC}"
fi
echo ""

