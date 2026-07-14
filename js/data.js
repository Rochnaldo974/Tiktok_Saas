/* =========================================================
   Signal — mock data engine
   Deterministic, seeded per (country, timeframe) so every
   "refresh" feels like live data without a backend.
   ========================================================= */

const Data = (() => {

  /* ---------- seeded RNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------- vocabulary ---------- */
  const COUNTRIES = [
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },
    { code: 'UK', name: 'UK', flag: '🇬🇧' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  ];

  const TIMEFRAMES = ['Today', '24 Hours', '7 Days', '30 Days'];

  const NICHES = [
    { name: 'Finance',     hue: 152, topics: ['a money mistake everyone makes', 'how I saved €10k in 6 months', 'the bank fee nobody checks', 'investing your first €100', 'why your savings lose value', 'the 50/30/20 rule tested', 'side income that actually works', 'reading a payslip properly'] },
    { name: 'Fitness',     hue: 12,  topics: ['the only 3 exercises you need', 'why your workout stopped working', 'a 10-minute morning routine', 'protein myths debunked', 'training twice a week results', 'fixing your posture at a desk', 'walking vs running for fat loss', 'gym anxiety and how to beat it'] },
    { name: 'Food',        hue: 35,  topics: ['a 5-ingredient dinner', 'the pasta technique chefs hide', 'meal prep for €20 a week', 'why restaurant rice tastes better', 'one pan, four meals', 'the butter trick for steak', 'bread with no kneading', 'grocery hauls ranked by a chef'] },
    { name: 'Beauty',      hue: 320, topics: ['the 3-product morning routine', 'why your foundation separates', 'drugstore dupes tested', 'skincare order explained', 'what dermatologists never buy', 'lash mistakes everyone makes', 'SPF myths corrected', 'a 2-minute everyday look'] },
    { name: 'Real Estate', hue: 210, topics: ['what €200k buys in each city', 'red flags in a rental visit', 'first apartment negotiation', 'staging tricks that add €15k', 'reading a property listing', 'why this flat stayed unsold', 'hidden costs of buying', 'renting vs buying in 2026'] },
    { name: 'Travel',      hue: 190, topics: ['48 hours in Lisbon done right', 'flight booking timing tested', 'the carry-on packing method', 'hotels vs apartments compared', 'the tourist trap map', 'travelling on €50 a day', 'airport hacks staff use', 'shoulder season secrets'] },
    { name: 'Gaming',      hue: 265, topics: ['the setting pros never touch', 'building a setup under €800', 'why you plateau in ranked', 'hidden mechanics explained', 'the warm-up routine that works', 'controller vs keyboard settled', 'games that respect your time', 'the aim drill that fixed me'] },
    { name: 'Lifestyle',   hue: 45,  topics: ['a realistic 5am routine', 'resetting your apartment weekly', 'the 2-minute rule in practice', 'what I stopped buying', 'a slow Sunday system', 'digital declutter walkthrough', 'habits that compound quietly', 'making weekdays feel lighter'] },
    { name: 'Marketing',   hue: 0,   topics: ['the hook formula behind 1M views', 'ads that feel like content', 'why your CTA gets ignored', 'a landing page in 60 seconds', 'organic vs paid in 2026', 'the psychology of pricing pages', 'UGC briefs that convert', 'email subject lines tested'] },
    { name: 'Education',   hue: 220, topics: ['the study method top students use', 'learning a language in 20 min a day', 'note-taking systems compared', 'memory tricks that survive exams', 'why re-reading fails', 'AI tools for studying honestly', 'the forgetting curve explained', 'focus without willpower'] },
  ];

  const FIRST = ['lea', 'max', 'nora', 'theo', 'emma', 'lucas', 'jade', 'hugo', 'lina', 'noah', 'mila', 'adam', 'zoe', 'liam', 'ines', 'sacha', 'anna', 'elio', 'maya', 'nino'];
  const SUFFIX = ['talks', 'daily', 'studio', 'notes', 'lab', 'files', 'club', 'works', 'diary', 'method', 'space', 'radar', 'signal', 'sense', 'mode', 'craft', 'scope', 'loop', 'shift', 'frame'];

  const SOUND_NAMES = [
    'Golden Hour Loop', 'Midnight Drive', 'Slow Motion Blur', 'Neon Static', 'Soft Focus',
    'Velvet Tempo', 'Glass Morning', 'Analog Heart', 'Paper Planes', 'Low Tide',
    'Sugar Rush', 'Night Shift', 'Open Window', 'Silver Lining', 'Warm Static',
    'Deep Fade', 'City Bloom', 'Quiet Storm', 'Amber Waves', 'Fast Lane',
    'Cloud Cover', 'Echo Park', 'Blue Hour', 'Daydream Sequence', 'Motionless',
    'After Hours', 'First Light', 'Undertone', 'Side Streets', 'Half Speed',
    'Overexposed', 'Backseat Radio', 'Cold Brew', 'Small Hours', 'Fever Pitch',
    'Late Bloom', 'Static Dreams', 'Sunset Grid', 'North Face', 'Double Take',
    'Slow Burn', 'Cross Fade', 'High Tide', 'Afterglow', 'Clean Break',
    'Night Vision', 'Second Wind', 'Free Fall', 'Homebound', 'Wide Awake',
    'Bright Side', 'Dark Room', 'Rewind Culture', 'Solar Flare', 'Ghost Note',
    'Vantage Point', 'New Balance', 'Off Script', 'Main Character', 'Final Cut',
  ];
  const ARTISTS = [
    'Novae', 'Kito Bay', 'Elm & Ivy', 'Marlowe', 'DJ Ceres', 'Aiko June', 'Fleur Noire',
    'The Standbys', 'Milo Reyes', 'Casa Blanca', 'Yuna Sol', 'Arcade Youth', 'Petit Bruit',
    'Hazel Grove', 'Lo-Fi Louvre', 'Nightbus', 'Clara West', 'Ombre', 'Ken Aoki', 'Vera Lune',
  ];

  const HOOK_TEMPLATES = [
    { text: 'Nobody talks about this {topic} trick...', type: 'Curiosity' },
    { text: 'Stop doing this if you care about {topic}.', type: 'Pattern interrupt' },
    { text: 'I wish someone had told me this about {topic}.', type: 'Confession' },
    { text: 'This is why your {topic} results are stuck.', type: 'Diagnosis' },
    { text: 'The {topic} rule I stole from a pro.', type: 'Authority' },
    { text: 'POV: you finally understand {topic}.', type: 'POV' },
    { text: 'I tested {topic} for 30 days. Here is what happened.', type: 'Experiment' },
    { text: 'You are one habit away from fixing {topic}.', type: 'Promise' },
    { text: 'Everyone gets {topic} wrong. Here is the fix.', type: 'Contrarian' },
    { text: 'Watch this before you spend money on {topic}.', type: 'Warning' },
    { text: 'The uncomfortable truth about {topic}.', type: 'Contrarian' },
    { text: '3 seconds to explain {topic}. Ready?', type: 'Challenge' },
  ];
  const HOOK_TOPICS = ['budgeting', 'your morning routine', 'meal prep', 'skincare', 'renting', 'solo travel', 'ranked games', 'productivity', 'your first ad', 'studying', 'saving money', 'home workouts', 'cooking pasta', 'makeup', 'apartment hunting', 'cheap flights', 'aim training', 'slow living', 'hooks', 'language learning'];

  const HASHTAG_BASE = ['fyp', 'pourtoi', 'viral', 'learnontiktok', 'tiktokacademie', 'creatortips', 'moneytok', 'fittok', 'foodtok', 'beautytok', 'immobilier', 'traveltok', 'gamingfr', 'lifestyle', 'marketingdigital', 'studytok', 'budget2026', 'gymtok', 'recetterapide', 'glowup', 'appartparis', 'cityguide', 'setupwars', 'morningroutine', 'growthhacking', 'examseason', 'epargne', 'homeworkout', 'batchcooking', 'skincareroutine', 'visiteappart', 'vanlife', 'esports', 'declutter', 'ugccreator', 'flashcards', 'investir', 'stretching', 'airfryer', 'maquillage', 'negociation', 'roadtrip', 'speedrun', 'slowliving', 'copywriting', 'memorisation', 'cryptofr', 'pilates', 'streetfood', 'cheveux'];

  const WHY_CHIPS = ['Curiosity Hook', 'Fast Editing', 'Strong CTA', 'Trending Sound', 'Storytelling', 'Emotion', 'Relatable', 'Controversial', 'Educational', 'Authentic'];
  const EMOTIONS = ['Curiosity', 'Surprise', 'Fear', 'Humor', 'Trust', 'Luxury', 'Inspiration', 'Competition', 'Urgency'];
  const CONTENT_TYPES = ['Storytelling', 'Tutorial', 'UGC', 'Comedy', 'Educational', 'Lifestyle', 'Review', 'Reaction', 'Interview', 'Behind the scenes'];
  const TREND_STATUS = ['New', 'Growing', 'Peaking', 'Saturated'];
  const CTAS = ['Follow for part 2', 'Comment your situation', 'Save this for later', 'Send this to a friend', 'Full guide in bio', 'Try it today and report back', 'Follow for the next test', 'Duet with your version'];

  const AI_VIDEO_REASONS = [
    'The first three seconds create an open question the viewer needs answered.',
    'A visible on-screen countdown keeps completion rate unusually high.',
    'Cuts land every 1.5 seconds, which holds attention through the midpoint.',
    'The creator states a mistake first, then resolves it — a proven retention arc.',
    'Text overlay contradicts the visual, forcing a second watch.',
    'A concrete number in the opening line anchors the promise immediately.',
    'The payoff is withheld until the final second, which drives rewatches.',
    'Native, unpolished framing reads as authentic and lifts trust.',
    'A relatable frustration is named in the first line, so comments fill with stories.',
    'The format invites duets, which multiplies organic reach.',
  ];
  const AI_VIDEO_CONTEXT = [
    'It is still early enough to reproduce this concept.',
    'Fewer than 200 creators have adapted this format so far.',
    'Adoption is accelerating — the next 48 hours matter.',
    'Similar videos in adjacent niches confirm the pattern.',
    'Competition is low outside the original niche.',
    'This structure transfers cleanly to other industries.',
  ];
  const AI_CREATOR_REASONS = [
    'Consistently growing thanks to strong storytelling.',
    'Posts daily with a repeatable format viewers recognize.',
    'Wins on hooks — average watch time is well above the niche.',
    'Turned one viral format into a durable series.',
    'Underrated: high engagement rate on a small following.',
    'Adopts rising sounds roughly two days before the crowd.',
    'Comments show a loyal community, not passive viewers.',
    'Growth is driven by saves and shares, the strongest signals.',
  ];
  const AI_SOUND_NOTES = [
    'Mostly used inside Lifestyle and Finance videos.',
    'Works best under storytelling voiceovers.',
    'Adoption doubled in the last 48 hours.',
    'Still below 5k videos — early window.',
    'Pairs well with before/after reveals.',
    'Strong in Beauty, starting to cross into Food.',
    'Creators using it early are outperforming their averages.',
    'The drop at second 7 is where most creators place the reveal.',
  ];
  const HOOK_EXPLANATIONS = [
    'Creates an information gap the viewer stays to close.',
    'Names a mistake first — people watch to check if it is theirs.',
    'A direct address that stops the scroll mid-swipe.',
    'Implies insider knowledge, which raises perceived value.',
    'Front-loads a promise, so the viewer knows the payoff.',
    'Uses mild controversy to trigger comment replies.',
    'The confession format builds instant trust.',
    'Specificity makes the claim feel tested, not sold.',
  ];

  const DIFF_REASONS = {
    Easy: 'One take, face to camera, no editing skill required.',
    Medium: 'Needs basic cuts and text overlays, but no set or crew.',
    Hard: 'Requires multiple locations, b-roll, and tight editing rhythm.',
  };
  const PROD_REASONS = {
    '15 min': 'Single take plus captions — record it on your next break.',
    '35 min': 'One filming session and a simple edit in CapCut.',
    '1 hour': 'A short shot list and one round of editing.',
    '2 hours': 'Plan the b-roll first; the edit carries this format.',
  };
  const SAT_REASONS = {
    Low: 'Few creators have adapted it — discovery potential is high.',
    Medium: 'Growing adoption. Differentiate with your niche angle.',
    High: 'Widely copied. Only a strong personal twist will stand out.',
  };

  /* ---------- generators ---------- */
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function int(rnd, min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }

  function buildCreators(rnd, country, n) {
    const used = new Set();
    const out = [];
    for (let i = 0; i < n; i++) {
      const niche = NICHES[i % NICHES.length];
      let handle;
      do { handle = '@' + pick(rnd, FIRST) + '.' + pick(rnd, SUFFIX); } while (used.has(handle));
      used.add(handle);
      const followers = int(rnd, 8, 900) * 1000;
      out.push({
        id: 'c' + i,
        handle,
        niche: niche.name,
        hue: (niche.hue + int(rnd, -14, 14) + 360) % 360,
        country,
        followers,
        growth: int(rnd, 4, 120) / 10, // % this week
        avgViews: Math.round(followers * (0.4 + rnd() * 2.2)),
        engagement: (2 + rnd() * 9).toFixed(1),
        reason: pick(rnd, AI_CREATOR_REASONS),
        initials: handle.slice(1, 3).toUpperCase(),
      });
    }
    return out.sort((a, b) => b.growth - a.growth);
  }

  function buildSounds(rnd, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const name = SOUND_NAMES[i % SOUND_NAMES.length] + (i >= SOUND_NAMES.length ? ' II' : '');
      const videos = int(rnd, 300, 48000);
      out.push({
        id: 's' + i,
        name,
        artist: pick(rnd, ARTISTS),
        hue: int(rnd, 0, 359),
        videos,
        growth: int(rnd, 15, 640),
        rising: videos < 6000,
        note: pick(rnd, AI_SOUND_NOTES),
        duration: int(rnd, 8, 32),
      });
    }
    return out.sort((a, b) => b.growth - a.growth);
  }

  function buildHooks(rnd, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = HOOK_TEMPLATES[i % HOOK_TEMPLATES.length];
      const topic = HOOK_TOPICS[(i * 7 + int(rnd, 0, 3)) % HOOK_TOPICS.length];
      const niches = [pick(rnd, NICHES).name, pick(rnd, NICHES).name].filter((v, ix, a) => a.indexOf(v) === ix);
      out.push({
        id: 'h' + i,
        text: t.text.replace('{topic}', topic),
        type: t.type,
        performance: int(rnd, 62, 97),
        industries: niches,
        avgDuration: int(rnd, 12, 34),
        explanation: pick(rnd, HOOK_EXPLANATIONS),
      });
    }
    return out.sort((a, b) => b.performance - a.performance);
  }

  function buildHashtags(rnd, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const tag = HASHTAG_BASE[i % HASHTAG_BASE.length] + (i >= HASHTAG_BASE.length ? (i % 9) : '');
      out.push({
        id: 't' + i,
        tag: '#' + tag,
        growth: int(rnd, -20, 420),
        videos: int(rnd, 2, 480) * 1000,
        niche: pick(rnd, NICHES).name,
      });
    }
    return out.sort((a, b) => b.growth - a.growth);
  }

  function buildVideos(rnd, country, creators, sounds, hooks, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const niche = NICHES[(i + int(rnd, 0, 2)) % NICHES.length];
      const nicheCreators = creators.filter(c => c.niche === niche.name);
      const creator = nicheCreators.length ? pick(rnd, nicheCreators) : pick(rnd, creators);
      const sound = pick(rnd, sounds);
      const hook = pick(rnd, hooks);
      const views = int(rnd, 40, 8200) * 1000;
      const growth = int(rnd, 40, 1900);
      const duration = int(rnd, 9, 58);
      const status = growth > 900 ? 'Peaking' : growth > 400 ? 'Growing' : growth > 150 ? 'New' : 'Saturated';
      const diff = duration < 20 ? 'Easy' : duration < 38 ? 'Medium' : 'Hard';
      const prod = diff === 'Easy' ? pick(rnd, ['15 min', '35 min']) : diff === 'Medium' ? pick(rnd, ['35 min', '1 hour']) : '2 hours';
      const sat = status === 'Saturated' ? 'High' : status === 'Peaking' ? 'Medium' : 'Low';
      const chips = [...WHY_CHIPS].sort(() => rnd() - 0.5).slice(0, int(rnd, 3, 5));
      const emotions = [...EMOTIONS].sort(() => rnd() - 0.5).slice(0, int(rnd, 2, 3));
      out.push({
        id: 'v' + i,
        title: pick(rnd, niche.topics),
        niche: niche.name,
        hue: (niche.hue + int(rnd, -18, 18) + 360) % 360,
        angle: int(rnd, 100, 260),
        country,
        creator, sound, hook,
        contentType: pick(rnd, CONTENT_TYPES),
        duration,
        views,
        likes: Math.round(views * (0.05 + rnd() * 0.12)),
        comments: Math.round(views * (0.002 + rnd() * 0.012)),
        shares: Math.round(views * (0.004 + rnd() * 0.02)),
        growth,
        viralScore: Math.min(99, Math.round(52 + growth / 28 + rnd() * 14)),
        opportunity: Math.min(98, Math.round(45 + (sat === 'Low' ? 26 : sat === 'Medium' ? 12 : 0) + rnd() * 22)),
        status,
        difficulty: diff,
        diffReason: DIFF_REASONS[diff],
        prodTime: prod,
        prodReason: PROD_REASONS[prod],
        budget: pick(rnd, ['Free', 'Free', 'Low', 'Low', 'Medium', 'High']),
        saturation: sat,
        satReason: SAT_REASONS[sat],
        chips, emotions,
        cta: pick(rnd, CTAS),
        uploadedH: int(rnd, 1, 46),
        summary: pick(rnd, AI_VIDEO_REASONS),
        context: pick(rnd, AI_VIDEO_CONTEXT),
      });
    }
    return out.sort((a, b) => b.growth - a.growth);
  }

  /* ---------- dataset (memoized per state) ---------- */
  const cache = {};
  function dataset(countryName, timeframe) {
    const key = countryName + '|' + timeframe;
    if (cache[key]) return cache[key];
    const rnd = mulberry32(hashStr(key));
    const creators = buildCreators(rnd, countryName, 80);
    const sounds = buildSounds(rnd, 60);
    const hooks = buildHooks(rnd, 100);
    const hashtags = buildHashtags(rnd, 80);
    const videos = buildVideos(rnd, countryName, creators, sounds, hooks, 120);
    const ds = { creators, sounds, hooks, hashtags, videos, rnd };
    cache[key] = ds;
    return ds;
  }

  /* ---------- formatters ---------- */
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.0', '') + 'K';
    return String(n);
  }
  function dur(s) { return '0:' + String(s).padStart(2, '0'); }
  function ago(h) { return h < 24 ? h + 'h ago' : Math.round(h / 24) + 'd ago'; }

  return { COUNTRIES, TIMEFRAMES, NICHES, CONTENT_TYPES, TREND_STATUS, dataset, fmt, dur, ago, mulberry32, hashStr };
})();
