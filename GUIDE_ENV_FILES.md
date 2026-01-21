# 📋 Guide des fichiers d'environnement

## Fichiers à utiliser

### En production (serveur RedHat)

**Utilisez `.env.production`**

C'est le fichier utilisé par Next.js quand `NODE_ENV=production`.

### En développement local

**Utilisez `.env.local` ou `.env`**

Ces fichiers sont pour votre environnement de développement local.

---

## Ordre de priorité Next.js

Next.js charge les variables d'environnement dans cet ordre (le dernier écrase les précédents) :

1. `.env` (tous les environnements)
2. `.env.local` (ignoré par Git, pour tous les environnements)
3. `.env.production` (uniquement si `NODE_ENV=production`)
4. `.env.production.local` (ignoré par Git, production uniquement)

---

## Configuration pour votre serveur

Sur le serveur RedHat (172.17.5.199), vous devez :

### 1. Utiliser `.env.production`

```bash
cd /var/www/stock-management

# Vérifier que le fichier existe
ls -la .env.production

# Si il n'existe pas, le créer avec :
cat > .env.production << EOF
NODE_ENV="production"

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/stock_management?schema=public"

# Secrets JWT (obligatoires)
JWT_SECRET="votre-secret-jwt-au-moins-32-caracteres"
JWT_REFRESH_SECRET="votre-refresh-secret-au-moins-32-caracteres"

# URL de l'API
NEXT_PUBLIC_API_URL="https://gstock.monetiquetunisie.com"
EOF
```

### 2. S'assurer que `NODE_ENV=production` est défini

Vérifier dans `.env.production` :

```bash
grep NODE_ENV .env.production
# Doit afficher : NODE_ENV="production"
```

### 3. S'assurer que PM2 charge le bon environnement

PM2 doit démarrer l'application avec `NODE_ENV=production`.

Vérifier la commande PM2 :

```bash
pm2 show stock-management
```

La commande doit être :
```bash
npm start
# ou
next start
```

Et PM2 doit charger automatiquement `.env.production` si `NODE_ENV=production`.

---

## Vérification

### Vérifier que les variables sont chargées

```bash
# Sur le serveur, vérifier que les variables sont bien définies
cd /var/www/stock-management

# Méthode 1: Vérifier le fichier
cat .env.production | grep -E "^(NODE_ENV|JWT_SECRET|DATABASE_URL)="

# Méthode 2: Vérifier les logs PM2 au démarrage
pm2 logs stock-management | grep -i "env\|secret" | head -10
```

---

## Structure recommandée

### Sur le serveur (`/var/www/stock-management`)

```
/var/www/stock-management/
├── .env.production      ← UTILISEZ CELUI-CI
├── .env                 ← Peut exister mais sera ignoré si .env.production existe
└── ...
```

### En développement local

```
/Users/mohamed/gestion-stock-smt-V2/
├── .env.local          ← Utilisez celui-ci (non versionné)
├── .env                ← Peut être utilisé aussi
└── .env.production     ← NE PAS utiliser en local (sauf pour tests)
```

---

## Important

1. **`.env.production` ne doit JAMAIS être commité sur Git** (contenir des secrets)
2. **Créez `.env.production` directement sur le serveur**
3. **Ne copiez jamais `.env.local` vers le serveur**
4. **Vérifiez toujours que `NODE_ENV=production` est défini sur le serveur**

---

## Résumé

| Environnement | Fichier à utiliser | Emplacement |
|--------------|-------------------|-------------|
| **Production (serveur)** | `.env.production` | `/var/www/stock-management/.env.production` |
| **Développement local** | `.env.local` ou `.env` | `/Users/mohamed/.../.env.local` |

**Sur votre serveur, utilisez uniquement `.env.production` !**

