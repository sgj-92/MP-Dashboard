// ==========================================================================
// PRESTIGE V1 — SHELL (Phase 1)
// This file adds the new Home/Rankings/Play/Players/More navigation on top
// of the existing app, WITHOUT renaming or altering any legacy tab identity.
// Legacy tab values (summary, power, findgame, players, wl, callouts, h2h,
// games, wishlist, upcoming, manage) are untouched -- this is a mapping layer
// only, per the agreed Phase 1 contract. Load this file after app.js.
// ==========================================================================

// SINGLE-TAB sections (no subnav): Home only.
const SECTION_TAB_MAP = { home: 'summary' };

// MULTI-TAB sections: a visible segmented subnav under the header, per the IA
// correction. First entry in each list is that section's default landing tab.
const SECTION_SUBNAV = {
  rankings: [
    { tab: 'power', label: 'Power Rankings' },
    { tab: 'wl', label: 'Win / Loss' },
  ],
  play: [
    { tab: 'findgame', label: 'Find Game' },
    { tab: 'games', label: 'Games' },
    { tab: 'upcoming', label: 'Upcoming' },
    { tab: 'wishlist', label: 'Requests' },
  ],
  players: [
    { tab: 'players', label: 'Directory' },
    { tab: 'h2h', label: 'Compare' },
  ],
};

const TAB_TO_SECTION = { summary: 'home' };
Object.keys(SECTION_SUBNAV).forEach(sec=>{
  SECTION_SUBNAV[sec].forEach(item=>{ TAB_TO_SECTION[item.tab] = sec; });
});

// More is now genuinely secondary only -- everything with a real home above
// (Games, Upcoming, Requests, Compare/H2H, Win/Loss) has been moved out.
const MORE_ITEMS = [
  { tab: 'callouts', label: 'Insights / Call-Outs' },
  { special: 'about', label: 'About Power Rankings' },
];
const MORE_ADMIN_ITEM = { tab: 'manage', label: 'Admin / Manage' };

let activeSection = 'rankings'; // matches legacy default activeTab === 'power'

function legacyTabBtn(tab){
  return document.querySelector(`#tabrow .tab-btn[data-tab="${tab}"]`);
}

function goToSection(section){
  if(section === 'more'){
    openMoreSheet();
    return; // don't change activeSection until a specific destination is chosen
  }
  const singleTab = SECTION_TAB_MAP[section];
  const subnav = SECTION_SUBNAV[section];
  const targetTab = singleTab || (subnav && subnav[0].tab); // default to first subnav item
  if(targetTab){
    const btn = legacyTabBtn(targetTab);
    if(btn) btn.click(); // reuses 100% of existing tab-switch logic untouched
  }
  activeSection = section;
  updateBottomNavHighlight();
  renderSectionSubnav();
}

function updateBottomNavHighlight(){
  document.querySelectorAll('.shell-nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.section === activeSection);
  });
}

