import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';
const html = fs.readFileSync('/home/user/bulsuosr-src/OSR/osr-website/index.html','utf8');
const errs=[]; const vc=new VirtualConsole();
vc.on('jsdomError', e=>errs.push('jsdomError: '+(e.message||e))); vc.on('error',(...a)=>errs.push('err: '+a.join(' '))); vc.on('warn',()=>{});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://bulsuosr.netlify.app/',virtualConsole:vc,
  beforeParse(w){ w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
    w.fetch=()=>Promise.reject(new Error('offline')); w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
    w.scrollTo=()=>{}; }});
const {window}=dom; const d=window.document;
await new Promise(r=>setTimeout(r,800));
for(const r of ['ideal-bulsu','academic-calendar','track','initiatives']){
  window.location.hash='#'+r;
  await new Promise(x=>setTimeout(x,150));
  const active=[...d.querySelectorAll('.page')].filter(p=>p.getAttribute('aria-current')==='true').map(p=>p.id);
  console.log(r, '→ hash', window.location.hash, '| active:', active.join(',')||'(none)', '| #page-'+r+' exists:', !!d.getElementById('page-'+r), '| aria:', d.getElementById('page-'+r)?.getAttribute('aria-current'));
}
console.log('initList items:', d.getElementById('initList')?.children.length, '| initTimeline exist:', !!d.getElementById('initTimeline'), '| initCount:', d.getElementById('initCount')?.textContent);
console.log('calList children:', d.getElementById('calList')?.children.length, '| calList display:', d.getElementById('calList')?.style.display, '| calGrid display:', d.getElementById('calGrid')?.style.display);
console.log('initiative route render target check — #homeInitiatives:', d.getElementById('homeInitiatives')?.children.length);
console.log('\nerrors:', errs.length); errs.slice(0,20).forEach(e=>console.log('  ',e.slice(0,200)));
try{dom.window.close()}catch{}; process.exit(0);
