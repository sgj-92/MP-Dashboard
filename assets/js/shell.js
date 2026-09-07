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
    { tab: 'power', label: 'Power Rankings', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 20v-6"/><path d="M12 20V8"/><path d="M18 20v-10"/><path d="M4 20h16"/></svg>' },
    { tab: 'wl', label: 'Win / Loss', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6 3.2"/></svg>' },
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
  // Tapping Home always resets to the dashboard view, even if "View Full
  // Review" was open -- an implicit "back to Home" path.
  if(section === 'home'){
    const backBtn = document.getElementById('homeBackFromReview');
    if(backBtn) backBtn.style.display = 'none';
    const summaryEl = document.getElementById('summaryView');
    if(summaryEl) summaryEl.style.display = 'none';
    renderHomeDashboard();
    document.getElementById('homeDashboard').style.display = 'block';
  }
  updateHeaderForSection();
}

// The header's right-side slot becomes the player switcher on Home
// ("Shaun ▾"), reusing the same selector the first-launch flow and My
// Player entry already use -- reverts to the plain section label elsewhere.
function updateHeaderForSection(){
  const titleEl = document.getElementById('shellSectionTitle');
  if(!titleEl) return;
  if(activeSection === 'home'){
    const viewer = getCurrentViewer();
    titleEl.innerHTML = `<button id="homeViewerSwitch" class="home-viewer-switch">${viewer ? viewer.name : 'Choose player'} ▾</button>`;
    document.getElementById('homeViewerSwitch').onclick = ()=> buildViewerSelector();
  } else {
    const sectionLabels = { rankings:'Rankings', play:'Play', players:'Players', more:'More' };
    titleEl.innerHTML = sectionLabels[activeSection] || '';
  }
}

function updateBottomNavHighlight(){
  document.querySelectorAll('.shell-nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.section === activeSection);
  });
}

