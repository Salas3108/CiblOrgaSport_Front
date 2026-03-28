# Déploiement du frontend CiblOrgaSport sur AWS S3

Ce document explique exactement comment le frontend a été déployé en production, étape par étape.

---

## Contexte

- **Framework** : Next.js 16 (TypeScript)
- **Backend déjà déployé** : Spring Cloud Gateway sur `http://137.74.133.131`
- **Hébergement choisi** : AWS S3 en mode site web statique (région eu-west-3 — Paris)
- **Compte AWS** : `833934014617`
- **URL finale** : `http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com`

---

## Étape 1 — Connexion du frontend au backend

Le code contenait des URLs hardcodées pointant vers `localhost:8080`. On les a toutes remplacées pour pointer vers le backend de production.

### 1.1 Créer la branche de déploiement

On part de la branche `Resultat` (branche de développement actif) :

```bash
git checkout Resultat
git pull origin Resultat
git checkout -b deploy/aws-frontend
```

### 1.2 Créer le fichier `.env.local`

Créer à la racine du projet (ce fichier ne doit jamais être commité) :

```env
NEXT_PUBLIC_API_BASE_URL=http://137.74.133.131
NEXT_PUBLIC_VOLUNTEER_ADMIN_API=http://137.74.133.131/api/v1/admin/volunteers
NEXTAUTH_SECRET=ra3PvlPp6mzA/b4E8YbthK52auSy2evuMwjl+Ey3/fM=
```

> Le fichier `.gitignore` contient déjà `.env*` donc ce fichier est automatiquement ignoré par git.

### 1.3 Corriger les URLs hardcodées dans `src/api/authService.ts`

4 fonctions utilisaient directement `http://localhost:8080` dans leur code au lieu de la variable `GATEWAY`. On les a remplacées pour utiliser la constante `base` déjà définie en haut du fichier :

```ts
// Avant
let url = 'http://localhost:8080/auth/admin/athletes';
// Après
let url = `${base}/auth/admin/athletes`;
```

Même correction pour `fetchVolunteers`, `adminValidateAthlete` et `adminValidateVolunteer`.

### 1.4 Corriger le parsing de la réponse login dans `components/auth/login-form.tsx`

