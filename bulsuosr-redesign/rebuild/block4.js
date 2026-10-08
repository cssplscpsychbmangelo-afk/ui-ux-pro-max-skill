/* Dashboard: the gold "Build Your Ideal BulSU" band and its live Pulse snapshot.
   The snapshot reuses the public aggregates endpoint — it never shows an
   individual build, only how the latest period is distributed. */
(function(){
  const CATEGORIES = [
    { key:'learning', label:'Learning' },
    { key:'campus', label:'Campus' },
    { key:'mobility', label:'Mobility' },
    { key:'connectivity', label:'Connectivity' },
    { key:'wellbeing', label:'Well-being' },
    { key:'cultureCommunity', label:'Culture' },
    { key:'studentVoice', label:'Student voice' }
  ];
  const buildsEl = document.getElementById('buildCtaBuilds');
  const periodEl = document.getElementById('buildCtaPeriod');
  const topEl = document.getElementById('buildCtaTop');
  const barsEl = document.getElementById('buildCtaBars');
  if(!buildsEl || !barsEl) return;

  function categoryKey(value){
    const name = String(value || '').trim().toLowerCase();
    const match = CATEGORIES.find(category => category.key.toLowerCase() === name || category.label.toLowerCase() === name);
    return match ? match.key : null;
  }
  function periodWords(period){
    const match = /^(\d{4})-(\d{2})$/.exec(String(period || ''));
    if(!match) return 'Latest period';
    const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    return date.toLocaleDateString('en-PH', { month:'long', year:'numeric' });
  }
  function render(rows){
    if(!Array.isArray(rows) || !rows.length){
      buildsEl.textContent = '0';
      periodEl.textContent = 'No builds yet';
      topEl.textContent = 'Be the first to build an Ideal BulSU — your 10 points start the record.';
      barsEl.innerHTML = '';
      return;
    }
    const periods = {};
    rows.forEach(row => {
      const period = String(row.period || '');
      const key = categoryKey(row.category);
      if(!/^\d{4}-\d{2}$/.test(period) || !key) return;
      const responses = Math.max(0, Math.floor(Number(row.response_count) || 0));
      if(!responses) return;
      const entry = periods[period] || (periods[period] = { period, responses: 0, points: {} });
      entry.responses = Math.max(entry.responses, responses);
      entry.points[key] = Math.max(0, Math.floor(Number(row.total_points) || 0));
    });
    const latest = Object.values(periods).sort((a, b) => b.period.localeCompare(a.period))[0];
    if(!latest){
      buildsEl.textContent = '0';
      periodEl.textContent = 'No builds yet';
      topEl.textContent = 'Be the first to build an Ideal BulSU — your 10 points start the record.';
      barsEl.innerHTML = '';
      return;
    }
    const totalPoints = Object.values(latest.points).reduce((sum, value) => sum + value, 0);
    const ranked = CATEGORIES
      .map(category => ({ ...category, points: latest.points[category.key] || 0 }))
      .filter(category => category.points > 0)
      .sort((a, b) => b.points - a.points);
    buildsEl.textContent = String(latest.responses);
    periodEl.textContent = periodWords(latest.period);
    topEl.textContent = ranked.length
      ? `Students put the most weight on ${ranked[0].label} this period.`
      : 'Waiting for the first points this period.';
    const max = Math.max(1, ...ranked.map(category => category.points));
    barsEl.innerHTML = ranked.slice(0, 4).map(category => {
      const share = totalPoints ? Math.round((category.points / totalPoints) * 100) : 0;
      return `<div class="ideal-cta__bar">
        <span class="ideal-cta__bar-label">${category.label}</span>
        <span class="ideal-cta__bar-track"><span class="ideal-cta__bar-fill" style="width:${Math.max(6, Math.round((category.points / max) * 100))}%"></span></span>
        <span class="ideal-cta__bar-val">${share}%</span>
      </div>`;
    }).join('');
  }

  window.addEventListener('cms:pulse-updated', event => render(event.detail ? event.detail.rows : null));
  if(Array.isArray(window.__CMS_PULSE)) render(window.__CMS_PULSE);
  // The integration script publishes aggregates once it has them; if this band
  // is still empty (static host or slow start) ask the endpoint directly once.
  const ask = () => fetch('/api/public/pulse-aggregates', { headers:{ Accept:'application/json' }, cache:'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if(Array.isArray(data)) render(data); })
    .catch(() => {});
  if(!Array.isArray(window.__CMS_PULSE)) ask();
  window.addEventListener('DOMContentLoaded', () => { if(!Array.isArray(window.__CMS_PULSE)) ask(); }, { once:true });

  // "See what students prioritize" opens the Pulse tab, not just the page.
  document.querySelectorAll('[data-ideal-pulse]').forEach(link => link.addEventListener('click', () => {
    setTimeout(() => {
      const tab = document.querySelector('.pulse-tab[data-tab="pulse"]');
      if(tab && !tab.classList.contains('is-active')) tab.click();
    }, 260);
  }));
})();