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

### 2026-07-15 — Génération IA (API Claude) + badge Alertes dynamique
- [x] **Route serveur `/api/script`** (`src/app/api/script/route.ts`) :
      appel à l'API Claude (`claude-opus-4-8`, pensée adaptative, effort low,
      **structured outputs** → JSON toujours valide), réservée aux utilisateurs
      connectés, entrée validée en liste blanche, erreurs typées (401/400/429/502/503)
- [x] Bouton « **Rédiger avec l'IA** » dans l'onglet Mon script du panneau :
      remplace le script local par un script rédigé par Claude (répliques
      exactes en français + indications de tournage), blocs toujours éditables ;
      le script local déterministe reste le fallback instantané
- [x] Dégradation propre sans `ANTHROPIC_API_KEY` : 503 explicite, l'app
      fonctionne normalement — **la clé est à ajouter dans `.env.local`**
      (voir `.env.example`) ; côté serveur uniquement, jamais exposée au client
- [x] **Badge Alertes dynamique** : construction des alertes extraite dans
      `src/lib/alerts.ts` (partagée page + sidebar) — le badge affiche le
      nombre réel d'alertes et correspond toujours au contenu de la page
- [x] Vérifié : build + lint OK, 503 sans clé testé, badge (7) = nombre de
      lignes de la page Alertes
- [x] **Génération réelle testée** (2026-07-15, clé fournie) : script IA
      d'excellente qualité (répliques FR + indications de tournage, minutage
      respecté sur 0:58), sauvegardé et vérifié en base (payload `script`)
- [x] **Fix découvert au test** : policy RLS `UPDATE` manquante sur
      `saved_items` — l'upsert (`insert ... on conflict do update`) échouait
      sur une ligne existante ; migration `saved_items_update_policy` appliquée
- [x] Note dev : après expiration/rotation du jeton (serveur redémarré),
      la session peut tomber → l'UI affiche « Connectez-vous » proprement ;
      backlog : rediriger vers /connexion dans ce cas

### 2026-07-15 — Niches libres + analyse de profil TikTok (audit « point de vue client »)
- [x] **Niches 100 % libres** : la danseuse, le potier, le barbier ont leur
      place — champ « Autre niche » dans l'onboarding et les Réglages,
      validation stricte (`sanitizeNiche`, 2–30 caractères, max 8 niches)
- [x] **Moteur étendu aux niches personnalisées** : `dataset(country, tf,
      extraNiches)` génère vidéos, créateurs, hooks et hashtags pour toute
      niche saisie (templates FR seedés sur le nom) ; propagé partout
      (Today, Idées, filtres, copilote, ⌘K, alertes, badge)
