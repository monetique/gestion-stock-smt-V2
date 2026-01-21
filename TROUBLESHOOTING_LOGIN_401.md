# 🔧 Résolution Erreur 401 - Authentification JWT

Si vous recevez une erreur 401 sur `/api/auth/me` après la connexion, voici comment diagnostiquer et résoudre le problème.

---

## 🔍 Diagnostic

### Étape 1: Vérifier les logs PM2

```bash
# Voir les erreurs récentes
pm2 logs stock-management --err --lines 50

# Chercher les erreurs JWT spécifiques
pm2 logs stock-management | grep -i "jwt\|token\|unauthorized"
```

**Cherchez des messages comme :**
- "Token invalide"
- "Token expiré"
- "JWT_SECRET manquant"

---

### Étape 2: Vérifier les secrets JWT

```bash
cd /var/www/stock-management

# Vérifier que les secrets sont dans .env.production
grep JWT_SECRET .env.production

# Les secrets doivent être définis et avoir au moins 32 caractères
```

**Les secrets doivent ressembler à :**
```
JWT_SECRET="abc123...xyz (au moins 32 caractères)"
JWT_REFRESH_SECRET="def456...uvw (au moins 32 caractères)"
```

---

### Étape 3: Vérifier que les secrets sont identiques

Le problème le plus courant est que le `JWT_SECRET` utilisé pour **signer** le token (dans `/api/auth/login`) est différent de celui utilisé pour **vérifier** le token (dans le middleware).

```bash
# Vérifier les logs au démarrage
pm2 logs stock-management | grep -i "env\|secret" | head -20

# Redémarrer l'application pour voir les logs de démarrage
pm2 restart stock-management
pm2 logs stock-management --lines 30
```

---

## ✅ Solutions

### Solution 1: Vérifier que .env.production est chargé

```bash
cd /var/www/stock-management

# Vérifier que le fichier existe
ls -la .env.production

# Vérifier son contenu (sans afficher les valeurs complètes)
grep -E "^JWT_" .env.production | cut -c1-30
```

Si le fichier n'existe pas ou est vide, créez-le :

```bash
# Générer de nouveaux secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Ajouter au fichier .env.production
cat >> .env.production << EOF
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
EOF

# Redémarrer l'application
pm2 restart stock-management
```

---

### Solution 2: Vérifier que PM2 charge les variables d'environnement

PM2 peut ne pas charger automatiquement `.env.production`. Vérifiez la configuration PM2 :

```bash
# Voir la configuration actuelle
pm2 show stock-management

# Si les variables ne sont pas chargées, vous pouvez :
# 1. Utiliser un fichier ecosystem.config.js
# 2. Ou charger manuellement les variables
```

Créer un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'stock-management',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/stock-management',
    env_file: '/var/www/stock-management/.env.production',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

Puis redémarrer :

```bash
pm2 delete stock-management
pm2 start ecosystem.config.js
pm2 save
```

---

### Solution 3: Redémarrer complètement l'application

Parfois, les variables d'environnement ne sont pas rechargées. Redémarrer complètement :

```bash
cd /var/www/stock-management

# Arrêter
pm2 stop stock-management
pm2 delete stock-management

# Vérifier que les variables sont bien définies
source .env.production
echo $JWT_SECRET | wc -c  # Doit afficher au moins 33 (32 chars + newline)

# Redémarrer
pm2 start npm --name "stock-management" -- start
pm2 save
```

---

### Solution 4: Vérifier que le build utilise les bonnes variables

Si vous avez rebuild l'application, vérifiez que les variables sont bien prises en compte :

```bash
cd /var/www/stock-management

# Vérifier que .env.production existe
test -f .env.production && echo "✓ .env.production existe" || echo "✗ .env.production manquant"

# Rebuild
npm run build

# Redémarrer
pm2 restart stock-management
```

---

## 🧪 Test de diagnostic

Utilisez le script de test :

```bash
cd /var/www/stock-management
./scripts/test-jwt.sh
```

---

## 🔍 Vérifications supplémentaires

### Vérifier que le token est bien formaté

Dans la console du navigateur (F12), après la connexion :

```javascript
const token = localStorage.getItem('accessToken')
console.log('Token:', token ? token.substring(0, 50) + '...' : 'Aucun token')

// Décoder le token (sans vérifier la signature)
const parts = token.split('.')
if (parts.length === 3) {
  const payload = JSON.parse(atob(parts[1]))
  console.log('Payload:', payload)
  console.log('Expires:', new Date(payload.exp * 1000))
}
```

---

### Vérifier les erreurs dans le middleware

Ajoutez temporairement des logs dans `app/middleware.ts` pour voir exactement quelle erreur se produit :

```typescript
} catch (error) {
  console.error('JWT Verification Error:', error)
  logger.warn("Unauthorized API request - Invalid token", { pathname, error: String(error) })
  // ...
}
```

Puis vérifiez les logs :

```bash
pm2 logs stock-management --err | grep "JWT Verification Error"
```

---

## ⚠️ Problèmes courants

### 1. JWT_SECRET différent entre build et runtime

**Symptôme :** Token signé avec un secret, vérifié avec un autre.

**Solution :** Assurez-vous que `.env.production` est chargé au runtime, pas seulement au build.

### 2. JWT_SECRET vide ou trop court

**Symptôme :** "JWT_SECRET doit contenir au moins 32 caractères"

**Solution :** Générez un nouveau secret d'au moins 32 caractères.

### 3. Token expiré

**Symptôme :** "Token expiré"

**Solution :** Les tokens d'accès expirent après 15 minutes. Utilisez le refresh token pour obtenir un nouveau token.

---

## 📋 Checklist de résolution

- [ ] `.env.production` existe et contient `JWT_SECRET` et `JWT_REFRESH_SECRET`
- [ ] Les secrets ont au moins 32 caractères
- [ ] Les secrets sont identiques partout (pas de duplication avec des valeurs différentes)
- [ ] PM2 charge bien les variables d'environnement
- [ ] L'application a été redémarrée après modification de `.env.production`
- [ ] Les logs ne montrent pas d'erreur "JWT_SECRET manquant" ou "Token invalide"
- [ ] Le token dans localStorage est valide (pas expiré)

---

**Commencez par vérifier les logs PM2 et que les secrets JWT sont bien définis !**