Le backend renvoie une réponse **plate** (pas d'objet `user` imbriqué) :

```json
{ "token": "...", "type": "Bearer", "id": 1, "username": "admin", "role": "ADMIN" }
```

Mais le code tentait de lire `{ token, user, type }`. On a corrigé :

```ts
// Avant
const { token, user, type } = await res.json()

// Après
const data = await res.json()
const { token, type, id, username: resUsername, role: resRole } = data
let fullUser = { username: resUsername, role: resRole, id }
```

### 1.5 Corriger les imports cassés dans `src/app/billetterie/page.tsx`

Le fichier importait ses dépendances avec un chemin en double `../../src/api/...` (le `src/` était répété).
Correction avec l'alias `@/` :

```ts
// Avant (chemin invalide)
import { listTickets } from '../../src/api/ticketService';
import eventsApi from '../../src/api/eventsService';
import { useAuth } from '../../components/auth/auth-provider';

// Après
import { listTickets } from '@/src/api/ticketService';
import eventsApi from '@/src/api/eventsService';
import { useAuth } from '@/components/auth/auth-provider';
```

### 1.6 Corriger `src/pages/Incidents.tsx`

La fonction `listIncidents` n'existait pas dans `incidentService.ts`. Le bon nom est `getIncidents` :

```ts
// Avant
import { listIncidents, createIncident } from '../api/incidentService';
const data = await listIncidents();

// Après
import { getIncidents, createIncident } from '../api/incidentService';
const data = await getIncidents();
```

---

## Étape 2 — Adapter Next.js pour l'export statique S3

Next.js en mode serveur ne peut pas être hébergé sur S3 directement. On génère un export statique (fichiers HTML/JS/CSS purs) via la config `output: 'export'`.

### 2.1 Modifier `next.config.mjs`

```js
// Avant
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async rewrites() { return [...] }  // pointait vers localhost
}

// Après
const nextConfig = {
  output: 'export',       // génère le dossier out/
  trailingSlash: true,    // /login → login/index.html (requis pour S3)
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // rewrites() supprimé : incompatible avec l'export statique
}
```

> **Pourquoi `trailingSlash: true` ?** Sans cette option, Next.js génère `login.html`. S3 ne sait pas que `/login` correspond à `login.html` et retourne une erreur 404. Avec `trailingSlash: true`, Next.js génère `login/index.html` et S3 sert automatiquement le fichier `index.html` de chaque dossier.

### 2.2 Désactiver les routes API mock (incompatibles avec l'export statique)

Deux routes API Next.js existaient pour le développement local uniquement (mock de données) :
- `src/app/api/athletes/[id]/epreuves/route.ts` — lisait un fichier `db.json` local
- `src/app/api/auth/[...nextauth]/route.ts` — handler NextAuth

Ces routes sont incompatibles avec `output: 'export'` car Next.js ne peut pas les rendre statiquement sans connaître tous les IDs à l'avance. On les a renommées en `.dev.ts` pour les exclure du build :

```bash
mv src/app/api/athletes/[id]/epreuves/route.ts \
   src/app/api/athletes/[id]/epreuves/route.dev.ts

mv src/app/api/auth/[...nextauth]/route.ts \
   src/app/api/auth/[...nextauth]/route.dev.ts
```

> Ces fichiers ne sont pas supprimés — ils peuvent être réactivés en les renommant à nouveau en `.ts` pour le développement local.

---

## Étape 3 — Builder l'application

```bash
npm run build
```

Next.js génère le dossier `out/` avec l'ensemble du site statique :
- `out/login/index.html`, `out/events/index.html`… — une page HTML par route
- `out/_next/static/` — tous les fichiers JS, CSS et polices

Résultat : **33 pages statiques générées**, taille totale **~5 Mo**.

---

## Étape 4 — Créer le bucket S3

### 4.1 Installer AWS CLI

```bash
brew install awscli
```

### 4.2 Créer un utilisateur IAM

Dans la console AWS → IAM → Personnes → Créer un utilisateur :
- Nom : `ciblorgasport-deploy`
- Permissions : `AmazonS3FullAccess` + `CloudFrontFullAccess`
- Créer une clé d'accès CLI (Access Key ID + Secret Access Key)

### 4.3 Configurer le CLI

```bash
aws configure
# AWS Access Key ID     : AKIA...
# AWS Secret Access Key : ....
# Default region        : eu-west-3
# Default output format : json
```

Vérification :
```bash
aws sts get-caller-identity
# → { "Account": "833934014617", "Arn": "arn:aws:iam::...user/ciblorgasport-deploy" }
```

### 4.4 Créer le bucket

```bash
aws s3 mb s3://ciblorgasport-frontend-prod --region eu-west-3
```

### 4.5 Configurer l'accès public

Par défaut AWS bloque tout accès public. On le désactive pour permettre au navigateur de lire les fichiers :

```bash
aws s3api put-public-access-block \
  --bucket ciblorgasport-frontend-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 4.6 Activer le mode site web statique

On indique à S3 quel fichier servir par défaut et pour les erreurs :

```bash
aws s3api put-bucket-website \
  --bucket ciblorgasport-frontend-prod \
  --website-configuration \
    '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"404.html"}}'
```

### 4.7 Ajouter la politique de lecture publique

```bash
aws s3api put-bucket-policy \
  --bucket ciblorgasport-frontend-prod \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ciblorgasport-frontend-prod/*"
    }]
  }'
```

---

## Étape 5 — Uploader les fichiers

On sépare l'upload en deux passes avec des politiques de cache différentes :

```bash
# Fichiers HTML — pas de cache (changent à chaque déploiement)
aws s3 sync out/ s3://ciblorgasport-frontend-prod/ --delete \
  --exclude "_next/static/*" \
  --cache-control "no-cache"

# Assets JS/CSS/fonts — cache 1 an (leurs noms contiennent un hash unique)
aws s3 sync out/_next/static/ s3://ciblorgasport-frontend-prod/_next/static/ \
  --cache-control "public, max-age=31536000, immutable"
```

> Le flag `--delete` supprime automatiquement les anciens fichiers qui n'existent plus dans le build.

---

## Étape 6 — Vérification

```bash
curl -I http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com/
# HTTP/1.1 200 OK ✅

curl -I http://ciblorgasport-frontend-prod.s3-website.eu-west-3.amazonaws.com/login/
# HTTP/1.1 200 OK ✅
```

---

## Redéployer après une modification de code

```bash
git checkout deploy/aws-frontend
npm run build
aws s3 sync out/ s3://ciblorgasport-frontend-prod/ --delete \
  --exclude "_next/static/*" \
  --cache-control "no-cache"
aws s3 sync out/_next/static/ s3://ciblorgasport-frontend-prod/_next/static/ \
  --cache-control "public, max-age=31536000, immutable"
```

---

## Amélioration future — CloudFront (HTTPS)

Le site est actuellement en HTTP. Pour passer en HTTPS avec un domaine personnalisé :

1. Créer un certificat SSL dans AWS Certificate Manager (ACM) pour ton domaine
2. Créer une distribution CloudFront pointant sur le bucket S3
3. Associer le certificat ACM à la distribution
4. Créer un enregistrement DNS (CNAME ou Alias) vers la distribution CloudFront
5. Après chaque déploiement, invalider le cache CloudFront :

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

---

## Branches Git

| Branche | Rôle |
|---|---|
| `main` | Code stable de référence |
| `Resultat` | Développement actif |
| `deploy/aws-frontend` | Configuration de déploiement (cette branche) |

Ne jamais merger `deploy/aws-frontend` dans `main` sans validation manuelle.
