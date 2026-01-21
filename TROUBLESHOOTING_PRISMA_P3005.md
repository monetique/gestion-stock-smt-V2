# 🔧 Résolution de l'Erreur P3005 - Prisma Migrate Deploy

L'erreur P3005 se produit généralement lorsque le schéma de la base de données ne correspond pas aux migrations Prisma.

---

## 🔍 Diagnostic de l'Erreur

### Vérifier l'erreur exacte

```bash
# Exécuter avec plus de détails
npx prisma migrate deploy --verbose
```

---

## ✅ Solutions

### Solution 1: Utiliser `prisma db push` (Recommandé pour synchronisation rapide)

Si vous n'avez pas besoin de garder l'historique des migrations, utilisez `db push` qui synchronise directement le schéma :

```bash
# Synchroniser le schéma sans migrations
npx prisma db push

# Puis régénérer le client
npx prisma generate
```

**Avantages:**
- Plus rapide
- Synchronise directement le schéma
- Pas besoin de fichiers de migration

**Inconvénients:**
- Ne garde pas l'historique des migrations
- À utiliser avec précaution en production

---

### Solution 2: Créer une Migration Baseline

Si vous voulez garder l'historique des migrations, créez une baseline :

```bash
# 1. Vérifier l'état actuel
npx prisma migrate status

# 2. Marquer les migrations existantes comme appliquées
npx prisma migrate resolve --applied <migration-name>

# OU créer une nouvelle migration baseline
npx prisma migrate dev --name init --create-only
npx prisma migrate resolve --applied init
```

---

### Solution 3: Réinitialiser les Migrations (Attention!)

**⚠️ UNIQUEMENT SI VOUS ÊTES SÛR ET SI VOUS AVEZ SAUVEGARDÉ LA BASE DE DONNÉES**

```bash
# 1. SAUVEGARDER LA BASE DE DONNÉES D'ABORD!
pg_dump -U postgres -d stock_management > backup_avant_reset.sql

# 2. Supprimer le dossier migrations
rm -rf prisma/migrations

# 3. Créer une nouvelle migration initiale
npx prisma migrate dev --name init

# 4. Ensuite utiliser deploy
npx prisma migrate deploy
```

---

### Solution 4: Marquer la Base de Données comme à Jour

Si votre base de données est déjà à jour mais Prisma ne le reconnaît pas :

```bash
# 1. Vérifier l'état
npx prisma migrate status

# 2. Si des migrations sont listées comme "pending", les marquer comme appliquées
npx prisma migrate resolve --applied <nom-de-la-migration>

# Ou pour toutes les migrations en attente
npx prisma migrate resolve --applied $(npx prisma migrate status --json | jq -r '.pending[]')
```

---

### Solution 5: Synchroniser avec `prisma db pull`

Si votre base de données existe déjà et n'a jamais été gérée par Prisma :

```bash
# 1. Extraire le schéma depuis la base de données
npx prisma db pull

# 2. Comparer avec votre schema.prisma
# 3. Créer une migration baseline
npx prisma migrate dev --name baseline --create-only

# 4. Marquer comme appliquée
npx prisma migrate resolve --applied baseline

# 5. Ensuite deploy fonctionnera
npx prisma migrate deploy
```

---

## 🛠️ Commandes de Diagnostic

### Vérifier l'état de la base de données

```bash
# Vérifier l'état des migrations
npx prisma migrate status

# Vérifier la connexion à la base de données
npx prisma db execute --stdin <<< "SELECT 1;"

# Voir le schéma actuel de la base de données
npx prisma db pull --print
```

### Vérifier les fichiers de migration

```bash
# Lister les migrations
ls -la prisma/migrations/

# Voir le contenu d'une migration
cat prisma/migrations/<nom-migration>/migration.sql
```

---

## 📋 Procédure Recommandée pour Production

### Option A: Si vous n'avez jamais utilisé Prisma Migrate

```bash
# 1. Sauvegarder la base de données
pg_dump -U postgres -d stock_management > backup.sql

# 2. Utiliser db push pour synchroniser
npx prisma db push

# 3. Régénérer le client
npx prisma generate

# 4. Pour les prochaines fois, utiliser migrate
npx prisma migrate dev --name next_change
```

### Option B: Si vous voulez utiliser Migrate maintenant

```bash
# 1. Sauvegarder la base de données
pg_dump -U postgres -d stock_management > backup.sql

# 2. Créer une migration baseline
npx prisma migrate dev --name baseline --create-only

# 3. Vérifier que la migration correspond au schéma actuel
cat prisma/migrations/*baseline*/migration.sql

# 4. Si tout est OK, l'appliquer
npx prisma migrate deploy

# 5. OU si elle est déjà appliquée, la marquer comme résolue
npx prisma migrate resolve --applied baseline
```

---

## ⚠️ Solution Rapide pour Continuation

Si vous voulez juste continuer le déploiement maintenant :

```bash
# Utiliser db push au lieu de migrate deploy
npx prisma db push

# Régénérer le client
npx prisma generate

# Continuer avec le build
npm run build
```

**Note:** `db push` synchronise le schéma sans créer de fichiers de migration. C'est parfait si vous voulez juste synchroniser rapidement.

---

## 🔍 Causes Courantes de l'Erreur P3005

1. **Base de données modifiée manuellement** - Quelqu'un a modifié la structure de la DB sans passer par Prisma
2. **Migrations non synchronisées** - Les migrations dans le code ne correspondent pas à l'état de la DB
3. **Première utilisation** - La base de données existait avant l'utilisation de Prisma Migrate
4. **Dossier migrations supprimé** - Le dossier `prisma/migrations` a été supprimé ou n'existe pas

---

## ✅ Vérification Post-Résolution

```bash
# Vérifier que tout est OK
npx prisma migrate status

# Tester une requête simple
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"

# Vérifier le client Prisma
npx prisma generate
npm run build
```

---

## 📞 Si Rien Ne Fonctionne

1. **Sauvegarder tout** :
   ```bash
   pg_dump -U postgres -d stock_management > backup_complet.sql
   cp prisma/schema.prisma prisma/schema.prisma.backup
   ```

2. **Recréer proprement** :
   ```bash
   # Supprimer le dossier migrations
   rm -rf prisma/migrations
   
   # Utiliser db push (plus simple)
   npx prisma db push
   
   # Pour les futures modifications, créer des migrations
   npx prisma migrate dev --name first_migration
   ```

---

**Dans votre cas, je recommande d'utiliser `npx prisma db push` pour continuer rapidement le déploiement.**

