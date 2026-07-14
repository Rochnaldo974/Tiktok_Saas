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

### 2026-07-15 — Français + pages complètes + Supabase
- [x] **Interface 100 % en français** : chrome UI, pages, contenus mock
      (`src/lib/data.ts` traduit), `lang="fr"`, guillemets « », formats FR ;
      valeurs internes (statuts, difficulté) restent en anglais avec maps
      d'affichage `STATUS_LABELS` / `DIFFICULTY_LABELS` / `SATURATION_LABELS`
- [x] Routes renommées en français : `/idees`, `/copilote`, `/alertes`, `/reglages`
- [x] Page **Copilote IA** (`src/app/(app)/copilote/`) : chat avec réponses de
      démo dérivées localement du dataset (plan du jour, analyse de niche,
      sons, hooks, créateurs) — `answer()` dans `src/components/copilot/chat.tsx`
      est le point à remplacer par l'API Claude
- [x] Page **Alertes** (`src/app/(app)/alertes/`) : flux généré depuis les
      niches suivies + règles d'alerte (interrupteurs)
- [x] Page **Réglages** (`src/app/(app)/reglages/`) : pays/période par défaut
      et niches suivies, persistés dans le cookie `sig-prefs`
      (`src/lib/prefs*.ts`) et lus côté serveur — vérifié
- [x] **Projet Supabase créé** : « Signal », ref `znxmwdrbmwwshsmtcmtl`,
      région eu-west-3 (Paris), 10 $/mois confirmés par l'utilisateur
- [x] Schéma initial appliqué (migration `initial_schema`) : `profiles` +
      `saved_items`, RLS par utilisateur, trigger de création de profil
- [x] Client câblé : `src/lib/supabase.ts` (clé publishable), `.env.local`
      (non versionné) + `.env.example`, CSP `connect-src` ouverte au seul
      domaine Supabase
- [x] Correctif : bloc CSS « panneau latéral & formulaires » (`.field`,
      `.panel`, `.script-block`) restauré dans `globals.css`
- [x] Vérifié : build + lint OK, 5 routes en 200, pages testées en navigateur,
      persistance des préférences validée (cookie → rendu serveur)

### 2026-07-15 — Dashboard personnalisé par niches (feedback produit utilisateur)
- [x] **Onboarding première visite** (`src/components/onboarding.tsx`) : choix
      des niches + marché obligatoire avant d'afficher le dashboard —
      c'est ainsi qu'on « sait » ce que crée l'utilisateur
- [x] **Hero personnalisé** : brief, plan du jour et compteur « au pic »
      calculés dans les niches suivies (plus jamais « Immobilier bouge »
      pour un créateur Fitness)
- [x] Nouvelle section « À filmer en priorité » (vidéos des niches suivies),
      le viral global passe en second avec badge « Hors de vos niches »
- [x] Carte rail « **Format transférable** » : le top hors-niche présenté
      comme opportunité à transposer (CTA vers le copilote)
- [x] Hooks / hashtags / créateurs triés : ceux des niches suivies d'abord
- [x] `getPrefsState()` (`src/lib/prefs.ts`) distingue « cookie absent »
      (→ onboarding) de « préférences choisies »
- [x] Vérifié : build + lint OK, parcours onboarding → dashboard testé en
      navigateur, personnalisation validée par cookie côté serveur

### 2026-07-15 — Authentification Supabase + Bibliothèque
- [x] **Auth SSR** (`@supabase/ssr`) : clients navigateur/serveur
      (`src/lib/supabase/`), rafraîchissement de session dans `src/proxy.ts`
      (Next 16 : `middleware` est déprécié au profit de `proxy`)
- [x] Page **/connexion** : inscription + connexion email/mot de passe,
      erreurs traduites ; à l'inscription, les préférences de l'onboarding
      (cookie) sont copiées dans le profil
- [x] **Préférences hiérarchisées** : connecté → table `profiles` (source de
      vérité) ; sinon cookie `sig-prefs` ; Réglages synchronise les deux
- [x] Réglages > Compte : email connecté, déconnexion, lien connexion
- [x] **Sauvegarde réelle** : sons / hooks / idées écrits dans `saved_items`
      (upsert, RLS par utilisateur) via `src/lib/library.ts` ; toast
      « Connectez-vous » si pas de session
- [x] Page **/bibliotheque** (+ entrée sidebar) : liste serveur des éléments
      sauvegardés, copie presse-papiers, suppression
- [x] Testé de bout en bout en navigateur : inscription → confirmation →
      connexion → niches du profil sur le dashboard → sauvegarde d'une idée
      → visible en base (SQL) et dans la Bibliothèque
- [x] Compte de test : `eliottroche97419+test@gmail.com` (confirmé
      manuellement en base — la confirmation email est active sur le projet)