- [x] **Analyse de profil TikTok réelle** (`/api/profil`) : lecture du profil
      public (bio, abonnés, vidéos, likes — **vraies données**) + analyse
      Claude (niches détectées, résumé, conseils actionnables) ; rate limit
      10/h/IP (accessible sans compte = accroche d'acquisition) ; fallback
      « décrivez votre contenu » si profil inaccessible ; stockée dans
      `profiles.tiktok_handle/tiktok_analysis` quand connecté (migration)
- [x] **Onboarding repensé** : chemin magique « colle ton @ » en premier
      (stats réelles + niches auto-sélectionnées), choix manuel + niche
      libre ensuite
- [x] Réglages : carte « Profil TikTok » (analyse + re-analyse), niche libre
- [x] tsconfig `target` ES2017 → ES2022
- [x] **Testé en réel** (parcours danseuse) : @leaelui → 18 M abonnés lus,
      niches « Danse, Lifestyle, Beauté » détectées et appliquées, dashboard
      et flux Idées personnalisés sur la Danse avec contenu généré
- [x] Données réelles — état honnête : le **profil** est en vraies données ;
      les **tendances** restent simulées (l'API Creative Center exige une
      signature) → voir backlog P2

### 2026-07-15 — Retours de test utilisateur : clarté, cohérence, page Analyse
- [x] **Hooks cohérents** : les vidéos avaient des hooks hors sujet (« routine
      du matin » sur une vidéo musique IA) — désormais générés DANS la niche
      de la vidéo (`VIDEO_HOOK_TEMPLATES`, formulés pour tout nom de niche) ;
      chips réduites (3 max), émotions à 2
- [x] **Carte idée simplifiée** (retour « trop d'infos, pas clair ») :
      3 chiffres (score, production, saturation) au lieu de 6, plus de
      double rangée de chips, checklist « Votre version, en 3 étapes »
- [x] **Transparence démo** : mention discrète dans le rail du dashboard —
      tendances simulées, analyse de profil en vraies données
- [x] **Page /analyse dédiée** (retour « l'analyse est le point fort mais
      trop courte ») : audit stratégique complet via `/api/profil` en mode
      `deep` (effort medium, schéma riche) — score de potentiel /100 avec
      ring, positionnement 3-4 phrases, forces/faiblesses, **plan d'action
      J1→J7**, **3 idées de vidéos sur mesure avec hooks**, **bio optimisée
      prête à coller** ; entrée « Analyse » dans la sidebar ; dernier audit
      mémorisé dans le profil et ré-affiché
- [x] Testé en réel (@leaelui) : audit d'une justesse frappante — exploite
      les vrais chiffres (ratio likes/vidéos, fréquence), plan J1-J7
      actionnable, idées personnalisées pertinentes

### 2026-07-15 — Planning persistant + prévisualisation TikTok (retours utilisateur)
- [x] **Planning** : table `plan_items` (RLS complète), bouton « Ajouter à
      mon planning » sous le plan d'audit (1 action/jour à partir
      d'aujourd'hui), page **/planning** (checklist groupée par jour,
      « Aujourd'hui » en avant, progression x/7, retard signalé,
      cocher/supprimer), carte « Votre planning aujourd'hui » sur le
      dashboard (actions dues non faites) — la boucle de rétention du produit
- [x] **Prévisualisation** : miniatures des cartes vidéo/idée et lien du
      panneau → **recherche TikTok réelle du sujet** (nouvel onglet) ;
      deviendra le lien direct de la vidéo quand les vraies données arriveront
- [x] Testé de bout en bout (compte jetable, supprimé après) : audit →
      7 actions datées en base → page Planning → cochage (1/7) → carte
      dashboard ; base laissée vierge pour le test utilisateur

### 2026-07-15 — Retours de test n°2 : état de connexion, clarté, miniatures
- [x] **Fix bug** : l'avatar « ER » du topbar était codé en dur (on semblait
      connecté même déconnecté) — remplacé par l'état réel : initiales de
      l'email → lien Réglages si connecté, bouton « Se connecter » sinon ;
      la cloche pointe vers /alertes ; avatar copilote « Moi »
- [x] **Titre du dashboard** : « Votre brief du jour » + sous-titre explicite
      (« Ce qui bouge dans vos niches et quoi tourner — recalculé chaque jour »)
- [x] **Score de profil à la place du « Pouls du marché »** (99/100 inutile :
      sur TikTok on poste tous les jours) : la carte du rail affiche le score
      du dernier audit (+ lien « Revoir mon audit »), ou un CTA « Analyser
      mon profil » si pas d'audit — meilleur funnel vers la page Analyse
- [x] **« Format transférable » → « Idée à voler à une autre niche »** avec
      une ligne d'explication du concept
- [x] **Miniatures façon TikTok** : barre d'actions latérale (avatar du
      créateur, cœur/commentaires/partages avec les vrais compteurs de la
      carte) — les vignettes ne font plus vides et évoquent de vraies
      captures ; en attendant les vraies miniatures (données réelles P2)

### 2026-07-15 — Pipeline de données TikTok réelles (prêt à activer)
- [x] Sondes finales : seuls les **profils** TikTok sont lisibles sans clé
      (déjà exploité) ; hashtags/tendances = API signée → un provider est
      indispensable (comme pour tous les SaaS du marché)
- [x] **Provider EnsembleData** (`src/lib/providers/tiktok.ts`) : vraies
      vidéos par niche suivie (posts du hashtag), cache serveur 45 min,
      parsing défensif, fallback silencieux vers la démo
- [x] `realVideo()` dans `data.ts` : le provider fournit les faits bruts
      (titre, stats, miniature, lien), l'enrichissement éditorial FR
      (hook dans la niche, plan de prod, explications) est dérivé
- [x] Rendu : **vraies miniatures** (img CDN TikTok, CSP ouverte à
      `*.tiktokcdn*`), **lien direct vers la vidéo**, badge « Réel »,
      note du rail adaptée ; intégré au brief (hero + À filmer en priorité)
      et au flux Idées (réelles en premier)