// Renders (or hides) the visible segmented subnav for the current section.
// Not a menu -- always on-screen for sections that have one, per the "must
// be discoverable, not hidden behind another tap" requirement.
function renderSectionSubnav(){
  const container = document.getElementById('sectionSubnav');
  const items = SECTION_SUBNAV[activeSection];
  if(!items){ container.style.display = 'none'; container.innerHTML = ''; return; }
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${items.length}, 1fr)`;
  container.innerHTML = items.map(it=>
    `<button class="section-subnav-item ${it.tab===activeTab?'active':''}" data-tab="${it.tab}">${it.label}</button>`
  ).join('');
  container.querySelectorAll('.section-subnav-item').forEach(btn=>{
    btn.onclick = ()=>{ const b = legacyTabBtn(btn.dataset.tab); if(b) b.click(); };
  });
}

function openMoreSheet(){
  document.getElementById('shellMoreSheet').classList.add('show');
}
function closeMoreSheet(){
  document.getElementById('shellMoreSheet').classList.remove('show');
}

function buildShellDom(){
  // Header
  const header = document.createElement('div');
  header.className = 'shell-header';
  header.innerHTML = `
    <div class="brand-mark"><img src="assets/brand/mp-mark.svg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'nav-icon-fallback',textContent:'MP'}))"></div>
    <div class="brand-wordmark">Money <b>Padel</b></div>
    <div class="shell-section-title" id="shellSectionTitle">Rankings</div>
  `;
  document.body.insertBefore(header, document.body.firstChild);

  // Visible section subnav mount point, right under the header.
  const subnav = document.createElement('div');
  subnav.id = 'sectionSubnav';
  subnav.className = 'section-subnav';
  subnav.style.display = 'none';
  header.parentNode.insertBefore(subnav, header.nextSibling);

  // Bottom nav
  const nav = document.createElement('div');
  nav.className = 'shell-bottom-nav';
  const navItems = [
    { section: 'home', label: 'Home', icon: 'home' },
    { section: 'rankings', label: 'Rankings', icon: 'rankings' },
    { section: 'play', label: 'Play', icon: 'play' },
    { section: 'players', label: 'Players', icon: 'players' },
    { section: 'more', label: 'More', icon: 'more' },
  ];
  nav.innerHTML = navItems.map(it => `
    <button class="shell-nav-item" data-section="${it.section}">
      <img src="assets/icons/${it.icon}.svg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'nav-icon-fallback',textContent:'${it.label[0]}'}))">
      <span>${it.label}</span>
    </button>
  `).join('');
  document.body.appendChild(nav);
  nav.querySelectorAll('.shell-nav-item').forEach(btn=>{
    btn.onclick = ()=> goToSection(btn.dataset.section);
  });

  // More sheet
  const sheet = document.createElement('div');
  sheet.className = 'shell-more-sheet';
  sheet.id = 'shellMoreSheet';
  sheet.innerHTML = `<div class="shell-more-panel">
    <h3>More</h3>
    ${MORE_ITEMS.map(it => `<button class="shell-more-item" data-tab="${it.tab||''}" data-special="${it.special||''}">${it.label}<span class="chev">›</span></button>`).join('')}
    <button class="shell-more-item admin-item" data-tab="${MORE_ADMIN_ITEM.tab}">${MORE_ADMIN_ITEM.label}<span class="chev">›</span></button>
  </div>`;
  document.body.appendChild(sheet);
  sheet.addEventListener('click', (e)=>{ if(e.target === sheet) closeMoreSheet(); });
  sheet.querySelectorAll('.shell-more-item').forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.special === 'about'){
        closeMoreSheet();
        openAboutPowerRankings();
        return;
      }
      const b = legacyTabBtn(btn.dataset.tab);
      if(b) b.click(); // the #tabrow capture listener already updates activeSection/subnav correctly
      closeMoreSheet();
    };
  });

  // "About Power Rankings" -- reuses the exact methodology text already
  // written for the Rankings "How this works" disclosure (copied once as a
  // static string here, since it's a fixed piece of UI copy, not business
  // logic -- reading the live #explainer element wouldn't be safe, since its
  // content changes to whichever tab was last active).
  const ABOUT_POWER_RANKINGS_TEXT = 'Ratings start from the tier each player is already known to sit in (S highest, C lowest) — the tiers are treated as real signal, not something the model has to rediscover from scratch. From there, results move you based on <b>games won within each match</b>, not just who won — a close 3-set loss barely costs anything, a 6-1 6-2 loss costs a lot. A player with few games stays close to their tier baseline since there isn\'t much evidence yet to move them; a player with a long track record can drift further from it. "Avg opp." is the average strength of everyone you\'ve played with and against. "Clutch %" compares your actual scorelines to what your tier and opponents would predict. "Upset wins/losses" count matches where the underdog won outright (or the favorite lost outright) by a meaningful ratings gap — a fast way to spot giant-killers and upset-prone favorites. Use the min-games filter below to hide anyone with too few games for these numbers to mean much. "Recent Form" sorts by wins over the last 10 games first, then by average overperformance as a tiebreaker — a faster-moving signal than the overall rating, useful for spotting who\'s trending right now.';
  function openAboutPowerRankings(){
    let modal = document.getElementById('aboutModal');
    if(!modal){
      modal = document.createElement('div');
      modal.className = 'shell-more-sheet';
      modal.id = 'aboutModal';
      modal.innerHTML = `<div class="shell-more-panel">
        <h3>About Power Rankings</h3>
        <div id="aboutModalBody" class="section-sub" style="font-size:12.5px; line-height:1.6;">${ABOUT_POWER_RANKINGS_TEXT}</div>
      </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e)=>{ if(e.target === modal) modal.classList.remove('show'); });
    }
    modal.classList.add('show');
  }

  // Keep bottom-nav highlight (and section subnav) in sync no matter how the
  // legacy tab changes (new nav, subnav, More sheet, or internal app.js
  // navigation like "Edit this game").
  document.getElementById('tabrow').addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab-btn');
    if(!btn) return;
    const tab = btn.dataset.tab;
    activeSection = TAB_TO_SECTION[tab] || 'more';
    updateBottomNavHighlight();
    const titleEl = document.getElementById('shellSectionTitle');
    if(titleEl){
      const sectionLabels = { home:'Home', rankings:'Rankings', play:'Play', players:'Players', more:'More' };
      titleEl.textContent = sectionLabels[activeSection] || '';
    }
  }, true);

  // Separate, non-capturing listener: fires AFTER the legacy tab handler has
  // already run and updated activeTab/rendered its view, so both the podium
  // check and the subnav highlight (which reads the now-current activeTab)
  // are accurate -- this is what actually removes a stale podium when
  // navigating to a tab with its own render function (Players, Games, etc.)
  // rather than the shared render() the podium hook is attached to, and what
  // correctly highlights the just-clicked subnav item rather than the
  // previous one.
  document.getElementById('tabrow').addEventListener('click', (e)=>{
    if(!e.target.closest('.tab-btn')) return;
    renderRankingsPodium();
    renderSectionSubnav();
  });
}

