# Signal — Plan d'avancement

> **Règle de travail : ce fichier est la source de vérité du projet.**
> Avant **toute** nouvelle feature ou modification : lire ce fichier.
> Après chaque changement : cocher ce qui est terminé, ajouter les nouvelles
> entrées au backlog, et noter les décisions importantes dans le journal.

**Produit** : Signal — SaaS d'intelligence de tendances TikTok. Il scanne les
tendances par pays et fait remonter les vidéos virales, sons montants, hooks,
hashtags et créateurs sur lesquels agir aujourd'hui.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4

---

## ✅ Fait

### 2026-07-14 — Prototype (commit `6b08f45`)
- [x] Design system "Signal" en CSS pur (`css/app.css`) : dark, accent TikTok
      `#fe2c55`, pulse cyan `#25f4ee`, Bricolage Grotesque / Inter / JetBrains Mono
- [x] Moteur de données mock seedé et déterministe (`js/data.js`) : vidéos,
      créateurs, sons, hooks, hashtags par (pays, période)
- [x] Composants shell vanilla JS (`js/ui.js`) : sidebar, topbar, ⌘K, toasts, cartes

### 2026-07-15 — Rebuild Next.js (commit `b97a2ad`, mergé dans `main`)
- [x] Scaffold Next.js 16 + React 19 + TS strict + Tailwind v4 (`src/`)
- [x] Moteur de données porté en TypeScript typé et isomorphe : `src/lib/data.ts`
      (mêmes seeds → mêmes données serveur/client) + `src/lib/visuals.ts`
      (dégradés générés : thumbnails, avatars, artworks — zéro image externe)
- [x] Design system porté dans `src/app/globals.css` ; fonts self-hosted via
      `next/font` ; icônes SVG inline (`src/components/icons.tsx`)
- [x] Shell : sidebar (`src/components/shell/sidebar.tsx`) + topbar avec
      sélecteurs pays/période (`src/components/shell/topbar.tsx`)
- [x] **État dans l'URL** : `?country=`, `?tf=`, filtres Ideas — pages en
      Server Components, vues partageables, back-button OK
- [x] Page **Today** (`src/app/(app)/page.tsx`) : brief quotidien (hero),
      vidéos virales, sons montants, hooks, hashtag heat, créateurs,
      rail Trend pulse
- [x] Page **Ideas** (`src/app/(app)/ideas/page.tsx`) : recherche avec debounce,
      filtres niche/statut, cartes éditoriales avec plan de production et
      checklist "Your version"
- [x] Palette ⌘K multi-entités (`src/components/command-menu.tsx`), toasts
      (`src/components/toaster.tsx`)
- [x] **Sécurité** (`next.config.ts`) : CSP stricte self-only, HSTS,
      `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy,
      COOP, `poweredByHeader` off ; params d'URL validés en liste blanche
      (`resolveCountry` / `resolveTimeframe` dans `src/lib/data.ts`)
- [x] Accessibilité : `prefers-reduced-motion`, `:focus-visible`, aria-labels,
      responsive jusqu'à 375px
- [x] Vérifié : `npm run build` + `npm run lint` OK, pages testées en
      navigateur (prod `next start`), headers confirmés sur les réponses HTTP
- [x] Git : branche `worktree-nextjs-rebuild` poussée sur origin, mergée en
      fast-forward dans `main` **local**

---

## 🔜 Immédiat

- [ ] `npm install` dans le dossier principal (interrompu — l'app ne démarre
      pas sans `node_modules`)
- [ ] `git push origin main` (main local est en avance sur origin/main)
- [ ] Supprimer le worktree devenu inutile :
      `git worktree remove .claude/worktrees/nextjs-rebuild`

---

## 📋 Backlog priorisé

### P1 — Compléter le produit visible
- [ ] Page **AI Copilot** (stub sidebar → vraie page) : chat/brief génératif
- [ ] Page **Alerts** (stub sidebar) : alertes sons/hooks/niches suivis,
      badge "3" actuellement factice
- [ ] Page **Settings** (stub sidebar) : pays par défaut, niches suivies, compte
- [ ] **Panneau latéral "Analyze" + générateur de script** : le design existe
      déjà dans `globals.css` (classes `.panel`, `.panel-tabs`, `.script-block`,
      `.gen-facts`) — brancher les boutons "Analyze" / "Create my version" /
      "Generate my script" dessus au lieu d'un simple toast

### P2 — Backend réel
- [ ] **Auth + persistance** (Supabase recommandé — MCP déjà connecté) :
      comptes, sauvegarde sons/hooks/idées, derrière l'interface `Dataset`
      existante pour ne pas toucher aux pages
- [ ] **Ingestion de vraies données TikTok** remplaçant le mock `dataset()`
      de `src/lib/data.ts` (l'interface typée `Dataset` est le contrat à garder)

### P3 — Industrialisation
- [ ] Génération IA réelle des scripts/analyses (API Claude — modèle
      `claude-sonnet-5` par défaut)
- [ ] Tests E2E (Playwright) + CI GitHub Actions (build, lint, tests)
- [ ] Déploiement (Vercel) + domaine
- [ ] Billing/abonnements (Stripe)
- [ ] i18n FR/EN

---

## 🗒️ Journal des décisions

| Date | Décision | Pourquoi |
|------|----------|----------|
| 2026-07-15 | Next.js 16 App Router + TS strict + Tailwind v4 | Stack SaaS moderne de référence : Server Components, sécurité, perf |
| 2026-07-15 | État (pays/période/filtres) dans les search params de l'URL | Vues partageables, rendu serveur, back-button ; pas de store client |
| 2026-07-15 | Design system Signal conservé tel quel (pas de thème générique) | Identité distinctive déjà validée ; portée dans `globals.css` |
| 2026-07-15 | Moteur mock isomorphe et seedé, typé (`Dataset`) | Serveur et client dérivent les mêmes données ; contrat stable pour brancher une vraie API plus tard |
| 2026-07-15 | Zéro dépendance runtime hors React/Next (icônes SVG inline, dégradés générés) | Surface d'attaque minimale, CSP self-only possible, perf |