// The header's small section label is redundant once a screen has its own
// editorial hero (Rankings does) -- hidden there, kept as a quiet wayfinding
// cue on screens that don't have one yet (Play/Players, still legacy views).
function syncHeaderSectionTitle(){
  const titleEl = document.getElementById('shellSectionTitle');
  if(!titleEl) return;
  titleEl.style.display = (activeTab === 'power') ? 'none' : '';
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
    `<button class="section-subnav-item ${it.tab===activeTab?'active':''}" data-tab="${it.tab}">${it.icon||''}<span>${it.label}</span></button>`
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

// ---- Ranking eligibility (All-Time only) ---------------------------------
// The group's own existing standard -- play at least 2 games to stay "in
// the group" -- wasn't actually enforced anywhere before; some genuinely
// inactive players just never got their manual active flag updated. This
// makes it automatic: computed fresh from real match dates every time,
// nobody has to remember to flag anyone, and returning is as simple as
// playing again. Applies only to the All-Time Power Rankings list -- a
// monthly leaderboard already has its own natural eligibility test
// (you have to have played in that month to appear in it at all).
const RANKING_ELIGIBILITY_DAYS = 30;
const RANKING_ELIGIBILITY_MIN_MATCHES = 2;
function isRankingEligible(name){
  const cutoff = Date.now() - RANKING_ELIGIBILITY_DAYS*86400000;
  const count = MATCHES.filter(m =>
    (m.winners.includes(name) || m.losers.includes(name)) && new Date(m.date).getTime() >= cutoff
  ).length;
  return count >= RANKING_ELIGIBILITY_MIN_MATCHES;
}

// Splits the already-rendered, already-sorted list into an eligible (numbered)
// group and an ineligible (unranked, shown below a divider) group. Order
// within each group is left exactly as render() produced it -- only ranking
// numbers and grouping change, never the underlying sort.
function applyRankingEligibility(){
  const oldDivider = document.getElementById('eligibilityDivider');
  if(oldDivider) oldDivider.remove();

  if(activeTab !== 'power' || selectedMonth !== 'all') return; // month views have their own natural test

  const list = document.getElementById('list');
  if(!list) return;
  const rows = [...list.children].filter(el => el.classList.contains('row'));
  if(rows.length === 0) return;

  const eligible = [], ineligible = [];
  rows.forEach(row=>{
    const name = row.querySelector('.nm')?.textContent;
    if(name && !isRankingEligible(name)){ ineligible.push(row); }
    else { eligible.push(row); }
  });
  if(ineligible.length === 0) return; // nobody to set aside -- leave the list exactly as rendered

  rows.forEach(r=>r.remove());
  eligible.forEach((row, i)=>{
    const rankEl = row.querySelector('.rank');
    if(rankEl) rankEl.textContent = i+1;
    list.appendChild(row);
  });

  const divider = document.createElement('div');
  divider.id = 'eligibilityDivider';
  divider.className = 'eligibility-divider';
  divider.textContent = `Not currently ranked — no ${RANKING_ELIGIBILITY_MIN_MATCHES}+ matches in the last ${RANKING_ELIGIBILITY_DAYS} days`;
  list.appendChild(divider);

  ineligible.forEach(row=>{
    const rankEl = row.querySelector('.rank');
    if(rankEl) rankEl.textContent = '–';
    row.classList.add('ineligible-row');
    // Placed in .meta, not .nm -- .nm truncates long names with an ellipsis,
    // which could hide an appended tag entirely for anyone with a longer name.
    const metaEl = row.querySelector('.meta');
    if(metaEl && !metaEl.querySelector('.inactive-tag')){
      metaEl.insertAdjacentHTML('afterbegin', '<span class="inactive-tag">Inactive</span> · ');
    }
    list.appendChild(row);
  });
}

// ---- Rankings podium -----------------------------------------------------
// Podium now applies to any tier and any month (per the product change) --
// it always represents the top 3 of whatever leaderboard is currently on
// screen. Hidden only for: a non-Rating ranking mode, an active player
// search, or a non-default min-games threshold. Replicates render()'s own
// filter sequence exactly (tier -> month merge -> min-games) and the fixed
// rating sort, so the podium can never disagree with the list beneath it.
function computeRankingsPodiumTop3(){
  if(activeTab !== 'power') return null;
  if(activeSortP !== 'rating') return null;
  if(query !== '') return null;
  // The default qualifying threshold differs by scope on purpose (10 for all-time, 5 for a
  // single month, since monthly game counts are naturally lower) -- the podium should respect
  // whichever default applies to the scope currently selected, not a single hardcoded number.
  const defaultMinGames = selectedMonth === 'all' ? 10 : 5;
  if(minGames !== defaultMinGames) return null;

  let rows = PLAYERS.filter(p => activeTier==='All' || p.tier===activeTier);
  const inMonthView = selectedMonth !== 'all';
  if(inMonthView){
    const monthly = computeMonthlyStats(selectedMonth);
    const monthlyRatings = computeMonthlyRating(selectedMonth);
    rows = rows.map(p => ({...p, ...(monthly[p.name] || ZERO_MONTH_STATS),
      month_rating: (p.name in monthlyRatings) ? Math.round(monthlyRatings[p.name]*10)/10 : null}));
  }
  rows = rows.filter(p => p.total >= minGames);
  if(inMonthView) rows = rows.filter(p => p.month_rating !== null && p.month_rating !== undefined);
  // All-time podium can only feature currently-eligible players -- same rule, same test, as the
  // list beneath it, so the two can never show a different "top 3". Monthly scope is untouched.
  if(!inMonthView) rows = rows.filter(p => isRankingEligible(p.name));

  const sorted = rows.slice().sort((a,b)=>{
    const av = inMonthView ? a.month_rating : a.rating;
    const bv = inMonthView ? b.month_rating : b.rating;
    return bv - av;
  });
  if(sorted.length < 3) return null;
  return sorted.slice(0,3).map(p=>({ name: p.name, rating: inMonthView ? p.month_rating : p.rating }));
}

function renderRankingsPodium(){
  const existing = document.getElementById('rankingsPodium');
  if(existing) existing.remove();

  const top3 = computeRankingsPodiumTop3();
  if(!top3) return;

  const list = document.getElementById('list');
  if(!list) return;

  const scopeLabel = `${activeTier === 'All' ? 'All Tiers' : 'Tier ' + activeTier} · ${selectedMonth === 'all' ? 'All Time' : monthLabel(selectedMonth)}`;

  const order = [top3[1], top3[0], top3[2]]; // visual order: 2nd, 1st, 3rd
  const slotClass = ['second','first','third'];
  const pedestalAsset = { second: 'silver', first: 'gold', third: 'bronze' };
  const podium = document.createElement('div');
  podium.className = 'rankings-podium';
  podium.id = 'rankingsPodium';
  podium.innerHTML = `
    <div class="podium-row">
      ${order.map((p,i)=> `
        <div class="podium-slot ${slotClass[i]}" data-player="${p.name}">
          ${slotClass[i]==='first' ? `
            <div class="crown-laurel-wrap">
              <img class="crown-laurel-img" src="assets/rankings/podium-crown-laurel.png" alt="" onerror="this.style.display='none'">
              <div class="rank-num gold">1</div>
            </div>
          ` : `<div class="rank-num">${slotClass[i]==='second'?'2':'3'}</div>`}
          <div class="p-name">${p.name}</div>
          <div class="p-rating">${Math.round(p.rating)}</div>
          <img class="p-pedestal" src="assets/rankings/podium-${pedestalAsset[slotClass[i]]}.png" alt="" onerror="this.style.background='var(--surface-2)'; this.style.border='1px solid var(--surface-border)';">
        </div>
      `).join('')}
    </div>
    <div class="podium-caption">Money Padel · ${scopeLabel}</div>
  `;
  // Insert before the column header (if built) rather than before #list directly,
  // so the order is always: podium, then "# Player Rating Δ", then the rows.
  const colHeader = document.getElementById('rankingsColumnHeader');
  (colHeader || list).parentNode.insertBefore(podium, colHeader || list);
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
    <div class="mp-section-label">Money Padel · Results Only</div>
    <div class="mp-display-title" style="font-size:28px; margin-top:4px;">Power Rankings</div>
    <div style="font-family:var(--font-interface); font-size:12px; color:var(--text-dim); margin-top:4px; line-height:1.4; max-width:32ch;">A tier-anchored rating. Scoreline counts, not just who won.</div>
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
    // Label-only change: the compact select reads "All tiers", independent
    // of the legacy button's own "All players" text -- app.js untouched.
    opt.textContent = btn.dataset.tier === 'All' ? 'All tiers' : btn.textContent;
    tierSelect.appendChild(opt);
  });
  tierSelect.value = activeTier;
  tierSelect.onchange = ()=>{
    const btn = tierbar.querySelector(`.tierbtn[data-tier="${tierSelect.value}"]`);
    if(btn) btn.click();
  };

  // One clean row: Month | Tier | Filter icon, each an icon+bordered control
  // per the approved reference. Month's own "Month:" label wrapper is left
  // behind -- only the raw select moves into the toolbar.
  const toolbar = document.createElement('div');
  toolbar.id = 'rankingsToolbar';
  toolbar.className = 'rankings-toolbar';

  const monthWrap = document.createElement('div');
  monthWrap.className = 'toolbar-control';
  monthWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>';
  monthWrap.appendChild(monthSelectEl);

  const tierWrap = document.createElement('div');
  tierWrap.className = 'toolbar-control';
  tierWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 3.5 8 12 12.5 20.5 8Z"/><path d="M3.5 12.5 12 17 20.5 12.5"/><path d="M3.5 17 12 21.5 20.5 17"/></svg>';
  tierWrap.appendChild(tierSelect);

  toolbar.appendChild(monthWrap);
  toolbar.appendChild(tierWrap);
  const filtersBtn = document.createElement('button');
  filtersBtn.className = 'filter-btn';
  filtersBtn.id = 'openFiltersBtn';
  filtersBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="17" height="17"><line x1="4" y1="7" x2="20" y2="7"/><circle cx="9" cy="7" r="2" fill="var(--surface-1)"/><line x1="4" y1="14" x2="20" y2="14"/><circle cx="15" cy="14" r="2" fill="var(--surface-1)"/><line x1="4" y1="21" x2="20" y2="21"/><circle cx="11" cy="21" r="2" fill="var(--surface-1)"/></svg><span class="filter-dot"></span>`;
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

// Static column-header row for the ranking table ("# PLAYER  RATING  Δ"),
// per the approved reference. Visibility follows the same rule as the
// toolbar/segmented switcher -- Power Rankings only.
function buildRankingsColumnHeader(){
  const header = document.createElement('div');
  header.id = 'rankingsColumnHeader';
  header.className = 'rankings-col-header';
  header.innerHTML = `<span>#</span><span>Player</span><span class="col-right">Rating</span><span class="col-right">Δ</span>`;
  const list = document.getElementById('list');
  list.parentNode.insertBefore(header, list);
  function sync(){ header.style.display = (activeTab === 'power') ? 'grid' : 'none'; }
  document.getElementById('tabrow').addEventListener('click', ()=> setTimeout(sync, 0));
  sync();
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