// ---- Rankings podium -----------------------------------------------------
// Canonical state, per agreed spec: Power Rating + All time + All tiers +
// Rating sort + empty search + default min-games threshold. Any deviation
// collapses back to the plain compact ranking list -- no separate state,
// just reading the same variables the rest of the app already uses.
function isCanonicalRankingsState(){
  return activeTab === 'power'
    && selectedMonth === 'all'
    && activeTier === 'All'
    && activeSortP === 'rating'
    && query === ''
    && minGames === 10;
}

function renderRankingsPodium(){
  const existing = document.getElementById('rankingsPodium');
  if(existing) existing.remove();

  if(activeTab !== 'power') return;
  if(!isCanonicalRankingsState()) return;

  const list = document.getElementById('list');
  if(!list) return;

  const top3 = PLAYERS.filter(p => p.total >= minGames).slice().sort((a,b)=> b.rating - a.rating).slice(0,3);
  if(top3.length < 3) return; // not enough qualifying players for a podium yet

  const order = [top3[1], top3[0], top3[2]]; // visual order: 2nd, 1st, 3rd
  const slotClass = ['second','first','third'];
  const podium = document.createElement('div');
  podium.className = 'rankings-podium';
  podium.id = 'rankingsPodium';
  podium.innerHTML = `
    <div class="podium-row">
      ${order.map((p,i)=> `
        <div class="podium-slot ${slotClass[i]}" data-player="${p.name}">
          ${slotClass[i]==='first' ? `<div class="crown"><img src="assets/rankings/crown.svg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'nav-icon-fallback',textContent:'1'}))"></div>` : `<div class="rank-num">${slotClass[i]==='second'?'2':'3'}</div>`}
          <div class="p-name">${p.name}</div>
          <div class="p-rating">${Math.round(p.rating)}</div>
          <div class="p-pedestal"></div>
        </div>
      `).join('')}
    </div>
    <div class="podium-caption">Money Padel · Official Power Ranking</div>
  `;
  list.parentNode.insertBefore(podium, list);
  podium.querySelectorAll('.podium-slot').forEach(el=>{
    el.onclick = ()=> openSheet(el.dataset.player);
  });
}

