#!/bin/bash

# Script pour exécuter les tests automatisés
# Usage: ./tests/run-tests.sh

set -e

echo "🧪 Tests automatisés de l'application de gestion de stocks"
echo "=" | awk '{for(i=0;i<60;i++) printf "="}'
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que le serveur est démarré
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Le serveur Next.js ne semble pas être démarré sur http://localhost:3000"
    echo "   Démarrez-le avec: npm run dev"
    read -p "Voulez-vous continuer quand même? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        exit 1
    fi
fi

# Vérifier que tsx est installé
if ! command -v npx tsx &> /dev/null; then
    echo "📦 Installation de tsx pour exécuter les tests..."
    npm install --save-dev tsx
fi

# Exécuter les tests
echo "🚀 Exécution des tests..."
echo ""

npx tsx tests/api-tests.ts

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tous les tests sont passés!"
else
    echo "❌ Certains tests ont échoué"
fi

exit $EXIT_CODE