// ==========================================================================
// VIEWER FOUNDATION -- lightweight player selection, no accounts/auth.
// Personalisation only. See privacy note on getCurrentViewer() below.
// ==========================================================================

// Player name is the identifier used throughout, since the existing data
// model has no separate player ID -- name is already the de facto stable
// key for tags, admin overrides, and every profile lookup in the app, so
// this stays consistent with that rather than inventing a new ID scheme.
const VIEWER_STORAGE_KEY = 'moneypadel_current_viewer';

// Returns the current viewer's full live player object (same shape as any
// entry in PLAYERS), or null if none is set / the saved name no longer
// exists in current player data (auto-clears a stale selection).
//
// PRIVACY/SECURITY BOUNDARY: this is presentation personalisation only.
// Selecting "Shaun" does not prove the user is Shaun -- nothing here is
// checked against, or should ever be checked against, for admin/password
// or any other sensitive gate. Existing admin auth stays fully separate.
function getCurrentViewer(){
  let savedName;
  try { savedName = localStorage.getItem(VIEWER_STORAGE_KEY); }
  catch(e){ return null; } // localStorage can be unavailable/restricted (e.g. private browsing) -- degrade gracefully
  if(!savedName) return null;
  const player = PLAYERS.find(p => p.name === savedName);
  if(!player){ try{ localStorage.removeItem(VIEWER_STORAGE_KEY); }catch(e){} return null; }
  return player;
}

