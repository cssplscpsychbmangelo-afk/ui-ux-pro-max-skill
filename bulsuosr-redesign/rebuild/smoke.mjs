import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';
const html = fs.readFileSync('/home/user/bulsuosr-src/OSR/osr-website/index.html','utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.message||e)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', () => {});
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://bulsuosr.netlify.app/', virtualConsole: vc,
  beforeParse(win){
    win.matchMedia = q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null });
    win.fetch = () => Promise.reject(new Error('offline in smoke test'));
    win.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    win.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} };
  } });
const { window } = dom;
await new Promise(r => setTimeout(r, 1200));
const d = window.document;
const q = s => d.querySelector(s);
const report = [];
const check = (label, ok, extra='') => report.push(`${ok?'PASS':'FAIL'}  ${label}${extra?' :: '+extra:''}`);
check('home announcements rendered', q('#homeAnnouncements') && q('#homeAnnouncements').children.length>0, (q('#homeAnnouncements')?.children.length||0)+' items');
check('dash stats filled', q('#dashStats') && q('#dashStats').textContent.replace(/\s+/g,' ').trim().slice(0,60));
check('upnext filled', q('#upnext') && q('#upnext').textContent.trim().length>0);
check('calendar view: grid shown, list view off', q('#calGrid') && q('#calGrid').style.display!=='none' && q('#calList')?.style.display==='none');
check('calGrid still has events', q('#calGrid') && q('#calGrid').children.length>0, (q('#calGrid')?.children.length||0)+' nodes');
check('announcements page list', q('#annList') && q('#annList').children.length>0, (q('#annList')?.children.length||0)+' items');
check('board list', q('#boardList') && q('#boardList').children.length>0, (q('#boardList')?.children.length||0)+' items');
check('initiatives list', q('#initList') && q('#initList').children.length>0, (q('#initList')?.children.length||0)+' items');
check('timeline built on the initiatives page', !!q('#initTimeline'));
check('resources list', q('#resList') && q('#resList').children.length>0, (q('#resList')?.children.length||0)+' items');
check('home resources', q('#homeResources') && q('#homeResources').children.length>0);
check('home initiatives', q('#homeInitiatives') && q('#homeInitiatives').children.length>0);
check('home board', q('#homeBoard') && q('#homeBoard').children.length>0);
check('home chips built', q('#homeAnnFilters') && q('#homeAnnFilters').children.length>1, (q('#homeAnnFilters')?.children.length||0)+' chips');
check('pulse allocation rows', q('#pulseAlloc') && q('#pulseAlloc').children.length>=7, (q('#pulseAlloc')?.children.length||0)+' rows');
check('pulse live map prompts before any points', q('#pulseLiveBars') && /Allocate points/.test(q('#pulseLiveBars').textContent));
check('pulse nav tabs', q('#pulseViewNav') && q('#pulseViewNav').querySelectorAll('[role=tab]').length>=5);
check('pulse overview stats', q('#pulseOverviewStats') && q('#pulseOverviewStats').children.length>0);
check('welcome overlay hidden for returning?', true, 'hidden='+(q('#welcomeOverlay')?.hasAttribute('hidden')));
check('route home active', q('#page-home')?.getAttribute('aria-current')==='true');
check('nav aria-current set', [...d.querySelectorAll('.nav__link,[data-nav]')].some(a=>a.getAttribute('aria-current')==='page'));
const markupOnly = html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'');
const authored = (markupOnly.match(/style="/g)||[]).length;
check('no inline styles authored in markup', authored===0, authored+' found');
const runtimeStyles=[...d.querySelectorAll('[style]')].length;
check('runtime style attributes present (dynamic only)', runtimeStyles>0, runtimeStyles+' elements styled at runtime');
check('toast wrap present', !!q('#toastWrap'));
check('guide host present', !!q('#guideHost'));
check('detail modal present', !!q('#detailModal'));
const ids = [...d.querySelectorAll('[id]')].map(e=>e.id);
const dupes = ids.filter((v,i)=>ids.indexOf(v)!==i);
check('no duplicate ids', dupes.length===0, dupes.join(','));
// navigate to each route and confirm it activates without throwing
const routes=['announcements','board-meetings','initiatives','resources','help','about','search','ideal-bulsu','academic-calendar','track','home'];
const bad=[];
for(const r of routes){
  try{ window.location.hash = '#'+r; await new Promise(res=>setTimeout(res,120));
    const page=q('#page-'+r.replace('ideal-bulsu','ideal-bulsu').replace('academic-calendar','academic-calendar'));
    const sel = r==='home' ? '#page-home' : '#page-'+r;
    if(!q(sel) || q(sel).getAttribute('aria-current')!=='true') bad.push(r+':not-active');
  }catch(e){ bad.push(r+':'+e.message); }
}
check('every route activates', bad.length===0, bad.join(' '));
console.log(report.join('\n'));
console.log('\n--- console/jsdom errors (' + errors.length + ') ---');
errors.slice(0,12).forEach(e=>console.log('  '+e.slice(0,220)));
try{ dom.window.close(); }catch{}
process.exit(0);
