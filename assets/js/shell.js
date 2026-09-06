// ==========================================================================
// PRESTIGE V1 — SHELL (Phase 1)
// This file adds the new Home/Rankings/Play/Players/More navigation on top
// of the existing app, WITHOUT renaming or altering any legacy tab identity.
// Legacy tab values (summary, power, findgame, players, wl, callouts, h2h,
// games, wishlist, upcoming, manage) are untouched -- this is a mapping layer
// only, per the agreed Phase 1 contract. Load this file after app.js.
// ==========================================================================

const SECTION_TAB_MAP = { home: 'summary', rankings: 'power', play: 'findgame', players: 'players' };
const TAB_TO_SECTION = {};
Object.keys(SECTION_TAB_MAP).forEach(sec => { TAB_TO_SECTION[SECTION_TAB_MAP[sec]] = sec; });

const MORE_ITEMS = [
  { tab: 'callouts', label: 'Insights / Call-Outs' },
  { tab: 'h2h', label: 'Head to Head' },
  { tab: 'games', label: 'Games' },
  { tab: 'wishlist', label: 'Wishlist' },
  { tab: 'upcoming', label: 'Upcoming' },
  { tab: 'wl', label: 'Win / Loss' },
];
const MORE_ADMIN_ITEM = { tab: 'manage', label: 'Admin / Manage' };

let activeSection = 'rankings'; // matches legacy default activeTab === 'power'

function legacyTabBtn(tab){
  return document.querySelector(`#tabrow .tab-btn[data-tab="${tab}"]`);
}

function goToSection(section){
  const tab = SECTION_TAB_MAP[section];
  if(tab){
    const btn = legacyTabBtn(tab);
    if(btn) btn.click(); // reuses 100% of existing tab-switch logic untouched
  } else if(section === 'more'){
    openMoreSheet();
    return; // don't change activeSection until a specific destination is chosen
  }
  activeSection = section;
  updateBottomNavHighlight();
}

function updateBottomNavHighlight(){
  document.querySelectorAll('.shell-nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.section === activeSection);
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
    ${MORE_ITEMS.map(it => `<button class="shell-more-item" data-tab="${it.tab}">${it.label}<span class="chev">›</span></button>`).join('')}
    <button class="shell-more-item admin-item" data-tab="${MORE_ADMIN_ITEM.tab}">${MORE_ADMIN_ITEM.label}<span class="chev">›</span></button>
  </div>`;
  document.body.appendChild(sheet);
  sheet.addEventListener('click', (e)=>{ if(e.target === sheet) closeMoreSheet(); });
  sheet.querySelectorAll('.shell-more-item').forEach(btn=>{
    btn.onclick = ()=>{
      const b = legacyTabBtn(btn.dataset.tab);
      if(b) b.click();
      activeSection = 'more';
      updateBottomNavHighlight();
      closeMoreSheet();
    };
  });

  // Keep bottom-nav highlight in sync no matter how the legacy tab changes
  // (new nav, More sheet, or internal app.js navigation like "Edit this game").
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
  // already run and updated activeTab/rendered its view, so the podium check
  // (which reads the now-current activeTab) is always accurate -- this is
  // what actually removes a stale podium when navigating to a tab that has
  // its own render function (Players, Games, etc.) rather than calling the
  // shared render() the podium hook is attached to.
  document.getElementById('tabrow').addEventListener('click', (e)=>{
    if(!e.target.closest('.tab-btn')) return;
    renderRankingsPodium();
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
  const sortbarPower = document.getElementById('sortbarPower');

  // Compact primary bar: Month + Tier stay visible and get restyled smaller;
  // Min games becomes a single pill; Filters opens the secondary sheet.
  const compactBar = document.createElement('div');
  compactBar.id = 'compactFiltersBar';
  compactBar.className = 'compact-filters-bar';
  compactBar.innerHTML = `<button class="filter-pill" id="minGamesPill">10+ games</button>
    <button class="filter-pill" id="openFiltersBtn">Filters ⚲</button>`;
  monthFilterRow.classList.add('compact-month');
  tierbar.classList.add('compact-tierbar');
  compactBar.insertBefore(monthFilterRow, compactBar.firstChild);
  compactBar.insertBefore(tierbar, compactBar.children[1]);
  document.querySelector('.controls').insertBefore(compactBar, document.getElementById('tabrow').nextSibling);

  // Secondary sheet: Data quality, full min-games control, search, and the
  // three less-frequently-used sort modes -- nothing removed, just relocated.
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

  document.getElementById('openFiltersBtn').onclick = ()=> sheet.classList.add('show');
  document.getElementById('minGamesPill').onclick = ()=> sheet.classList.add('show');

  // Keep the pill's label in sync with the actual (still fully functional) min-games control.
  const minGamesInputEl = document.getElementById('minGamesInput');
  const syncPillLabel = ()=>{ document.getElementById('minGamesPill').textContent = `${minGamesInputEl.value}+ games`; };
  minGamesInputEl.addEventListener('input', syncPillLabel);
  document.querySelectorAll('.minGamesPresets .preset-btn').forEach(b=> b.addEventListener('click', ()=> setTimeout(syncPillLabel, 0)));
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
});
