#!/bin/bash

# Script pour créer/mettre à jour l'utilisateur admin
# Usage: ./scripts/create-admin.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ADMIN_EMAIL="mohamed.boujelbane@monetiquetunisie.com"
ADMIN_PASSWORD="SMT@2025"

echo -e "${GREEN}Création/Mise à jour de l'utilisateur admin...${NC}"

# Créer le script Node.js temporaire
cat > /tmp/create-admin-temp.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
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
    
    console.log(`✓ Mot de passe: ${password}`);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
EOF

# Exécuter le script
cd "$(dirname "$0")/.." || exit 1
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node /tmp/create-admin-temp.js

# Nettoyer
rm /tmp/create-admin-temp.js

echo -e "${GREEN}✅ Terminé!${NC}"

