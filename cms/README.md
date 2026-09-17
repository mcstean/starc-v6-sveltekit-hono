# STARC CMS (Payload 3.0)

Content management system for STARC Enterprise.

## Stack

- Payload 3.0
- Next.js 15 (App Router)
- Cloudflare Workers via @opennextjs/cloudflare
- D1 (starc_cms_db)
- R2 (starc-cms-media)

## Dev local

    npm install
    npm run dev
    # → http://localhost:3000/admin

## Variables d'environnement

Copier `.env.example` vers `.env` :

    cp .env.example .env

Puis éditer `PAYLOAD_SECRET` (32 caractères minimum).

## Déploiement

    npm run build
    npx wrangler deploy

## Isolation

Ce projet vit dans `cms/` séparé du site SvelteKit principal.
Le site principal n'est JAMAIS touché par les changements ici.