### 2026-07-15 — Insight → action : panneau Analyse + Script (audit produit)
- [x] **Panneau latéral** (`src/components/trend-panel.tsx`, monté dans le
      layout, ouvrable depuis n'importe quelle carte via `openTrendPanel()`)
      avec 2 onglets :
      - **Pourquoi ça marche** : analyse IA, scores, difficulté/saturation
        expliquées, ressorts du format, son + hook à utiliser
      - **Mon script** : plan de tournage minuté (hook → mise en place →
        développement → révélation → CTA), **blocs éditables**, copie et
        sauvegarde en bibliothèque (avec le script dans le payload)
- [x] Générateur de script déterministe (`src/lib/script.ts`) — adapté au
      type de contenu (UGC, tutoriel, storytelling...) ; à remplacer par
      l'API Claude (P3) sans toucher à l'UI
- [x] Boutons « Analyser » / « Créer ma version » / « Créer mon script »
      branchés sur le panneau (plus aucun bouton mort dans l'app)
- [x] **Plan du jour actionnable** (`src/components/daily-plan.tsx`) :
      chaque ligne se fait en un clic (script, sauvegarde du son, copie du hook)
- [x] Fix : `seed >> 3` pouvait devenir négatif (décalage signé) et vider
      un bloc du script → `>>> 3`
- [x] Vérifié : build + lint OK, panneau testé en navigateur (2 onglets,
      script minuté correct)

---

## 🔜 Immédiat

- [x] `npm install` dans le dossier principal — fait le 2026-07-15, build
      vérifié dans le dossier principal
- [ ] `git push origin main` (main local est en avance sur origin/main)
- [ ] Supprimer le worktree devenu inutile :
      `git worktree remove .claude/worktrees/nextjs-rebuild`
- [ ] Surveiller `npm audit` : 2 vulnérabilités modérées dans le `postcss`
      embarqué par Next (build-time uniquement, pas d'impact runtime) —
      **ne pas** lancer `npm audit fix --force` (rétrograderait Next à la v9) ;
      mettre à jour Next dès qu'un patch sort (`npm update next`)

---

## 📋 Backlog priorisé

### P1 — Compléter le produit visible
- [x] Page **Copilote IA** — fait le 2026-07-15 (réponses de démo locales)
- [x] Page **Alertes** — fait le 2026-07-15 (badge sidebar « 3 » encore statique)
- [x] Page **Réglages** — fait le 2026-07-15 (préférences cookie)
- [x] Panneau latéral Analyse + générateur de script — fait le 2026-07-15
- [ ] Badge Alertes dynamique dans la sidebar (nombre réel d'alertes)

### P2 — Backend réel
- [x] Projet Supabase + schéma (`profiles`, `saved_items`, RLS) — fait le 2026-07-15
- [x] Authentification Supabase + préférences dans `profiles` — fait le 2026-07-15
- [x] Sauvegarde réelle dans `saved_items` + page Bibliothèque — fait le 2026-07-15
- [ ] Emails d'auth : personnaliser les templates Supabase (FR) et brancher
      un SMTP custom avant la prod (limite stricte du SMTP par défaut)
- [ ] **Ingestion de vraies données TikTok** remplaçant le mock `dataset()`
      de `src/lib/data.ts` (l'interface typée `Dataset` est le contrat à garder)

### P3 — Industrialisation
- [ ] Génération IA réelle des scripts/analyses (API Claude — modèle
      `claude-sonnet-5` par défaut) : remplacer `answer()` dans
      `src/components/copilot/chat.tsx` par une route serveur
- [ ] Tests E2E (Playwright) + CI GitHub Actions (build, lint, tests)
- [ ] Déploiement (Vercel) + domaine — penser aux variables d'env Supabase
- [ ] Billing/abonnements (Stripe)
- [ ] i18n : le français est la langue de base ; ajouter l'anglais ensuite

---

## 🗒️ Journal des décisions

| Date | Décision | Pourquoi |
|------|----------|----------|
| 2026-07-15 | Next.js 16 App Router + TS strict + Tailwind v4 | Stack SaaS moderne de référence : Server Components, sécurité, perf |
| 2026-07-15 | État (pays/période/filtres) dans les search params de l'URL | Vues partageables, rendu serveur, back-button ; pas de store client |
| 2026-07-15 | Design system Signal conservé tel quel (pas de thème générique) | Identité distinctive déjà validée ; portée dans `globals.css` |
| 2026-07-15 | Moteur mock isomorphe et seedé, typé (`Dataset`) | Serveur et client dérivent les mêmes données ; contrat stable pour brancher une vraie API plus tard |
| 2026-07-15 | Zéro dépendance runtime hors React/Next (icônes SVG inline, dégradés générés) | Surface d'attaque minimale, CSP self-only possible, perf |
| 2026-07-15 | Français langue de base ; valeurs internes (statuts, enums) en anglais + maps de labels | Classes CSS et paramètres d'URL stables, affichage traduit |
| 2026-07-15 | Routes en français (`/idees`, `/copilote`, `/alertes`, `/reglages`) | Cohérence produit pour une audience francophone |
| 2026-07-15 | Préférences via cookie `sig-prefs` (non httpOnly, validées en liste blanche à la lecture) | Lisible serveur ET client sans auth ; migrera vers `profiles` avec Supabase Auth |
| 2026-07-15 | Supabase : clé publishable côté client, sécurité par policies RLS ; CSP `connect-src` limitée au domaine du projet | Modèle de sécurité standard Supabase, pas de secret dans le code |
| 2026-07-15 | Le dashboard est centré sur les niches suivies ; le viral global est secondaire (badge « Hors de vos niches », carte « Format transférable ») | Feedback utilisateur : un créateur veut d'abord SA niche ; le hors-niche n'a de valeur que si le format est transposable |
| 2026-07-15 | Onboarding bloquant à la première visite (choix des niches) | Sans cette donnée, aucune personnalisation n'est honnête ; à terme : déduction via le @handle TikTok |
| 2026-07-15 | Toute recommandation doit finir en action 1-clic (script, sauvegarde, copie) — zéro bouton mort | Audit produit : la promesse client est « ouvre l'app, repars avec un script », pas « lis un dashboard » |
