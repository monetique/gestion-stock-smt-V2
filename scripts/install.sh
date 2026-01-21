#!/bin/bash

# Script d'installation complète de gestion-stock-smt-V2
# Usage: ./scripts/install.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Installation Complète - Gestion Stock SMT V2${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Configuration
APP_NAME="stock-management"
APP_DIR="/var/www/stock-management"
GIT_REPO="https://github.com/boujelbanemohamed/gestion-stock-smt-V2.git"
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

# Vérifier que nous sommes root ou sudo
if [ "$EUID" -ne 0 ]; then 
    warn "Certaines commandes nécessitent les privilèges sudo"
fi

echo -e "${BLUE}Étape 1: Vérification des prérequis...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js non installé"
    warn "Installez Node.js avec: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi
NODE_VERSION=$(node --version)
info "Node.js installé: $NODE_VERSION"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm non installé"
    exit 1
fi
NPM_VERSION=$(npm --version)
info "npm installé: $NPM_VERSION"

# Vérifier Git
if ! command -v git &> /dev/null; then
    error "Git non installé"
    warn "Installez avec: sudo yum install git (RedHat) ou sudo apt-get install git (Debian)"
    exit 1
fi
info "Git installé"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    warn "PostgreSQL non trouvé dans PATH - vérifiez qu'il est installé"
else
    info "PostgreSQL trouvé"
fi

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    warn "PM2 non installé - installation..."
    sudo npm install -g pm2
    info "PM2 installé"
else
    info "PM2 installé"
fi

echo ""
echo -e "${BLUE}Étape 2: Préparation du répertoire...${NC}"

# Créer le répertoire si nécessaire
if [ ! -d "$APP_DIR" ]; then
    info "Création du répertoire $APP_DIR"
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
else
    info "Répertoire $APP_DIR existe"
    read -p "Le répertoire existe déjà. Voulez-vous le nettoyer et refaire l'installation? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        warn "Nettoyage du répertoire..."
        cd "$APP_DIR"
        # Arrêter PM2 si l'application tourne
        pm2 stop "$APP_NAME" 2>/dev/null || true
        pm2 delete "$APP_NAME" 2>/dev/null || true
        cd ..
        sudo rm -rf "$APP_DIR"
        sudo mkdir -p "$APP_DIR"
        sudo chown -R $USER:$USER "$APP_DIR"
        info "Répertoire nettoyé"
    else
        warn "Installation annulée"
        exit 0
    fi
fi

cd "$APP_DIR"

echo ""
echo -e "${BLUE}Étape 3: Clonage/Mise à jour depuis Git...${NC}"

if [ -d ".git" ]; then
    info "Dépôt Git existant - mise à jour..."
    git fetch origin
    git pull origin main
else
    info "Clonage depuis $GIT_REPO..."
    git clone "$GIT_REPO" .
fi
info "Code source récupéré"

echo ""
echo -e "${BLUE}Étape 4: Installation des dépendances...${NC}"

# Supprimer node_modules si existant pour une installation propre
if [ -d "node_modules" ]; then
    warn "Nettoyage des node_modules existants..."
    rm -rf node_modules package-lock.json
fi

info "Installation des dépendances npm (cela peut prendre quelques minutes)..."
npm install
info "Dépendances installées"

echo ""
echo -e "${BLUE}Étape 5: Configuration des variables d'environnement...${NC}"

# Créer .env.production
ENV_FILE=".env.production"

if [ -f ".env" ] && [ ! -f "$ENV_FILE" ]; then
    warn "Copie de .env vers .env.production"
    cp .env "$ENV_FILE"
fi

# Demander la configuration de la base de données
echo ""
echo "Configuration de la base de données:"
read -p "Nom de la base de données [stock_management]: " DB_NAME
DB_NAME=${DB_NAME:-stock_management}

read -p "Utilisateur PostgreSQL [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Mot de passe PostgreSQL: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-postgres}

read -p "Host PostgreSQL [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port PostgreSQL [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Construire DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Générer les secrets JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Écrire dans .env.production
cat > "$ENV_FILE" << EOF
# Configuration Production
NODE_ENV="production"

# Base de données
DATABASE_URL="${DATABASE_URL}"

# Secrets JWT
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# URL de l'API
NEXT_PUBLIC_API_URL="https://gstock.monetiquetunisie.com"

