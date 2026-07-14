/* =========================================================
   Signal — shared shell + components
   ========================================================= */

const UI = (() => {

  /* ---------- icon set (Lucide-style, 24x24 stroke) ---------- */
  const I = (paths, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra} aria-hidden="true">${paths}</svg>`;

  const icons = {
    bolt: I('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none"/>'),
    today: I('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15.5 11 17.5 15 13.5"/>'),
    ideas: I('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/>'),
    copilot: I('<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M9 14h.01M15 14h.01"/><path d="M2 14h2M20 14h2"/>'),
    alerts: I('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
    calendar: I('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    chevron: I('<path d="m6 9 6 6 6-6"/>'),
    refresh: I('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>'),
    sparkle: I('<path d="M12 3l1.9 5.7a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-2a2 2 0 0 0 1.3-1.2L12 3z" fill="currentColor" stroke="none"/>'),
    play: I('<path d="M6 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none"/>'),
    eye: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    heart: I('<path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/>'),
    up: I('<path d="M7 17 17 7"/><path d="M8 7h9v9"/>'),
    down: I('<path d="M7 7l10 10"/><path d="M17 8v9H8"/>'),
    check: I('<path d="M20 6 9 17l-5-5"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    music: I('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
    quote: I('<path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7a4 4 0 0 1-4 4"/><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7a4 4 0 0 1-4 4"/>'),
    users: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    hash: I('<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>'),
    copy: I('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    wand: I('<path d="m15 4 5 5"/><path d="m19.5 3.5-1 1M21.5 5.5l-1 1"/><path d="M2 22 14 10"/><path d="m14 4 6 6"/>'),
    save: I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
    film: I('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/>'),
    target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    scan: I('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    arrowRight: I('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    radar: I('<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62a10 10 0 1 0 19.02-1.27"/><path d="M16.24 7.76a6 6 0 1 0-8.01 8.91"/><path d="M12 18h.01"/><path d="M17.99 11.66a6 6 0 0 1-2.22 4.75"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>'),
    flame: I('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
  };

  /* ---------- app state ---------- */
  const state = {
    country: localStorage.getItem('sig-country') || 'France',
    timeframe: localStorage.getItem('sig-timeframe') || 'Today',
  };
  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function setState(patch) {
    Object.assign(state, patch);
    localStorage.setItem('sig-country', state.country);
    localStorage.setItem('sig-timeframe', state.timeframe);
    listeners.forEach(fn => fn(state));
  }
  const ds = () => Data.dataset(state.country, state.timeframe);

  /* ---------- shell ---------- */
  function renderShell(active) {
    const nav = [
      { id: 'today', label: 'Today', href: 'index.html', icon: icons.today },
      { id: 'ideas', label: 'Ideas', href: 'ideas.html', icon: icons.ideas },
      { id: 'copilot', label: 'AI Copilot', href: '#', icon: icons.copilot, soon: true },
      { id: 'alerts', label: 'Alerts', href: '#', icon: icons.alerts, badge: '3', soon: true },
      { id: 'settings', label: 'Settings', href: '#', icon: icons.settings, soon: true },
    ];
    document.getElementById('sidebar').innerHTML = `
      <a class="logo" href="index.html">
        <span class="logo-mark">${icons.bolt}</span>
        <span>Signal<span class="logo-tag">TikTok intelligence</span></span>
      </a>
      ${nav.map(n => `
        <a class="nav-item ${n.id === active ? 'active' : ''}" href="${n.href}" ${n.soon ? `data-soon="${n.label}"` : ''}>
          ${n.icon}<span>${n.label}</span>${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}
        </a>`).join('')}
      <div class="sidebar-foot"><span class="pulse"></span><span>Live · scanning ${state.country}</span></div>
    `;
    document.querySelectorAll('[data-soon]').forEach(el =>
      el.addEventListener('click', e => { e.preventDefault(); toast(`${el.dataset.soon} is coming soon`); }));

    document.getElementById('topbar').innerHTML = `
      <button class="search-trigger" id="open-cmdk" aria-label="Search">
        ${icons.search}<span>Search videos, creators, sounds, hashtags or hooks...</span><span class="kbd">⌘K</span>
      </button>
      <div class="top-actions">
        <div style="position:relative">
          <button class="select-chip" id="country-btn" aria-haspopup="true">
            ${icons.globe}<span class="chip-label" id="country-label">${state.country}</span>${icons.chevron}
          </button>
        </div>
        <div style="position:relative">
          <button class="select-chip" id="time-btn" aria-haspopup="true">
            ${icons.calendar}<span class="chip-label" id="time-label">${state.timeframe}</span>${icons.chevron}
          </button>
        </div>
        <button class="icon-btn" id="notif-btn" aria-label="Notifications">${icons.alerts}<span class="dot"></span></button>
        <button class="avatar" aria-label="Profile">ER</button>
      </div>
    `;
    document.getElementById('open-cmdk').addEventListener('click', openCmdk);
    document.getElementById('notif-btn').addEventListener('click', () => toast('3 alerts: 2 rising sounds, 1 hook update'));
    attachMenu('country-btn', Data.COUNTRIES.map(c => c.name), () => state.country,
      v => { setState({ country: v }); document.getElementById('country-label').textContent = v; });
    attachMenu('time-btn', Data.TIMEFRAMES.concat(['Custom']), () => state.timeframe,
      v => {
        if (v === 'Custom') { toast('Custom ranges are coming soon'); return; }
        setState({ timeframe: v }); document.getElementById('time-label').textContent = v;
      });
  }

  function attachMenu(btnId, options, getVal, onPick) {
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeMenus();
      const menu = document.createElement('div');
      menu.className = 'menu';
      menu.innerHTML = options.map(o =>
        `<button class="${o === getVal() ? 'on' : ''}" data-v="${o}">${o}</button>`).join('');
      btn.parentElement.appendChild(menu);
      menu.addEventListener('click', ev => {
        const b = ev.target.closest('button');
        if (b) { onPick(b.dataset.v); closeMenus(); }
      });
    });
  }
  function closeMenus() { document.querySelectorAll('.menu').forEach(m => m.remove()); }
  document.addEventListener('click', closeMenus);

  /* ---------- generated thumbnails (no external images) ---------- */
  function thumbBg(hue, angle = 160, id = '') {
    const h2 = (hue + 40) % 360;
    const seed = Data.hashStr(id + hue);
    const x = 20 + (seed % 55), y = 15 + (seed % 40);
    return `
      <div class="thumb-bg" style="background:
        radial-gradient(70% 60% at ${x}% ${y}%, hsl(${h2} 60% 38% / .75), transparent 65%),
        radial-gradient(90% 90% at 80% 90%, hsl(${hue} 55% 22% / .9), transparent 70%),
        linear-gradient(${angle}deg, hsl(${hue} 45% 16%), hsl(${hue} 60% 8%))">
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:.25" aria-hidden="true">
          <defs><pattern id="g${seed}" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="1.2" fill="hsl(${hue} 70% 70%)"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#g${seed})"/>
        </svg>
      </div>`;
  }
  function avatarStyle(hue) {
    return `background:linear-gradient(135deg,hsl(${hue} 55% 40%),hsl(${(hue + 45) % 360} 55% 26%))`;
  }
  function artworkStyle(hue) {
    return `background:radial-gradient(80% 80% at 25% 20%, hsl(${(hue + 50) % 360} 60% 45% / .8), transparent 60%),linear-gradient(140deg,hsl(${hue} 50% 30%),hsl(${hue} 60% 12%))`;
  }

  /* ---------- toast ---------- */
  let toastWrap;
  function toast(msg) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toasts';
      document.body.appendChild(toastWrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icons.check}<span>${msg}</span>`;
    toastWrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2600);
  }

  /* ---------- command palette ---------- */
  let cmdkEl;
  function buildCmdk() {
    cmdkEl = document.createElement('div');
    cmdkEl.className = 'cmdk';
    cmdkEl.innerHTML = `
      <div class="cmdk-box">
        <div class="cmdk-input">
          ${icons.search}
          <input id="cmdk-q" placeholder="Search videos, creators, sounds, hashtags or hooks..." aria-label="Global search"/>
          <span class="kbd">esc</span>
        </div>
        <div class="cmdk-results" id="cmdk-results"></div>
      </div>`;
    document.body.appendChild(cmdkEl);
    cmdkEl.addEventListener('click', e => { if (e.target === cmdkEl) closeCmdk(); });
    cmdkEl.querySelector('#cmdk-q').addEventListener('input', e => renderCmdkResults(e.target.value));
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); }
      if (e.key === 'Escape') closeCmdk();
    });
  }
  function openCmdk() {
    if (!cmdkEl) buildCmdk();
    cmdkEl.classList.add('open');
    const q = cmdkEl.querySelector('#cmdk-q');
    q.value = ''; renderCmdkResults(''); q.focus();
  }
  function closeCmdk() { if (cmdkEl) cmdkEl.classList.remove('open'); }

  function renderCmdkResults(q) {
    const box = cmdkEl.querySelector('#cmdk-results');
    const d = ds();
    q = q.trim().toLowerCase();
    if (!q) {
      box.innerHTML = `<div class="cmdk-empty"><b>Search everything on TikTok ${state.country}</b>Try a niche — “finance”, “restaurant” — or a creator, sound or hook.</div>`;
      return;
    }
    const match = s => s.toLowerCase().includes(q);
    const groups = [
      ['Videos', d.videos.filter(v => match(v.title) || match(v.niche)).slice(0, 4).map(v => ({
        icon: icons.film, hue: v.hue, label: v.title, meta: `${Data.fmt(v.views)} views · +${v.growth}%`,
        go: () => { location.href = 'ideas.html?q=' + encodeURIComponent(v.niche); } }))],
      ['Creators', d.creators.filter(c => match(c.handle) || match(c.niche)).slice(0, 3).map(c => ({
        icon: icons.users, hue: c.hue, label: c.handle, meta: `${Data.fmt(c.followers)} followers · ${c.niche}`,
        go: () => toast(`Creator report for ${c.handle} is being prepared`) }))],
      ['Sounds', d.sounds.filter(s => match(s.name) || match(s.artist)).slice(0, 3).map(s => ({
        icon: icons.music, hue: s.hue, label: s.name, meta: `+${s.growth}% · ${Data.fmt(s.videos)} videos`,
        go: () => toast(`“${s.name}” saved to your sound library`) }))],
      ['Hooks', d.hooks.filter(h => match(h.text)).slice(0, 3).map(h => ({
        icon: icons.quote, hue: 0, label: h.text, meta: `${h.performance}% retention`,
        go: () => { navigator.clipboard?.writeText(h.text); toast('Hook copied to clipboard'); } }))],
      ['Hashtags', d.hashtags.filter(t => match(t.tag)).slice(0, 3).map(t => ({
        icon: icons.hash, hue: 210, label: t.tag, meta: `${Data.fmt(t.videos)} videos`,
        go: () => { location.href = 'ideas.html?q=' + encodeURIComponent(t.niche); } }))],
    ].filter(([, items]) => items.length);

    if (!groups.length) {
      box.innerHTML = `<div class="cmdk-empty"><b>No strong signals for “${q}”</b>Try another country or timeframe — or search a broader niche.</div>`;
      return;
    }
    box.innerHTML = groups.map(([name, items]) => `
      <div class="cmdk-group">${name}</div>
      ${items.map((it, i) => `
        <button class="cmdk-item" data-g="${name}" data-i="${i}">
          <span class="ico" style="${avatarStyle(it.hue)}">${it.icon}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.label}</span>
          <span class="meta">${it.meta}</span>
        </button>`).join('')}`).join('');
    box.querySelectorAll('.cmdk-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = groups.find(([n]) => n === btn.dataset.g);
        g[1][+btn.dataset.i].go();
        closeCmdk();
      });
    });
  }

  /* ---------- shared card builders ---------- */
  function ring(value, accent = false) {
    const r = 19, c = 2 * Math.PI * r;
    return `
      <div class="ring ${accent ? 'accent' : ''}" role="img" aria-label="Confidence ${value}%">
        <svg viewBox="0 0 44 44">
          <circle class="track" cx="22" cy="22" r="${r}"/>
          <circle class="val" cx="22" cy="22" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value / 100)}"/>
        </svg>
        <span class="num">${value}</span>
      </div>`;
  }

  function videoCard(v, opts = {}) {
    return `
      <article class="card video-card reveal" style="animation-delay:${opts.delay || 0}ms">
        <div class="thumb">
          ${thumbBg(v.hue, v.angle, v.id)}
          <div class="thumb-top">
            <span class="badge green">${icons.up} +${v.growth}%</span>
            <span class="badge">${Data.dur(v.duration)}</span>
          </div>
          <div class="play-hint"><span class="circle">${icons.play}</span></div>
          <div class="thumb-bottom">
            <div class="thumb-title">${v.title}</div>
            <div class="thumb-meta"><span>${v.niche}</span><span>·</span><span>${v.country}</span><span>·</span><span>${Data.ago(v.uploadedH)}</span></div>
          </div>
        </div>
        <div class="video-body">
          <div class="creator-line">
            <span class="avatar-sm" style="width:26px;height:26px;font-size:9px;${avatarStyle(v.creator.hue)}">${v.creator.initials}</span>
            <span class="who">${v.creator.handle}</span>
            <span class="what">· ${Data.fmt(v.creator.followers)} followers</span>
          </div>
          <div class="video-stats">
            <span>${icons.eye}${Data.fmt(v.views)}</span>
            <span>${icons.heart}${Data.fmt(v.likes)}</span>
            <span class="up">${icons.up}Viral ${v.viralScore}</span>
          </div>
          <div class="ai-note">${icons.sparkle}<span>${v.summary} <strong>${v.context}</strong></span></div>
          <div class="chip-row">
            <span class="chip">${icons_inline('music')} ${v.sound.name}</span>
            <span class="chip">Hook: ${v.hook.type}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" data-act="analyze" data-id="${v.id}">Analyze</button>
            <button class="btn btn-primary btn-sm" data-act="version" data-id="${v.id}">Create my version</button>
          </div>
        </div>
      </article>`;
  }
  function icons_inline(name) {
    return `<span style="display:inline-flex;width:11px;height:11px;vertical-align:-1px">${icons[name]}</span>`;
  }

  function skeletonGrid(n, cls, h) {
    return Array.from({ length: n }, () =>
      `<div class="skeleton ${cls}" style="height:${h}px;border-radius:var(--r-lg)"></div>`).join('');
  }

  return { icons, state, onChange, setState, ds, renderShell, thumbBg, avatarStyle, artworkStyle, toast, openCmdk, ring, videoCard, skeletonGrid };
})();
