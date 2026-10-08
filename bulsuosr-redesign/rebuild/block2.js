(function(){
  const $ = s=>document.querySelector(s);
  const safeGet = window.safeGet ? window.safeGet : (k,f)=>{ try{ const v=localStorage.getItem(k); return v===null?f:v;}catch{return f;} };
  const safeSet = window.safeSet ? window.safeSet : (k,v)=>{ try{localStorage.setItem(k,v);}catch{} };
  const toast = window.toast ? window.toast : (m)=>{ console.log(m); };

  const WELCOME_KEY = 'osr-welcome:v2';
  const TOUR_KEY = 'osr-tour:seen';

  // --- Welcome ---
  const welcomeEl = document.getElementById('welcomeOverlay');
  const dontShowCb = document.getElementById('welcomeDontShow');
  const welcomeStartBtn = document.getElementById('welcomeStartTour');
  const welcomeEnterBtn = document.getElementById('welcomeEnter');
  const welcomeCloseBtn = document.getElementById('welcomeClose');

  function isWelcomeDismissed(){
    try{
      if(new URLSearchParams(location.search).has('nowelcome')) return true;
      if(safeGet(WELCOME_KEY, null) === '1') return true;
      if(safeGet('osr-welcome-dismissed', null) === '1') return true; // legacy
    }catch{}
    return false;
  }
  function openWelcome(){
    if(!welcomeEl) return;
    welcomeEl.hidden = false;
    welcomeEl.removeAttribute('hidden');
    // force reflow then add open
    requestAnimationFrame(()=> welcomeEl.classList.add('is-open'));
    welcomeEl.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    // focus first button
    setTimeout(()=> welcomeStartBtn?.focus(), 80);
  }
  function closeWelcome(persist){
    if(!welcomeEl) return;
    const shouldPersist = persist ?? dontShowCb?.checked;
    if(shouldPersist) { safeSet(WELCOME_KEY,'1'); safeSet('osr-welcome-dismissed','1'); }
    welcomeEl.classList.remove('is-open');
    welcomeEl.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    setTimeout(()=> { welcomeEl.hidden = true; }, 220);
  }
  // Also close welcome on Escape handled, and ensure backdrop click doesn't propagate


  // allow ?tour=1 or #tour to force preview
  const forceTour = new URLSearchParams(location.search).has('tour') || location.hash==='#tour';
  if(forceTour){ setTimeout(()=> { if(window.startGuide) window.startGuide(); }, 400); }
  // Auto show on first enter (data-saver: no network)
  if(!isWelcomeDismissed() && !forceTour){
    setTimeout(()=> {
      // don't show if tour is active (unlikely) or if user already in hash navigation via direct link maybe still show welcome once
      if(document.getElementById('guideTooltip') && !document.getElementById('guideTooltip').hidden) return;
      openWelcome();
    }, 560);
  }

  // Welcome events — more interactive but simple
  welcomeStartBtn?.addEventListener('click', ()=>{
    closeWelcome(false);
    safeSet(WELCOME_KEY,'1');
    setTimeout(()=> { if(window.startGuide) window.startGuide(); }, 260);
  });
  welcomeEnterBtn?.addEventListener('click', ()=> closeWelcome());
  welcomeCloseBtn?.addEventListener('click', ()=> closeWelcome());
  welcomeEl?.querySelector('[data-close-welcome]')?.addEventListener('click', ()=> closeWelcome());
  // Interactive feature pills — click to jump, still simple
  document.querySelectorAll('.welcome-features li[data-jump]').forEach(li=>{
    const go = ()=> {
      const hash = li.dataset.jump;
      closeWelcome(false);
      safeSet(WELCOME_KEY,'1');
      setTimeout(()=> {
        location.hash = hash;
        // flash highlight on target
        const target = document.querySelector(hash);
        if(target){ target.classList.add('is-tour-target'); setTimeout(()=> target.classList.remove('is-tour-target'), 1400); }
        toast('Jumped to ' + hash.replace('#',''));
      }, 280);
    };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); go(); }});
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && welcomeEl?.classList.contains('is-open')) closeWelcome();
  });
  // allow Enter on checkbox area

  // --- Subtle Guide ---
  const replayBtn = document.getElementById('replayTourBtn');
  if(replayBtn){
    replayBtn.setAttribute('aria-label','Show site guide');
    replayBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg> Guide';
    replayBtn.addEventListener('click', ()=> { startGuide(); });
  }
  // If replayBtn missing, create a small floating guide button
  const guideShowBtn = document.createElement('button');
  guideShowBtn.id = 'guideShowBtn';
  guideShowBtn.className = 'guide-show-btn';
  guideShowBtn.type = 'button';
  guideShowBtn.setAttribute('aria-label', 'Open the site guide');
  guideShowBtn.setAttribute('title', 'Open the site guide');
  guideShowBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.9 1.7c-1.1 1-1.7 1.3-1.7 2.8"/><path d="M12 17h.01"/></svg>';
  guideShowBtn.hidden = true;
  document.body.appendChild(guideShowBtn);
  guideShowBtn.addEventListener('click', ()=> startGuide());

  const perPageGuides = {
    "home": [
      {sel: 'a[href="#announcements"].btn--red', label: 'View announcements', desc: 'Tap to see verified posts — 6 types.'},
      {sel: '.quick a[href="#board-meetings"]', label: 'Board Meetings', desc: 'BOR archive — numbers, minutes, docs.'},
      {sel: '.quick a[href="#initiatives"]', label: 'Initiatives', desc: 'Projects — ongoing & completed.'},
      {sel: '.quick a[href="#resources"]', label: 'Resources', desc: 'Handbook, policies, support docs.'},
      {sel: '.quick a[href="#help"]', label: 'Student Help', desc: 'Raise a concern or contact.'},
      {sel: '.quick a[href="#ideal-bulsu"]', label: 'Build Your Ideal BulSU', desc: 'Split 10 points — it joins the public Pulse.'},
      {sel: '.dash-stats a[href="#announcements"]', label: 'Announcements count', desc: 'Live total — tap to open archive.'},
      {sel: '#dashCalendar', label: 'Upcoming calendar', desc: 'Next events — tap Calendar for full AY 2026-2027.'}
    ],
    "announcements": [
      {sel: '#annSearch', label: 'Search', desc: 'Type to filter — updates instantly.'},
      {sel: '#annCategory', label: 'Category', desc: 'Filter among 6 report types.'},
      {sel: '#annList .feed-card:first-child', label: 'Open post', desc: 'Tap Read to see full verified content.'}
    ],
    "board-meetings": [
      {sel: '#boardSearch', label: 'Search meetings', desc: 'Find by title or meeting number.'},
      {sel: '#boardYear', label: 'Filter by year', desc: 'Narrow to a specific academic year.'},
      {sel: '#boardList .feed-card:first-child, #boardList .board-row:first-child', label: 'Open record', desc: 'View minutes and related documents.'}
    ],
    "initiatives": [
      {sel: '#initSearch', label: 'Search initiatives', desc: 'Filter by title or status.'},
      {sel: '#initList .feed-card:first-child', label: 'Project card', desc: 'Tap to see purpose, status, docs.'},
      {sel: '#initList .feed-card:first-child a', label: 'Project document', desc: 'Open the linked brief or minutes.'}
    ],
    "resources": [
      {sel: '#resSearch', label: 'Search resources', desc: 'Find handbook, policies, support docs.'},
      {sel: '.resource:first-child', label: 'Open resource', desc: 'Tap to view details or save.'},
      {sel: '#resCategory', label: 'Filter resources', desc: 'Narrow by Student Rights, Support, etc.'}
    ],
    "academic-calendar": [
      {sel: '#calSearch', label: 'Search calendar', desc: 'Search enrollment, exams, holidays.'},
      {sel: '#calCategory', label: 'Filter by category', desc: 'Pick Holiday, Enrollment, etc.'},
      {sel: '#calList .cal-event:first-child', label: 'Calendar event', desc: 'Tap to see details and add to calendar.'}
    ],
    "ideal-bulsu": [
      {sel: '#pulsePointsLeft', label: '10 points left', desc: 'Counts down as you allocate.'},
      {sel: '[data-plus="learning"]', label: 'Add a point — try +', desc: 'Tap + on Learning — watch bars grow.'},
      {sel: '[data-tab="pulse"]', label: 'See BulSU Pulse', desc: 'Switch to Pulse tab — trends & PDF.'}
    ],
    "help": [
      {sel: '#concernAnon', label: 'Go anonymous', desc: 'Check to hide name — optional.'},
      {sel: '#concernForm textarea[name="concern"]', label: 'Describe concern', desc: 'Who/what/where/when — factual.'},
      {sel: '#helpFeedbackForm select:first-of-type', label: 'Send feedback', desc: 'Pick a service, rate 1–5.'}
    ],
    "about": [
      {sel: '#page-about .about-card:first-child', label: 'OSR mandate', desc: 'The mandate — who the Regent represents and what the Office does.'}
    ]
  };
  // keep backward compat alias
  const perPageGuide = Object.fromEntries(Object.entries(perPageGuides).map(([k,v])=> [k, v[0]]));
  const guideSteps = Object.entries(perPageGuide).map(([page,v])=> ({page:'#'+page, sel:v.sel, label:v.label, desc:v.desc}));
  let guideIdx = 0;
  let currentGuidePage = null;
  let currentPageSteps = [];
  let guideActive = false;
  const GUIDE_KEY = 'osr-guide:dismissed';
  const GUIDE_DONT_KEY = 'osr-guide:dontshow';
  let guidePrevEl = null;

  const guideTooltip = document.getElementById('guideTooltip');
  const guideTitle = document.getElementById('guideTitle');
  const guideDesc = document.getElementById('guideDesc');
  const guideStepNo = document.getElementById('guideStepNo');
  const guideProgress = document.getElementById('guideProgress');
  const guidePrev = document.getElementById('guidePrev');
  const guideNext = document.getElementById('guideNext');
  const guideDismiss = document.getElementById('guideDismiss');
  const guideDontShow = document.getElementById('guideDontShow');

  function isGuideDontShow(page){
    try{
      if(localStorage.getItem(GUIDE_DONT_KEY)==='1') return true;
      if(page && localStorage.getItem(GUIDE_DONT_KEY+':'+page)==='1') return true;
    }catch{ return false; }
    return false;
  }
  function shouldShowGuideFor(page){
    try{
      if(new URLSearchParams(location.search).has('noguide')) return false;
      if(isGuideDontShow(page)) return false;
      if(localStorage.getItem(GUIDE_KEY+':'+page)==='1') return false;
    }catch{}
    return true;
  }
  function shouldShowGuide(){ return shouldShowGuideFor(currentGuidePage||'home'); }
  function buildGuideProgress(){
    if(!guideProgress) return;
    const steps = perPageGuides[currentGuidePage||'home'] || [];
    if(steps.length<=1){
      guideProgress.textContent = (currentGuidePage||'home');
      return;
    }
    guideProgress.innerHTML = steps.map((_,i)=> `<i class="${i===guideIdx?'is-on':''}" aria-hidden="true"></i>`).join('');
    guideProgress.setAttribute('aria-hidden','true');
  }
  function clearGuideHighlight(){
    if(guidePrevEl){ guidePrevEl.classList.remove('guide-highlight','guide-highlight--pulse'); guidePrevEl = null; }
  }
  function positionGuideTooltip(target){
    if(!guideTooltip || !target) return;
    const r = target.getBoundingClientRect();
    const tt = guideTooltip;
    const vw = window.innerWidth, vh = window.innerHeight;
    tt.style.left = '-9999px'; tt.style.top = '0'; tt.hidden = false;
    tt.style.transform = 'none';
    const tr = tt.getBoundingClientRect();
    let top, left;
    const gap = 12;
    const headerH = document.getElementById('header')?.offsetHeight || 0;
    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top - headerH;
    const spaceRight = vw - r.right;
    const spaceLeft = r.left;
    if(spaceBelow >= tr.height + gap + 8){
      top = r.bottom + gap;
      left = r.left + (r.width - tr.width)/2;
    } else if(spaceAbove >= tr.height + gap + 8){
      top = r.top - tr.height - gap;
      left = r.left + (r.width - tr.width)/2;
    } else if(spaceRight >= tr.width + gap + 8){
      top = r.top + (r.height - tr.height)/2;
      left = r.right + gap;
    } else if(spaceLeft >= tr.width + gap + 8){
      top = r.top + (r.height - tr.height)/2;
      left = r.left - tr.width - gap;
    } else {
      top = Math.min(vh - tr.height - 12, r.bottom + gap);
      left = r.left + (r.width - tr.width)/2;
    }
    left = Math.max(10, Math.min(vw - tr.width - 10, left));
    top = Math.max(headerH + 8, Math.min(vh - tr.height - 10, top));
    if(top < r.bottom && top + tr.height > r.top && left < r.right && left + tr.width > r.left){
      if(spaceBelow > spaceAbove) top = Math.min(vh - tr.height - 10, r.bottom + gap);
      else top = Math.max(headerH + 8, r.top - tr.height - gap);
    }
    tt.style.left = left + 'px';
    tt.style.top = (top + window.scrollY) + 'px';
  }
  function showGuideForPage(pageKey){
    const steps = perPageGuides[pageKey];
    if(!steps || !steps.length) return;
    currentGuidePage = pageKey;
    currentPageSteps = steps;
    // if guide was already active on same page, keep idx, otherwise start at 0
    if(guideIdx >= steps.length) guideIdx = 0;
    // if called fresh (via setRoute), reset to 0
    if(!guideActive || currentGuidePage !== pageKey) guideIdx = 0;
    const cfg = steps[guideIdx];
    let el = null;
    try{ el = document.querySelector(cfg.sel); }catch{}
    if(!el || el.offsetParent===null){
      // try alternative selector for that page
      const alts = {
        "home": '.hero__actions a[href="#announcements"]',
        "announcements": '#annSearch',
        "board-meetings": '#boardSearch',
        "initiatives": '#initList .feed-card',
        "resources": '#resSearch',
        "academic-calendar": '#calSearch',
        "ideal-bulsu": '[data-plus="learning"]',
        "help": '#concernAnon',
        "about": '#page-about .about-card:first-child'
      };
      const alt = alts[pageKey];
      if(alt){ try{ const cand = document.querySelector(alt); if(cand && cand.offsetParent!==null) el = cand; }catch{} }
    }
    clearGuideHighlight();
    if(el){
      el.classList.add('guide-highlight');
      el.classList.add('guide-highlight--pulse');
      setTimeout(()=> el.classList.remove('guide-highlight--pulse'), 1600);
      guidePrevEl = el;
      try{ el.scrollIntoView({behavior:'smooth', block:'center'}); }catch{}
      setTimeout(()=> positionGuideTooltip(el), 120);
      // make it interactive: clicking the real highlighted element advances
      const advance = ()=> { if(guideActive && currentGuidePage===pageKey) nextGuide(); };
      el.addEventListener('click', advance, {once:true});
      if(el.matches('input, textarea, select')){
        el.addEventListener('input', advance, {once:true});
        el.addEventListener('change', advance, {once:true});
      }
    }
    if(guideTitle) guideTitle.textContent = cfg.label;
    if(guideDesc) guideDesc.textContent = cfg.desc;
    if(guideStepNo) guideStepNo.textContent = (guideIdx+1)+' / '+steps.length+' • '+pageKey;
    buildGuideProgress();
    if(guidePrev) guidePrev.hidden = guideIdx===0;
    if(guideNext) guideNext.textContent = guideIdx===steps.length-1 ? 'Done' : 'Next';
    if(guideTooltip) guideTooltip.hidden = false;
    guideActive = true;
    if(guideShowBtn) guideShowBtn.hidden = true;
  }
  function showGuideStep(){
    // for manual Guide button: show current page's guide
    const hash = (location.hash||'#home').replace('#','').split('?')[0].split('/')[0] || 'home';
    const page = perPageGuide[hash] ? hash : 'home';
    showGuideForPage(page);
  }
  function doShowGuideStep(step){ showGuideForPage(step.page ? step.page.replace('#','') : 'home'); }
  function startGuide(){
    if(isGuideDontShow()){ toast('Guide is hidden — uncheck \'Don\'t show again\' to see it'); return; }
    showGuideStep();
    try{ localStorage.setItem(GUIDE_KEY,'0'); }catch{}
  }
  function nextGuide(){
    const steps = perPageGuides[currentGuidePage||'home'] || [];
    if(guideIdx < steps.length - 1){
      guideIdx++;
      showGuideForPage(currentGuidePage);
    } else {
      dismissGuide(true);
    }
  }
  function prevGuide(){
    const steps = perPageGuides[currentGuidePage||'home'] || [];
    if(guideIdx > 0){
      guideIdx--;
      showGuideForPage(currentGuidePage);
    } else {
      dismissGuide(false);
    }
  }
  function dismissGuide(completed){
    const page = currentGuidePage || 'home';
    clearGuideHighlight();
    if(guideTooltip) guideTooltip.hidden = true;
    guideActive = false;
    const dont = guideDontShow?.checked;
    if(dont){
      try{ localStorage.setItem(GUIDE_DONT_KEY+':'+page,'1'); localStorage.setItem(GUIDE_DONT_KEY,'1'); }catch{}
    }
    try{ localStorage.setItem(GUIDE_KEY+':'+page, completed ? '1' : '0'); }catch{}
    if(guideShowBtn) guideShowBtn.hidden = false;
    if(completed) toast('Tip dismissed for '+page+' — open Guide anytime');
    else toast('Guide dismissed — open Guide from the header anytime');
  }
  guideNext?.addEventListener('click', nextGuide);
  guidePrev?.addEventListener('click', prevGuide);
  guideDismiss?.addEventListener('click', ()=> dismissGuide(false));
  guideDontShow?.addEventListener('change', ()=>{
    if(guideDontShow.checked){
      const pg = currentGuidePage||'home';
      try{ localStorage.setItem(GUIDE_DONT_KEY+':'+pg,'1'); }catch{}
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(!guideActive) return;
    if(e.key==='Escape'){ dismissGuide(false); }
  });
  window.addEventListener('resize', ()=> { if(guideActive && guidePrevEl) positionGuideTooltip(guidePrevEl); });
  window.addEventListener('scroll', ()=> { if(guideActive && guidePrevEl) positionGuideTooltip(guidePrevEl); }, {passive:true});
  // Hook into navigation: when page changes, show its own guide after a moment
  const origSetRoute = window.setRoute;
  if(origSetRoute){
    const wrappedSetRoute = function(hash){
      origSetRoute(hash);
      const key = (hash||location.hash||'#home').replace('#','').split('?')[0].split('/')[0] || 'home';
      // dismiss previous guide
      if(guideActive){ clearGuideHighlight(); if(guideTooltip) guideTooltip.hidden = true; guideActive=false; }
      setTimeout(()=>{
        if(shouldShowGuideFor(key) && document.querySelector('.page[aria-current="true"]')?.id === 'page-'+key){
          showGuideForPage(key);
        } else {
          if(guideShowBtn) guideShowBtn.hidden = false;
        }
      }, 650);
    };
    window.setRoute = wrappedSetRoute;
    // also patch global setRoute reference if defined as function
    try{ setRoute = wrappedSetRoute; }catch{}
  } else {
    // fallback: listen to hashchange
    window.addEventListener('hashchange', ()=>{
      const key = (location.hash||'#home').replace('#','').split('?')[0].split('/')[0] || 'home';
      setTimeout(()=>{ if(shouldShowGuideFor(key)) showGuideForPage(key); }, 650);
    });
  }
  setTimeout(()=>{
    const initial = (location.hash||'#home').replace('#','').split('?')[0].split('/')[0] || 'home';
    if(shouldShowGuideFor(initial)){
      setTimeout(()=> { if(!guideActive) showGuideForPage(initial); }, 900);
    } else {
      if(guideShowBtn) guideShowBtn.hidden = false;
    }
  }, 800);
  window.startGuide = startGuide;
  window.dismissGuide = dismissGuide;


})();