function setCurrentViewer(playerName){
  try { localStorage.setItem(VIEWER_STORAGE_KEY, playerName); } catch(e){ /* selection just won't persist this session */ }
  document.dispatchEvent(new CustomEvent('viewerchanged', { detail: { name: playerName } }));
}

function clearCurrentViewer(){
  try { localStorage.removeItem(VIEWER_STORAGE_KEY); } catch(e){}
  document.dispatchEvent(new CustomEvent('viewerchanged', { detail: { name: null } }));
}

// ---- First-launch / switchable player selector ---------------------------
function buildViewerSelector(){
  const overlay = document.createElement('div');
  overlay.className = 'shell-more-sheet';
  overlay.id = 'viewerSelectorSheet';
  const panel = document.createElement('div');
  panel.className = 'shell-more-panel viewer-selector-panel';
  panel.innerHTML = `
    <div class="mp-section-label" style="text-align:center;">Welcome to Money Padel</div>
    <div class="mp-display-title viewer-selector-title">Who are you?</div>
    <div class="viewer-selector-sub">Choose your player to personalise your experience.</div>
    <input type="text" id="viewerSearchInput" class="viewer-search" placeholder="Search players…">
    <div id="viewerPlayerList" class="viewer-player-list"></div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function renderList(filter){
    const listEl = document.getElementById('viewerPlayerList');
    // Real player data only -- never a second hard-coded list.
    const names = PLAYERS.map(p=>p.name).sort((a,b)=>a.localeCompare(b));
    const filtered = filter ? names.filter(n=>n.toLowerCase().includes(filter.toLowerCase())) : names;
    listEl.innerHTML = filtered.map(n=>`<button class="viewer-player-btn" data-name="${n}">${n}</button>`).join('');
    listEl.querySelectorAll('.viewer-player-btn').forEach(btn=>{
      btn.onclick = ()=>{
        setCurrentViewer(btn.dataset.name);
        overlay.classList.remove('show');
        setTimeout(()=> overlay.remove(), 250);
        updateMyPlayerLabel();
      };
    });
  }
  renderList('');
  document.getElementById('viewerSearchInput').addEventListener('input', (e)=> renderList(e.target.value));
  overlay.classList.add('show');
}

// ---- "My Player" entry in More -------------------------------------------
function updateMyPlayerLabel(){
  const label = document.getElementById('myPlayerLabel');
  if(!label) return;
  const viewer = getCurrentViewer();
  label.textContent = viewer ? viewer.name : 'Choose player';
}

function buildMyPlayerMoreItem(){
  const sheet = document.getElementById('shellMoreSheet');
  if(!sheet) return;
  const panel = sheet.querySelector('.shell-more-panel');
  const adminItem = panel.querySelector('.admin-item');
  const item = document.createElement('button');
  item.className = 'shell-more-item';
  item.innerHTML = `My Player<span class="my-player-value"><span id="myPlayerLabel"></span> <span class="chev">›</span></span>`;
  item.onclick = ()=>{ closeMoreSheet(); buildViewerSelector(); };
  panel.insertBefore(item, adminItem);
  updateMyPlayerLabel();
}

// ---- Data-layer snapshot for the future personalised Home ----------------
// Pulls together existing, already-computed data for one player -- reuses
// PLAYERS, computeRecentForm, BEST_PARTNER, H2H, BOUNDARY_TESTS and
// gameRequestsState exactly as they already exist. No parallel ranking,
// form, partnership or matchmaking logic is created here.
function getViewerSnapshot(name){
  const p = PLAYERS.find(x=>x.name===name);
  if(!p) return null;

  // Overall / tier rank -- respects the same eligibility rule as the live
  // Rankings list, so a personalised "you're #4" always matches what the
  // official list would show, computed fresh rather than duplicated.
  const eligibleOverall = PLAYERS.filter(x=>x.total>=10 && isRankingEligible(x.name)).sort((a,b)=>b.rating-a.rating);
  const overallRank = eligibleOverall.findIndex(x=>x.name===name) + 1;
  const eligibleInTier = eligibleOverall.filter(x=>x.tier===p.tier);
  const tierRank = eligibleInTier.findIndex(x=>x.name===name) + 1;

  const form = computeRecentForm(name, 10);
  const bestPartner = BEST_PARTNER[name] || null;
  // H2H is a flat "sorted-pair -> meeting count" structure (see h2hCount()
  // in app.js), not a per-player breakdown -- this finds whichever opponent
  // this player has met most often. A richer win/loss-per-rival breakdown
  // would need a small new helper over MATCHES (the H2H tab computes that
  // inline, per-pair, rather than as a reusable function) -- flagged in the
  // report back rather than built speculatively here.
  let topRivalry = null, maxMeetings = 0;
  Object.entries(H2H).forEach(([key, count])=>{
    const [a,b] = key.split('|');
    if((a===name || b===name) && count > maxMeetings){
      maxMeetings = count;
      topRivalry = { opponent: a===name ? b : a, meetings: count };
    }
  });
  const boundaryMatchups = BOUNDARY_TESTS.filter(c => c.a===name || c.b===name);

  const involvedGames = gameRequestsState.filter(g => g.players && g.players.includes(name));
  const upcoming = involvedGames.filter(g => g.status === 'confirmed');
  const pending = involvedGames.filter(g => g.status === 'pending');

  const availableMonths = (typeof getAvailableMonths === 'function') ? getAvailableMonths() : [];
  const currentMonth = availableMonths.length ? availableMonths[availableMonths.length-1] : null;
  const monthStats = currentMonth ? (computeMonthlyStats(currentMonth)[name] || null) : null;
  const monthRating = currentMonth ? (computeMonthlyRating(currentMonth)[name] ?? null) : null;

  return {
    name: p.name, tier: p.tier, rating: p.rating,
    overallRank: overallRank > 0 ? overallRank : null,
    tierRank: tierRank > 0 ? tierRank : null,
    eligible: isRankingEligible(name),
    total: p.total, wins: p.wins, losses: p.losses, winpct: p.winpct,
    recentForm: form,
    bestPartner,
    topRivalry,
    boundaryMatchups,
    upcomingGames: upcoming,
    pendingRequests: pending,
    currentMonth, monthStats, monthRating,
  };
}

// ==========================================================================
// PERSONALISED HOME -- replaces the plain monthly Summary as the Home
// landing. The legacy Summary/Stats Review is fully preserved and reachable
// via "View Full Review" -- nothing deleted, just no longer the default.
// Reuses existing calculations only (ranking, eligibility, recent form,
// partnerships, H2H, monthly stats, matchmaking) -- no parallel logic.
// ==========================================================================

// "Points off promotion": no formal admin-decided promotion threshold exists
// in the app (tier seeds are starting points for new players, not boundaries
// -- ratings drift organically by design). This uses the lowest current
// rating among players already in the tier above as a live, defensible proxy
// for "roughly what it'd take" -- flagged here and in the report back, since
// it's an interpretation, not an existing formal rule.
function computePromotionGap(name){
  const p = PLAYERS.find(x=>x.name===name);
  if(!p) return null;
  const order = ['C','B','A','S'];
  const idx = order.indexOf(p.tier);
  if(idx === -1 || idx === order.length-1) return null; // top tier or unknown
  const tierAbove = order[idx+1];
  const aboveRatings = PLAYERS.filter(x=>x.tier===tierAbove).map(x=>x.rating);
  if(!aboveRatings.length) return null;
  const boundary = Math.min(...aboveRatings);
  const gap = Math.round(boundary - p.rating);
  return { tierAbove, gap };
}

function computeClubPulse(){
  const eligible = PLAYERS.filter(p=>p.total>=10 && isRankingEligible(p.name));
  const topRanked = eligible.slice().sort((a,b)=>b.rating-a.rating)[0] || null;

  let inForm = null;
  PLAYERS.forEach(p=>{
    if(p.recent_form!==null && p.recent_form!==undefined && !p.recent_form_stale && p.recent_form_games>=3){
      if(!inForm || p.recent_form > inForm.recent_form) inForm = p;
    }
  });

  let promotionWatch = null, smallestGap = Infinity;
  PLAYERS.forEach(p=>{
    const g = computePromotionGap(p.name);
    if(g && g.gap > 0 && g.gap < smallestGap){ smallestGap = g.gap; promotionWatch = { ...p, gap: g.gap, tierAbove: g.tierAbove }; }
  });

  return { topRanked, inForm, promotionWatch };
}

// Reuses the same nearest-average pairing approach as the existing Find a
// Game engine (generateCandidatePairs/generateCandidatePartners) and the
// same Elo expected-score formula already used elsewhere in the app for
// predicted outcomes -- just orchestrated for "best partner + best opposing
// pair for that team", which the existing functions don't directly return.
function computeMatchToMake(viewerName){
  const viewer = PLAYERS.find(p=>p.name===viewerName);
  if(!viewer) return null;
  const partnerCandidates = generateCandidatePartners(viewer, 'any', 1);
  // Same priority the real Find a Game feature uses: proven chemistry first
  // (already sorted best-first), then the closest-rated fresh option.
  const bestPartnerCandidate = (partnerCandidates.history && partnerCandidates.history[0])
    || (partnerCandidates.fresh && partnerCandidates.fresh[0]);
  if(!bestPartnerCandidate) return null;
  const partner = PLAYERS.find(p=>p.name===bestPartnerCandidate.name);
  if(!partner) return null;
  const teamAvg = (viewer.rating + partner.rating) / 2;

  const pool = PLAYERS.filter(p => p.name!==viewer.name && p.name!==partner.name && !INACTIVE_PLAYERS.has(p.name));
  let best = null, bestGap = Infinity;
  for(let i=0;i<pool.length;i++) for(let j=i+1;j<pool.length;j++){
    const a = pool[i], b = pool[j];
    const avg = (a.rating + b.rating) / 2;
    const gap = Math.abs(avg - teamAvg);
    if(gap < bestGap){ bestGap = gap; best = [a,b]; }
  }
  if(!best) return null;

  const oppAvg = (best[0].rating + best[1].rating) / 2;
  const expected = 1 / (1 + Math.pow(10, (oppAvg - teamAvg) / 400)); // same Elo formula used elsewhere in the app
  const pct = Math.round(expected * 100);
  const desc = Math.abs(pct-50) <= 3 ? 'Almost perfectly balanced.' : (pct>50 ? 'Slight edge to your side.' : 'Slight edge to the opponents.');

  return { partner, opponents: best, pctFor: pct, pctAgainst: 100-pct, description: desc };
}

function initials(name){
  return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

function buildHomeDashboard(){
  const dash = document.createElement('div');
  dash.id = 'homeDashboard';
  dash.style.display = 'none';
  const legacySummary = document.getElementById('summaryView');
  legacySummary.parentNode.insertBefore(dash, legacySummary);
  return dash;
}

function renderHomeDashboard(){
  const dash = document.getElementById('homeDashboard');
  if(!dash) return;
  const viewer = getCurrentViewer();
  if(!viewer){
    dash.innerHTML = `<div class="section-sub" style="padding:24px 16px; text-align:center;">Select a player to personalise Home.</div>`;
    return;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');
  const dateLabel = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();

  const snap = getViewerSnapshot(viewer.name);
  const pulse = computeClubPulse();
  const matchup = computeMatchToMake(viewer.name);
  const currentMonth = snap.currentMonth;
  const monthStatsAll = currentMonth ? computeMonthlySummaryStats(currentMonth) : {};
  const monthStatsArr = Object.values(monthStatsAll);
  const gamesThisMonth = currentMonth ? MATCHES.filter(m=>m.date.slice(0,7)===currentMonth).length : 0;
  const mostActive = monthStatsArr.length ? topNTied(monthStatsArr, 'games', 1, true)[0] : null;
  const eligibleMonth = monthStatsArr.filter(s=>s.games>=3);
  const highestWinPct = eligibleMonth.length ? topNTied(eligibleMonth, 'winpct', 1, true)[0] : null;
  const mostWins = monthStatsArr.filter(s=>s.games>0).length ? topNTied(monthStatsArr.filter(s=>s.games>0), 'points', 1, true)[0] : null;

  const promoGap = computePromotionGap(viewer.name);
  let insight;
  if(promoGap && promoGap.gap > 0){
    insight = `You're just ${promoGap.gap} points off Tier ${promoGap.tierAbove}. Keep pushing.`;
  } else if(snap.recentForm && !viewer.recent_form_stale && snap.recentForm.avgPct > 3){
    insight = `You're trending up — ${snap.recentForm.wins}W-${snap.recentForm.losses}L in your last ${snap.recentForm.games}.`;
  } else if(snap.bestPartner){
    insight = `You and ${snap.bestPartner.partner} have won ${snap.bestPartner.winpct}% together — a partnership worth repeating.`;
  } else {
    insight = `${snap.total} games played this season. Keep building your record.`;
  }

  const upcoming = snap.upcomingGames[0] || null;

  dash.innerHTML = `
    <div class="home-hero">
      <div class="mp-section-label">${dateLabel}</div>
      <div class="mp-display-title home-greeting">${greeting},<br><span class="home-greeting-name">${viewer.name}.</span></div>
      <div class="home-hero-sub">READY FOR THE NEXT GAME?</div>
      <div class="home-hero-tagline">SAME GAME. HIGHER STANDARDS.</div>
    </div>

    <div class="mp-card-standard home-card">
      <div class="home-card-header"><span>Your Game</span><button class="home-card-link" id="homeViewProfileBtn">View Profile ›</button></div>
      <div class="home-yourgame-row">
        <div class="home-tier-block">
          <span class="tier-badge tier-${viewer.tier.toLowerCase()}" style="width:34px;height:34px;font-size:15px;">${viewer.tier}</span>
          <div class="home-tier-sub">#${snap.tierRank||'–'} in Tier ${viewer.tier}<br>#${snap.overallRank||'–'} Overall</div>
        </div>
        <div class="home-rating-block">
          <div class="section-sub" style="font-size:10px;">Rating</div>
          <div class="home-rating-num">${Math.round(viewer.rating)}</div>
        </div>
        <div class="home-form-block">
          <div class="section-sub" style="font-size:10px;">Recent Form</div>
          <div class="home-form-dots">${snap.recentForm ? Array.from({length:snap.recentForm.games}).map((_,i)=>{
            const isWin = i < snap.recentForm.wins; return `<span class="form-dot ${isWin?'w':'l'}">${isWin?'W':'L'}</span>`;
          }).join('') : '—'}</div>
          <div class="section-sub" style="font-size:10.5px; margin-top:2px;">${snap.wins}W – ${snap.losses}L · ${snap.winpct}% win rate</div>
        </div>
      </div>
      <div class="home-insight">${insight}</div>
    </div>

    <div class="home-card-header" style="padding:0 4px;"><span>Club Pulse</span><button class="home-card-link" id="homeAllInsightsBtn">All Insights ›</button></div>
    <div class="home-pulse-row">
      <div class="mp-card-standard home-pulse-card">
        <div class="home-pulse-title">#1 Ranked</div>
        ${pulse.topRanked ? `<div class="home-pulse-name">${pulse.topRanked.name}</div><div class="home-pulse-sub">${Math.round(pulse.topRanked.rating)}</div>` : `<div class="section-sub">Not enough data.</div>`}
      </div>
      <div class="mp-card-standard home-pulse-card">
        <div class="home-pulse-title">In Form</div>
        ${pulse.inForm ? `<div class="home-pulse-name">${pulse.inForm.name}</div><div class="home-pulse-sub perf-pos">+${pulse.inForm.recent_form}%</div>` : `<div class="section-sub">Not enough data.</div>`}
      </div>
      <div class="mp-card-standard home-pulse-card">
        <div class="home-pulse-title">Promotion Watch</div>
        ${pulse.promotionWatch ? `<div class="home-pulse-name">${pulse.promotionWatch.name}</div><div class="home-pulse-sub">Tier ${pulse.promotionWatch.tier} · ${pulse.promotionWatch.gap} pts</div>` : `<div class="section-sub">Not enough data.</div>`}
      </div>
    </div>

    <div class="home-card-header" style="padding:0 4px;"><span>Match to Make</span><button class="home-card-link" id="homeFindMoreBtn">Find More Matches ›</button></div>
    ${matchup ? `
      <div class="mp-card-standard home-card">
        <div class="section-sub">A well-balanced matchup</div>
        <div class="home-matchup-pct">${matchup.pctFor}% – ${matchup.pctAgainst}% <span class="section-sub" style="font-size:11px;">· ${matchup.description}</span></div>
        <div class="home-matchup-row">
          <div class="home-avatar-pair"><div class="home-avatar">${initials(viewer.name)}</div><div class="home-avatar">${initials(matchup.partner.name)}</div>
            <div class="home-avatar-names">${viewer.name} + ${matchup.partner.name}</div></div>
          <div class="section-sub">vs</div>
          <div class="home-avatar-pair"><div class="home-avatar">${initials(matchup.opponents[0].name)}</div><div class="home-avatar">${initials(matchup.opponents[1].name)}</div>
            <div class="home-avatar-names">${matchup.opponents[0].name} + ${matchup.opponents[1].name}</div></div>
        </div>
        <button class="filter-btn home-view-matchup-btn" id="homeViewMatchupBtn" style="width:auto; padding:0 16px; height:38px; margin-top:10px;">View Matchup ›</button>
      </div>
    ` : `<div class="mp-card-standard home-card"><div class="section-sub">Not enough eligible players to suggest a matchup right now.</div></div>`}

    <div class="home-card-header" style="padding:0 4px;"><span>Next on Court</span></div>
    <div class="mp-card-standard home-card home-nextcourt">
      ${upcoming ? `
        <div class="home-nextcourt-info"><b>${upcoming.players.join(' & ')}</b><div class="section-sub">Confirmed game</div></div>
      ` : `
        <div class="home-nextcourt-info"><b>Nothing booked yet.</b><div class="section-sub">Find your next game and get on court.</div></div>
        <button class="filter-btn" id="homeFindGameBtn" style="width:auto; padding:0 16px; height:38px;">Find a Game ›</button>
      `}
    </div>

    <div class="home-card-header" style="padding:0 4px;"><span>${currentMonth ? monthLabel(currentMonth).toUpperCase() : 'THIS MONTH'} AT MONEY PADEL</span><button class="home-card-link" id="homeFullReviewBtn">View Full Review ›</button></div>
    <div class="mp-card-standard home-card home-monthly-grid">
      <div class="home-monthly-stat"><div class="home-monthly-num">${gamesThisMonth}</div><div class="section-sub">Games played</div></div>
      <div class="home-monthly-stat"><div class="home-monthly-num" style="font-size:16px;">${mostActive ? mostActive.names[0] : '–'}</div><div class="section-sub">Most active${mostActive ? ` · ${mostActive.value} games` : ''}</div></div>
      <div class="home-monthly-stat"><div class="home-monthly-num" style="font-size:16px;">${highestWinPct ? highestWinPct.names[0] : '–'}</div><div class="section-sub">Highest win rate${highestWinPct ? ` · ${highestWinPct.value}%` : ''}</div></div>
      <div class="home-monthly-stat"><div class="home-monthly-num" style="font-size:16px;">${mostWins ? mostWins.names[0] : '–'}</div><div class="section-sub">Player of the Month</div></div>
    </div>
  `;

  document.getElementById('homeViewProfileBtn').onclick = ()=> openSheet(viewer.name);
  document.getElementById('homeAllInsightsBtn').onclick = ()=>{ legacyTabBtn('callouts').click(); };
  document.getElementById('homeFindMoreBtn').onclick = ()=>{ goToSection('play'); };
  document.getElementById('homeFullReviewBtn').onclick = ()=> showFullMonthlyReview();
  const findGameBtn = document.getElementById('homeFindGameBtn');
  if(findGameBtn) findGameBtn.onclick = ()=> goToSection('play');
  const viewMatchupBtn = document.getElementById('homeViewMatchupBtn');
  if(viewMatchupBtn) viewMatchupBtn.onclick = ()=> goToSection('play');
}

