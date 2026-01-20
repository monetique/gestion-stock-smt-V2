#!/bin/bash

# Script pour corriger la création des logs d'audit dans tous les fichiers API
# Remplace les conditions "if (userData)" par des logs toujours créés

echo "🔧 Correction de la création des logs d'audit..."

# Liste des fichiers à corriger
FILES=(
  "app/api/users/[id]/route.ts"
  "app/api/roles/route.ts"
  "app/api/roles/[id]/route.ts"
  "app/api/locations/route.ts"
  "app/api/locations/[id]/route.ts"
  "app/api/config/route.ts"
  "app/api/cards/[id]/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Correction de $file"
    
    # Remplacer le parsing du header avec gestion d'erreur
    sed -i.bak 's/const userData = userHeader ? JSON\.parse(userHeader) : null/let userData = null\
    try {\
      if (userHeader) {\
        userData = JSON.parse(userHeader)\
      }\
    } catch (error) {\
      console.error('\''Error parsing user header:'\'', error)\
    }/g' "$file"
    
    # Note: Les remplacements des logs nécessitent une logique plus complexe
    # et doivent être faits manuellement pour chaque cas
  fi
done

echo "✅ Correction terminée"
echo "⚠️  Note: Les remplacements des conditions 'if (userData)' doivent être faits manuellement"


