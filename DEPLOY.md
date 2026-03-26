# Guide de déploiement — CiblOrgaSport Frontend

## Architecture

- **Framework** : Next.js 16 (export statique)
- **Hébergement** : AWS S3 (eu-west-3 — Paris)
- **Backend** : Spring Cloud Gateway sur `http://137.74.133.131`
- **Compte AWS** : `833934014617`
- **Bucket S3** : `ciblorgasport-frontend-prod`
- **URL publique** : `http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com`

---

## Prérequis

- Node.js 18+
- AWS CLI installé (`brew install awscli` sur Mac)
- Credentials AWS configurés (voir section ci-dessous)

---

## 1. Configuration AWS CLI

```bash
aws configure
```

Renseigner :
```
AWS Access Key ID     : AKIA...
AWS Secret Access Key : ....
Default region        : eu-west-3
Default output format : json
```

L'utilisateur IAM requis est `ciblorgasport-deploy` (compte `833934014617`).
Permissions nécessaires : `AmazonS3FullAccess` + `CloudFrontFullAccess`.

---

## 2. Variables d'environnement

Créer un fichier `.env.local` à la racine (non commité) :

```env
NEXT_PUBLIC_API_BASE_URL=http://137.74.133.131
NEXT_PUBLIC_VOLUNTEER_ADMIN_API=http://137.74.133.131/api/v1/admin/volunteers
NEXTAUTH_SECRET=ra3PvlPp6mzA/b4E8YbthK52auSy2evuMwjl+Ey3/fM=
```

---

## 3. Déploiement complet (build + upload)

```bash
# 1. Installer les dépendances
npm ci

# 2. Builder l'application
npm run build

# 3. Uploader les fichiers HTML (cache désactivé)
aws s3 sync out/ s3://ciblorgasport-frontend-prod/ --delete \
  --exclude "_next/static/*" \
  --cache-control "no-cache"

# 4. Uploader les assets JS/CSS (cache 1 an — immuables)
aws s3 sync out/_next/static/ s3://ciblorgasport-frontend-prod/_next/static/ \
  --cache-control "public, max-age=31536000, immutable"
```

---

## 4. Vérification

```bash
# Tester l'accès au site
curl -I http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com/

# Tester une route
curl -I http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com/login/
```

Les deux doivent retourner `HTTP/1.1 200 OK`.

---

## 5. Routes API backend disponibles

Toutes les requêtes passent par `http://137.74.133.131` :

| Fonctionnalité | Méthode | Endpoint |
|---|---|---|
| Connexion | POST | `/auth/login` |
| Inscription | POST | `/auth/register` |
| Profil connecté | GET | `/auth/me` |
| Événements | GET/POST | `/events` |
| Compétitions | GET/POST | `/competitions` |
| Épreuves | GET/POST | `/epreuves` |
| Lieux | GET/POST | `/lieux` |
| Résultats | GET/POST | `/resultats` |
| Incidents | GET/POST | `/incidents` |
| Billets | GET/POST | `/billets` |
| Volontaires | GET/POST | `/api/v1/volunteers` |
| Analytics (ADMIN) | GET | `/api/analytics/events/live` |

Authentification : header `Authorization: Bearer <token>` sur toutes les routes protégées.

---

## 6. Renouveler les clés AWS

Si les clés d'accès ont été compromises ou expirées :

1. AWS Console → IAM → Personnes → `ciblorgasport-deploy`
2. Onglet "Informations d'identification de sécurité"
3. Désactiver l'ancienne clé → Créer une nouvelle clé
4. Relancer `aws configure` avec les nouvelles valeurs

---

## 7. Prochaines améliorations recommandées

### HTTPS avec CloudFront

Pour activer HTTPS et un domaine personnalisé :

```bash
# Créer une distribution CloudFront
aws cloudfront create-distribution \
  --origin-domain-name ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com \
  --default-root-object index.html
```

Puis associer un certificat ACM et un enregistrement DNS Route 53.

### Invalider le cache CloudFront après déploiement

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

---

## Branches Git

| Branche | Rôle |
|---|---|
| `main` | Code de référence stable |
| `Resultat` | Développement actif |
| `deploy/aws-frontend` | Configuration de déploiement AWS |

Ne jamais merger `deploy/aws-frontend` dans `main` sans validation manuelle.