# Configuration SMTP (optionnel - peut être configuré via l'interface)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@monetiquetunisie.com"
SMTP_FROM_NAME="Monetique Tunisie - Gestion de Stocks"
EOF

chmod 600 "$ENV_FILE"
info "Fichier $ENV_FILE créé"

echo ""
echo -e "${BLUE}Étape 6: Configuration Prisma...${NC}"

# Générer le client Prisma
info "Génération du client Prisma..."
npx prisma generate
info "Client Prisma généré"

# Synchroniser le schéma avec la base de données
info "Synchronisation du schéma avec la base de données..."
echo ""
read -p "Synchroniser le schéma avec la base de données? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npx prisma db push
    info "Schéma synchronisé"
else
    warn "Synchronisation du schéma ignorée"
fi

echo ""
echo -e "${BLUE}Étape 7: Création de l'utilisateur admin...${NC}"

# Vérifier si l'utilisateur admin existe
read -p "Créer/mettre à jour l'utilisateur admin ($ADMIN_EMAIL)? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Utiliser un script Node.js pour créer l'utilisateur
    cat > /tmp/create-admin.js << 'ADMINSCRIPT'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    
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

createAdmin();
ADMINSCRIPT

    ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node /tmp/create-admin.js
    rm /tmp/create-admin.js
    info "Utilisateur admin configuré"
else
    warn "Création de l'utilisateur admin ignorée"
fi

echo ""
echo -e "${BLUE}Étape 8: Build de l'application...${NC}"

# Nettoyer le build précédent
rm -rf .next
info "Cache Next.js nettoyé"

# Build
info "Build de production en cours (cela peut prendre quelques minutes)..."
npm run build

if [ $? -eq 0 ]; then
    info "Build réussi"
else
    error "Échec du build"
    exit 1
fi

echo ""
echo -e "${BLUE}Étape 9: Configuration PM2...${NC}"

# Arrêter les anciennes instances
pm2 stop "$APP_NAME" 2>/dev/null || true
pm2 delete "$APP_NAME" 2>/dev/null || true

# Démarrer l'application
info "Démarrage de l'application avec PM2..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# Configurer le démarrage automatique
info "Configuration du démarrage automatique..."
pm2 startup systemd -u $USER --hp $(eval echo ~$USER) 2>/dev/null || warn "Démarrage automatique nécessite sudo"

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
echo -e "${BLUE}Étape 10: Vérifications finales...${NC}"

# Vérifier le port
if sudo netstat -tulpn 2>/dev/null | grep -q ":3000" || sudo ss -tulpn 2>/dev/null | grep -q ":3000"; then
    info "Application écoute sur le port 3000"
else
    warn "Port 3000 non détecté"
fi

# Tester localement
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    info "Application répond sur localhost:3000"
else
    warn "Application ne répond pas sur localhost:3000"
    warn "Vérifiez les logs: pm2 logs $APP_NAME"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Installation terminée!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "Résumé de l'installation:"
echo "  • Répertoire: $APP_DIR"
echo "  • Application: $APP_NAME"
echo "  • Email admin: $ADMIN_EMAIL"
echo "  • Mot de passe admin: $ADMIN_PASSWORD"
echo "  • Port: 3000"
echo ""
echo "Informations importantes:"
echo "  • Fichier d'environnement: $ENV_FILE"
echo "  • Secrets JWT générés automatiquement"
echo "  • Application démarrée avec PM2"
echo ""
echo "Commandes utiles:"
echo "  • Voir les logs: pm2 logs $APP_NAME"
echo "  • Redémarrer: pm2 restart $APP_NAME"
echo "  • Arrêter: pm2 stop $APP_NAME"
echo "  • Statut: pm2 status"
echo ""
echo -e "${YELLOW}⚠ Configuration Nginx requise:${NC}"
echo "  Assurez-vous que Nginx pointe vers http://localhost:3000"
echo "  Voir TROUBLESHOOTING_502_GATEWAY.md pour plus de détails"
echo ""
echo -e "${YELLOW}⚠ Prochaine étape:${NC}"
echo "  1. Configurez Nginx pour pointer vers http://localhost:3000"
echo "  2. Accédez à https://gstock.monetiquetunisie.com"
echo "  3. Connectez-vous avec: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo ""