// "View Full Review" -- shows the fully preserved legacy Summary view in
// place of the dashboard, without leaving Home / changing activeTab.
function showFullMonthlyReview(){
  document.getElementById('homeDashboard').style.display = 'none';
  document.getElementById('summaryView').style.display = 'block';
  let backBtn = document.getElementById('homeBackFromReview');
  if(!backBtn){
    backBtn = document.createElement('button');
    backBtn.id = 'homeBackFromReview';
    backBtn.className = 'explainer-toggle';
    backBtn.textContent = '‹ Back to Home';
    backBtn.style.cssText = 'padding:12px 16px; font-weight:600;';
    backBtn.onclick = ()=>{
      document.getElementById('summaryView').style.display = 'none';
      backBtn.style.display = 'none';
      document.getElementById('homeDashboard').style.display = 'block';
    };
    document.getElementById('summaryView').parentNode.insertBefore(backBtn, document.getElementById('summaryView'));
  }
  backBtn.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', ()=>{
  buildShellDom();
  const hero = buildRankingsHero();
  buildCompactFiltersBar();
  buildRankingsColumnHeader();
  buildCollapsibleExplainer();

  // Wrap the legacy render() so the podium (and ranking eligibility split)
  // are (re)computed on every Power Rating re-render, without touching
  // render() itself.
  let viewerInitDone = false;
  const _originalRender = window.render;
  window.render = function(){
    _originalRender.apply(this, arguments);
    applyRankingEligibility();
    renderRankingsPodium();
    hero.style.display = (activeTab === 'power') ? 'block' : 'none';
    syncHeaderSectionTitle();
    // Viewer foundation init happens here, on the first real render, rather
    // than directly in DOMContentLoaded: app.js's init() is async and loads
    // Firestore data before calling recomputeAll(), so PLAYERS is not
    // reliably populated yet at DOMContentLoaded time. The first render()
    // call only ever happens after that data is loaded and PLAYERS is set,
    // which is what buildViewerSelector's real player list depends on.
    if(!viewerInitDone){
      viewerInitDone = true;
      buildMyPlayerMoreItem();
      buildHomeDashboard();
      if(!getCurrentViewer()) buildViewerSelector();
      // If Home is already the active section by the time data is ready (or
      // becomes active later), keep the dashboard in sync with the viewer.
      document.addEventListener('viewerchanged', ()=>{
        updateMyPlayerLabel();
        if(activeSection === 'home') renderHomeDashboard();
      });
      if(activeSection === 'home') renderHomeDashboard();
    }
  };
  // The hero also needs to hide immediately when leaving Rankings via a tab
  // that doesn't call render() at all (Players, Games, etc.).
  document.getElementById('tabrow').addEventListener('click', ()=>{
    hero.style.display = (activeTab === 'power') ? 'block' : 'none';
    syncHeaderSectionTitle();
  });

  updateBottomNavHighlight();
  renderSectionSubnav();
});
