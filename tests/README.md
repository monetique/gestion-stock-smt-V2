# 🧪 Tests de l'Application de Gestion de Stocks

Ce répertoire contient les tests pour valider toutes les fonctionnalités de l'application.

## 📁 Structure des Tests

- **`api-tests.ts`** : Tests automatisés des APIs REST
- **`manual-tests.md`** : Guide de tests manuels pour toutes les fonctionnalités
- **`run-tests.sh`** : Script pour exécuter les tests automatisés
- **`README.md`** : Ce fichier

## 🚀 Exécution des Tests Automatisés

### Prérequis
- Node.js installé
- Serveur Next.js démarré (`npm run dev`)
- Un utilisateur de test dans la base de données

### Configuration

Avant d'exécuter les tests, configurez les identifiants de test dans `api-tests.ts` :

```typescript
const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'testpassword123'
```

### Exécution

```bash
# Méthode 1 : Utiliser le script
./tests/run-tests.sh

# Méthode 2 : Exécuter directement
npx tsx tests/api-tests.ts
```

### Résultats

Les tests affichent :
- ✅ Tests réussis
- ❌ Tests échoués avec les erreurs
- 📊 Résumé avec taux de réussite

## 📋 Tests Manuels

Consultez `manual-tests.md` pour la liste complète des tests manuels à effectuer.

### Points Critiques à Vérifier

1. **Filtres dans l'impression des bordereaux**
   - Les statistiques doivent respecter tous les filtres appliqués
   - Vérifier particulièrement avec filtre "Emplacement De" et "Date"

2. **Calcul des stocks**
   - Le stock total d'une carte = somme des stocks par emplacement
   - Vérifier la cohérence après chaque mouvement

3. **Logs d'audit**
   - Toutes les actions importantes doivent être enregistrées
   - Vérifier les détails (utilisateur, IP, timestamp)

4. **Emails**
   - Email de bienvenue lors de la création d'utilisateur
   - Alertes de stock faible
   - Notifications de mouvements importants

## 🎯 Couverture des Tests

### Tests Automatisés (API)
- ✅ Authentification
- ✅ CRUD Banques
- ✅ CRUD Cartes
- ✅ CRUD Emplacements
- ✅ CRUD Mouvements
- ✅ Liste Utilisateurs
- ✅ Statistiques
- ✅ Configuration
- ✅ Logs d'audit

### Tests Manuels (Interface)
- ✅ Toutes les pages et fonctionnalités UI
- ✅ Filtres et recherches
- ✅ Impressions et exports
- ✅ Gestion d'erreurs
- ✅ Responsivité
- ✅ Sécurité et permissions

## 📊 Résultats Attendus

### Tests Automatisés
- Taux de réussite : **≥ 90%**
- Temps d'exécution : **< 30 secondes**

### Tests Manuels
- Tous les tests critiques doivent passer
- Aucun bug bloquant ne doit être trouvé

## 🐛 Signaler un Bug

Si vous trouvez un bug lors des tests :

1. Notez les étapes pour le reproduire
2. Indiquez le test concerné (numéro et nom)
3. Capturez les logs/erreurs si possible
4. Créez une issue ou contactez l'équipe de développement

## 📝 Maintenance

Les tests doivent être mis à jour lorsque :
- De nouvelles fonctionnalités sont ajoutées
- Des APIs sont modifiées
- Des bugs sont corrigés (ajouter un test de régression)

---

**Dernière mise à jour** : 2026-01-19