// ---- Phase 1B: Rankings hero, compact filter bar, secondary Filters sheet --
// Reparents existing (already-wired) legacy controls into new compact/secondary
// containers rather than duplicating them, so every existing event listener
// keeps working untouched -- only where each control physically lives changes.

function buildRankingsHero(){
  const hero = document.createElement('div');
  hero.id = 'rankingsHero';
  hero.style.cssText = 'display:none; padding: var(--space-4) var(--space-4) 0;';
  hero.innerHTML = `
    <div style="font-family:var(--font-interface); font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-dim);">Money Padel · Results Only</div>
    <div style="font-family:var(--font-prestige); font-size:26px; color:var(--gold-bright); margin-top:2px;">Power Rankings</div>
    <div style="font-family:var(--font-interface); font-size:12px; color:var(--text-dim); margin-top:2px;">A tier-anchored rating. Scoreline counts, not just who won.</div>
  `;
  const controls = document.querySelector('.controls');
  controls.parentNode.insertBefore(hero, controls);
  return hero;
}

function buildCompactFiltersBar(){
  const dataQualityRow = document.getElementById('dataQualityRow');
  const monthFilterRow = document.getElementById('monthFilterRow');
  const tierbar = document.getElementById('tierbar');
  const searchWrap = document.getElementById('searchWrap');
  const minGamesRow = document.getElementById('minGamesRow');
  const monthSelectEl = document.getElementById('monthSelect');

  // Tier becomes a real compact dropdown -- built fresh, but every option's
  // onchange just triggers a .click() on the real, already-wired legacy
  // button for that value. No logic duplicated. The pill strip itself is
  // retired for good (see #tierbar{display:none!important} in app.css).
  const tierSelect = document.createElement('select');
  tierSelect.id = 'tierSelectCompact';
  [...tierbar.querySelectorAll('.tierbtn')].forEach(btn=>{
    const opt = document.createElement('option');
    opt.value = btn.dataset.tier;
    opt.textContent = btn.textContent;
    tierSelect.appendChild(opt);
  });
  tierSelect.value = activeTier;
  tierSelect.onchange = ()=>{
    const btn = tierbar.querySelector(`.tierbtn[data-tier="${tierSelect.value}"]`);
    if(btn) btn.click();
  };

  // One clean row: Month | Tier | Filter icon. Month's own "Month:" label
  // wrapper is left behind -- only the raw select moves into the toolbar.
  const toolbar = document.createElement('div');
  toolbar.id = 'rankingsToolbar';
  toolbar.className = 'rankings-toolbar';
  toolbar.appendChild(monthSelectEl);
  toolbar.appendChild(tierSelect);
  const filtersBtn = document.createElement('button');
  filtersBtn.className = 'filter-btn';
  filtersBtn.id = 'openFiltersBtn';
  filtersBtn.innerHTML = `⚲<span class="filter-dot"></span>`;
  toolbar.appendChild(filtersBtn);
  document.querySelector('.controls').insertBefore(toolbar, document.getElementById('tabrow').nextSibling);
  monthFilterRow.style.display = 'none'; // now empty (its select moved out) -- keep it inert, not visible

  // Everything secondary lives in Filters: Data quality, search, min games
  // (moved fully off the main screen, per the correction), and the three
  // less-frequently-used sort modes.
  const sortbarPower = document.getElementById('sortbarPower');
  const secondarySortWrap = document.createElement('div');
  secondarySortWrap.id = 'secondarySortWrap';
  secondarySortWrap.className = 'fg-row';
  ['month_rating', 'avg_match_strength', 'name'].forEach(key=>{
    const btn = sortbarPower.querySelector(`[data-sortp="${key}"]`);
    if(btn) secondarySortWrap.appendChild(btn);
  });

  const sheet = document.createElement('div');
  sheet.className = 'shell-more-sheet';
  sheet.id = 'shellFiltersSheet';
  const panel = document.createElement('div');
  panel.className = 'shell-more-panel';
  panel.innerHTML = `<h3>Filters</h3>`;
  panel.appendChild(dataQualityRow);
  panel.appendChild(searchWrap);
  panel.appendChild(minGamesRow);
  const secondarySortLabel = document.createElement('div');
  secondarySortLabel.className = 'section-sub';
  secondarySortLabel.style.cssText = 'margin-top:12px;';
  secondarySortLabel.textContent = 'More ways to sort';
  panel.appendChild(secondarySortLabel);
  panel.appendChild(secondarySortWrap);
  sheet.appendChild(panel);
  document.body.appendChild(sheet);
  sheet.addEventListener('click', (e)=>{ if(e.target === sheet) sheet.classList.remove('show'); });

  filtersBtn.onclick = ()=> sheet.classList.add('show');

  // Gold dot on the Filter icon whenever any non-default filter is active --
  // the only visible cue needed now that Min Games/Data/Search aren't shown
  // permanently on screen.
  const dataQualitySelectEl = document.getElementById('dataQualitySelect');
  const searchInputEl = document.getElementById('search');
  const minGamesInputEl = document.getElementById('minGamesInput');
  function updateFilterDot(){
    const nonDefault = minGames !== 10 || (searchInputEl.value.trim() !== '') || (dataQualitySelectEl.value !== 'verified');
    filtersBtn.classList.toggle('has-filters', nonDefault);
  }
  minGamesInputEl.addEventListener('input', ()=> setTimeout(updateFilterDot, 0));
  document.querySelectorAll('.minGamesPresets .preset-btn').forEach(b=> b.addEventListener('click', ()=> setTimeout(updateFilterDot, 0)));
  searchInputEl.addEventListener('input', updateFilterDot);
  dataQualitySelectEl.addEventListener('change', updateFilterDot);

  // Screen isolation: the toolbar belongs to Rankings (both Power Rankings
  // and Win/Loss share Month/Tier filtering) and must never persist onto
  // Play/Players/Games/etc. Controlled directly here rather than fighting
  // app.js's own per-element visibility toggling, which is what caused the
  // tier pill strip to keep reappearing before.
  function syncToolbarVisibility(){
    toolbar.style.display = (activeTab === 'power' || activeTab === 'wl') ? 'grid' : 'none';
  }
  document.getElementById('tabrow').addEventListener('click', ()=> setTimeout(syncToolbarVisibility, 0));
  syncToolbarVisibility();
}