- [x] **ACTIVÉ ET TESTÉ EN RÉEL** (2026-07-15, token fourni) : le dashboard
      affiche de vraies vidéos TikTok — vraies miniatures (CDN signé),
      vrais créateurs (@vham77 17 M de vues...), vrais compteurs, tri par
      vues, lien direct — fix au passage : les posts sont dans
      `data.data` (pas `data.posts`) ; « 0 abonnés » masqué (non fourni
      par l'endpoint hashtag)
- [x] Vérifié sans token : mode démo intact (build + lint + rendu OK)
- [x] **Fraîcheur corrigée** (retour utilisateur : vidéos de plusieurs
      semaines) : bascule sur l'endpoint `keyword/search` avec **période
      7 jours** (retry 30 j si niche peu active), **tri par likes** et
      **filtre pays réel** (fr/us/gb...) — toutes les vidéos affichées ont
      désormais entre 1 h et 7 j
- [x] **« Viral en ce moment » aussi en réel** (le mélange réel/mock était
      incohérent) : tendances du pays via le mot-clé local (#pourtoi,
      #fyp, #parati...), hooks génériques sans niche
- [ ] Suite données réelles : « +X % » des vidéos réelles = estimé depuis
      l'engagement → afficher plutôt vues/jour réelles ; à l'échelle :
      cache partagé (table Supabase ou cron) au lieu du cache mémoire par
      instance ; candidater à l'API officielle TikTok en parallèle ;
      abonnés créateurs non fournis par tikwm (follower_count 0 masqué)

### 2026-07-16 — Sons et hashtags en vraies données + perfs provider
- [x] **Sons réels** : extraits des mêmes appels que les vidéos (zéro coût
      API en plus) — vrai nom/artiste/durée, **vraie pochette**, nombre
      total de vidéos réel (`user_count`), « Utilisé dans N tendances de
      vos niches cette semaine », badge Réel ; hero et plan du jour adaptés
- [x] **Hashtags réels** : agrégés des posts tendance des niches suivies
      (tags génériques filtrés), pondérés par vues, **lien direct vers la
      page du tag TikTok**, badge Réel
- [x] **Perfs provider** (l'API d'essai répond en 3-7 s) : timeout 20 s,
      déduplication des appels concurrents, **échéance souple 8 s** — la
      page ne bloque jamais, l'appel continue en arrière-plan et remplit
      le cache (rendu suivant : 0,03 s mesuré, tout en réel)
- [x] Vérifié en réel : sons (« Montagem Contigo Dale », 716 k vidéos,
      pochettes) et hashtags (#dancetrend, #worldcup...) réels à l'écran

### 2026-07-16 — Source gratuite (tikwm) + hooks réels : plus AUCUNE clé requise
- [x] **Sondes d'alternatives gratuites** : Creative Center TikTok toujours
      signé (40101), API Recherche officielle réservée aux chercheurs ;
      **tikwm.com fonctionne** — gratuit, sans clé, mêmes données que
      l'endpoint payant (recherche mot-clé, période 7/30 j, tri par likes,
      région, stats, musique + pochette, `region` par vidéo)
- [x] **tikwm = source PRIMAIRE** (`fetchTikwmPosts`, items normalisés vers
      le format aweme commun) : l'app tourne en vraies données sans aucun
      abonnement ; appels sérialisés ~1/s (limite publique) + cache 45 min ;
      filtre région par vidéo (on garde le pays demandé si ≥ 4 posts)
- [x] **EnsembleData rétrogradé en secours** : appelé seulement si tikwm
      renvoie < 4 posts — le quota du token est réservé aux pannes ;
      `SIGNAL_DEMO_DATA=1` force la démo (debug)
- [x] **Fix critique découvert au test** : `fetchKeywordBundle` gardait
      l'ancienne garde `if (!token) return EMPTY_BUNDLE` — sans token,
      RIEN n'était appelé (silencieux). Vérifié après fix : 42 badges
      « Réel » en prod avec `ENSEMBLEDATA_TOKEN=""` (0,04 s en cache)
- [x] **Hooks réels** (le cœur du produit) : l'accroche = première phrase
      de la description des posts qui tournent (`extractHookText`, filtre
      qualité : ≥ 3 mots, 12-110 caractères, rejet tags/emojis seuls ;
      < 10 k vues ignoré) ; **performance = % de likes MESURÉ**, type
      classifié (POV/Question/Chiffré/Curiosité), lien vers la vidéo
      source, badge Réel ; entrelacés par niche ; extraits des mêmes
      appels (zéro coût API en plus)
- [x] `realVideo()` : si la description contient une vraie accroche,
      c'est ELLE le hook de la vidéo (panneau Analyse + plan du jour) —
      le template par niche n'est plus qu'un filet de secours
- [x] Affichages honnêtes : HookCard réelle = « N vues · X % de likes »
      (plus de fausse « rétention »), plan du jour, panneau, citation du
      rail adaptés ; note du rail : « Vidéos, sons, hooks et hashtags...
      vraies données »
- [x] `.env.example` recréé (il avait disparu) : documente qu'aucune clé
      n'est requise pour les vraies données
- [x] Vérifié en réel sans token (Fitness/Danse, France) : 6 hooks réels
      FR à l'écran (« Il a failli me tuer avec ses grandes jambes ce
      fou 😭 »...), 6 sons réels avec pochettes, hashtags liés, vidéos
      fraîches < 7 j ; build + lint 0 erreur
- [ ] Honnêteté : tikwm est un service tiers non contractuel (comme tout
      scraping TikTok) — le « 100 % fiable » n'existe pas sur ce marché ;
      la résilience vient de la chaîne tikwm → EnsembleData → démo.
      À terme : candidater à l'API officielle TikTok, surveiller la
      disponibilité tikwm en prod

---

## 🔜 Immédiat

- [x] `npm install` dans le dossier principal — fait le 2026-07-15, build
      vérifié dans le dossier principal
- [x] `git push origin main` — fait le 2026-07-16 (`6b08f45..b9630fc`)
- [x] Supprimer le worktree devenu inutile — fait le 2026-07-16 (verrou
      orphelin déverrouillé ; c'était lui qui polluait le lint avec
      435 fausses erreurs)
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
- [x] Badge Alertes dynamique — fait le 2026-07-15

### P2 — Backend réel
- [x] Projet Supabase + schéma (`profiles`, `saved_items`, RLS) — fait le 2026-07-15
- [x] Authentification Supabase + préférences dans `profiles` — fait le 2026-07-15
- [x] Sauvegarde réelle dans `saved_items` + page Bibliothèque — fait le 2026-07-15
- [ ] Emails d'auth : personnaliser les templates Supabase (FR) et brancher
      un SMTP custom avant la prod (limite stricte du SMTP par défaut)
- [ ] **Ingestion de vraies tendances TikTok** remplaçant le mock `dataset()`
      (l'interface typée `Dataset` est le contrat à garder). Sondé le
      2026-07-15 : Creative Center = signature requise ; le profil public
      est lisible (déjà exploité par /api/profil). Options : provider payant
      (Apify / EnsembleData / ScrapTik) branché derrière `dataset()` avec
      cache + fallback mock — nécessite une clé et un budget à valider

### P3 — Industrialisation
- [x] Génération IA des scripts (API Claude, `claude-opus-4-8`) — fait le
      2026-07-15 ; **reste** : fournir `ANTHROPIC_API_KEY` dans `.env.local`
      et tester une génération réelle
- [ ] Session expirée côté client : rediriger vers /connexion au lieu du
      simple toast « Connectez-vous »
- [ ] Copilote IA réel : remplacer `answer()` dans
      `src/components/copilot/chat.tsx` par une route serveur API Claude
      (même pattern que `/api/script`)
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
| 2026-07-15 | Taxonomie de niches ouverte (champ libre + moteur par templates seedés) au lieu des 10 niches codées en dur | Audit client : la danseuse, le potier n'avaient aucune case — la valeur du produit est dans la micro-niche |
| 2026-07-15 | Analyse de profil accessible sans compte, rate-limitée par IP | C'est l'accroche d'acquisition (« audit gratuit de ton compte ») ; le coût IA est contenu par le rate limit |
| 2026-07-16 | Données TikTok : tikwm (gratuit) en primaire, EnsembleData en secours, démo en dernier recours | Zéro coût de données au lancement ; le « 100 % fiable » n'existant pas (tout est scraping non contractuel), la fiabilité vient de la chaîne de repli à 3 niveaux |
| 2026-07-16 | Hooks = accroches réelles extraites des descriptions, avec % de likes mesuré (plus de « rétention » inventée) | Les hooks sont l'atout du SaaS : une valeur inventée détruirait la confiance ; la description des posts est la seule accroche accessible sans transcrire les vidéos |