function buildCollapsibleExplainer(){
  const explainer = document.getElementById('explainer');
  const wrapper = document.createElement('div');
  wrapper.id = 'explainerWrapper';
  explainer.parentNode.insertBefore(wrapper, explainer);
  const toggle = document.createElement('button');
  toggle.id = 'explainerToggle';
  toggle.className = 'explainer-toggle';
  toggle.textContent = 'How this works ›';
  wrapper.appendChild(toggle);
  wrapper.appendChild(explainer);
  explainer.style.display = 'none';
  toggle.onclick = ()=>{
    const isOpen = explainer.style.display !== 'none';
    explainer.style.display = isOpen ? 'none' : 'block';
    toggle.textContent = isOpen ? 'How this works ›' : 'How this works ⌄';
  };
}

document.addEventListener('DOMContentLoaded', ()=>{
  buildShellDom();
  const hero = buildRankingsHero();
  buildCompactFiltersBar();
  buildCollapsibleExplainer();

  // Wrap the legacy render() so the podium is (re)computed on every
  // Power Rating re-render, without touching render() itself.
  const _originalRender = window.render;
  window.render = function(){
    _originalRender.apply(this, arguments);
    renderRankingsPodium();
    hero.style.display = (activeTab === 'power') ? 'block' : 'none';
  };
  // The hero also needs to hide immediately when leaving Rankings via a tab
  // that doesn't call render() at all (Players, Games, etc.).
  document.getElementById('tabrow').addEventListener('click', ()=>{
    hero.style.display = (activeTab === 'power') ? 'block' : 'none';
  });

  updateBottomNavHighlight();
  renderSectionSubnav();
});
