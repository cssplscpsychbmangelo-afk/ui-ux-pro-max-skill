import re, pathlib, json
p=pathlib.Path('/tmp/js/block1.js'); js=p.read_text(encoding='utf-8')
steps=[]
def sub(old,new,label,count=1):
    global js
    assert old in js, 'NOT FOUND: '+label
    n = js.count(old) if count==0 else count
    js=js.replace(old,new,n); steps.append(f'{label} x{n}')

sub('''function setRoute(hash){
  const key=(hash||location.hash||"#home").replace("#","").split("?")[0].split("/")[0] || "home";''',
'''function setRoute(hash){
  /* One route, however it was written: "#about", "about.html", "/about/" and
     "about" all land on the same page, so a link typed into the CMS works
     whether the editor thought in hashes, files or folders. */
  const raw=(hash||location.hash||"#home").replace("#","").split("?")[0];
  const key=raw.replace(/^\\/+|\\/+$/g,"").split("/")[0].replace(/\\.html?$/i,"") || "home";''','route normalisation')
sub('$$(".nav a, .drawer__nav a").forEach(a=>{', '$$(".nav a, .drawer__nav a, .more__link, .ab-jump button").forEach(a=>{','nav sweep')
sub('''  window.scrollTo({top:0, behavior:"smooth"});
  closeDrawer(); closeCmd();''','''  window.scrollTo({top:0, behavior:"smooth"});
  closeDrawer(); closeCmd(); closeMore(false);''','route closes More')
module = open('/tmp/js/dialog-module.js').read()
sub('const pages={"home":"page-home"', module+'const pages={"home":"page-home"','dialog module')
sub('''function openDrawer(){ drawer.setAttribute("open",""); drawer.setAttribute("aria-hidden","false"); $("#menuBtn").setAttribute("aria-expanded","true"); $("#drawerClose").focus(); document.body.style.overflow="hidden"; }
function closeDrawer(){ drawer.removeAttribute("open"); drawer.setAttribute("aria-hidden","true"); $("#menuBtn").setAttribute("aria-expanded","false"); document.body.style.overflow=""; }''',
'''function openDrawer(){ rememberFocus(drawer); drawer.setAttribute("open",""); drawer.setAttribute("aria-hidden","false"); $("#menuBtn").setAttribute("aria-expanded","true"); $("#drawerClose").focus(); document.body.style.overflow="hidden"; }
function closeDrawer(){ const wasOpen=drawer.hasAttribute("open"); drawer.removeAttribute("open"); drawer.setAttribute("aria-hidden","true"); $("#menuBtn").setAttribute("aria-expanded","false"); document.body.style.overflow=""; if(wasOpen) restoreFocus(drawer); }''','drawer focus')
sub('''function openCmd(){ cmd.setAttribute("open",""); cmd.setAttribute("aria-hidden","false"); $("#cmdInput").value=""; renderCmd(""); $("#cmdInput").focus(); document.body.style.overflow="hidden"; }
function closeCmd(){ cmd.removeAttribute("open"); cmd.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }''',
'''function openCmd(){ rememberFocus(cmd); cmd.setAttribute("open",""); cmd.setAttribute("aria-hidden","false"); $("#cmdInput").setAttribute("aria-expanded","true"); $("#cmdInput").value=""; renderCmd(""); $("#cmdInput").focus(); document.body.style.overflow="hidden"; }
function closeCmd(){ const wasOpen=cmd.hasAttribute("open"); cmd.removeAttribute("open"); cmd.setAttribute("aria-hidden","true"); $("#cmdInput").setAttribute("aria-expanded","false"); document.body.style.overflow=""; if(wasOpen) restoreFocus(cmd); }''','palette focus')
sub('  modal.setAttribute("open",""); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; $("#modalClose").focus();',
'''  rememberFocus(modal);
  modal.setAttribute("open",""); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; $("#modalClose").focus();''','modal focus in')
sub('function closeModal(){ modal.removeAttribute("open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }',
'function closeModal(){ const wasOpen=modal.hasAttribute("open"); modal.removeAttribute("open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; if(wasOpen) restoreFocus(modal); }','modal focus out')
old_bind = re.search(r'let homeAnnFilter="all";\nfunction bindHomeAnnFilters\(\)\{[\s\S]*?\n\}\n', js)
assert old_bind, 'bindHomeAnnFilters'
js = js[:old_bind.start()] + '''let homeAnnFilter="all";
let homeAnnChipKey="";
/* Chips are built from the categories the records actually use, so the filter
   never offers a category the Office has not published — and CMS data arriving
   later rebuilds them instead of leaving a stale row. */
function renderHomeAnnChips(){
  const wrap=$("#homeAnnFilters");
  if(!wrap) return;
  const cats=[...new Set(ANNOUNCEMENTS.map(a=>a.category).filter(Boolean))];
  const key=cats.join("|");
  if(key===homeAnnChipKey) return;
  homeAnnChipKey=key;
  if(homeAnnFilter!=="all" && cats.indexOf(homeAnnFilter)===-1) homeAnnFilter="all";
  const chips=[{value:"all",label:"All announcements"}].concat(cats.map(c=>({value:c,label:c})));
  wrap.innerHTML=chips.map(c=>`<button type="button" class="dash-chip" data-cat="${escapeHtml(c.value)}" aria-pressed="${homeAnnFilter===c.value?"true":"false"}">${escapeHtml(c.label)}</button>`).join("");
  wrap.querySelectorAll(".dash-chip").forEach(ch=>{
    ch.addEventListener("click", ()=>{
      homeAnnFilter=ch.dataset.cat;
      wrap.querySelectorAll(".dash-chip").forEach(c=> c.setAttribute("aria-pressed", c===ch ? "true":"false"));
      renderHomeAnnouncements();
    });
  });
}
function bindHomeAnnFilters(){ renderHomeAnnChips(); }
''' + js[old_bind.end():]
steps.append('home chips')
sub('''function renderHomeAnnouncements(){
  const q = homeAnnFilter?.toLowerCase();
  const wrap=$("#homeAnnouncements");
  if(!wrap) return;''','''function renderHomeAnnouncements(){
  const q = homeAnnFilter?.toLowerCase();
  const wrap=$("#homeAnnouncements");
  if(!wrap) return;
  renderHomeAnnChips();''','chips refresh')
sub('tl.hidden=false; tl.style.display="grid"; tl.style.borderLeft="2px solid var(--line)"; tl.style.marginLeft="10px"; tl.style.paddingLeft="16px"; tl.style.gap="14px";',
    'tl.hidden=false; tl.style.display="grid";','timeline display')
sub('  ["step1","step2","step3"].forEach((id,i)=> document.getElementById(id).style.background = i < n ? "var(--red)" : "var(--line)");',
'''  ["step1","step2","step3"].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el) return;
    const done=i < n;
    el.style.background = done ? "var(--red)" : "var(--line)";
    el.setAttribute("data-done", done ? "true" : "false");
    el.setAttribute("aria-label", done ? "Step "+(i+1)+": completed" : "Step "+(i+1)+": not yet completed");
  });''','stepper semantics')
sub('''function renderResources(){
  const q=$("#resSearch").value.trim().toLowerCase();
  const cat=$("#resCategory").value;
  let list=[...RESOURCES];
  if(cat!=="all") list=list.filter(r=> r.category===cat);''','''let resSavedOnly=false;
function renderResources(){
  const q=$("#resSearch").value.trim().toLowerCase();
  const cat=$("#resCategory").value;
  let list=[...RESOURCES];
  if(resSavedOnly) list=list.filter(r=> saved.has(r.id));
  if(cat!=="all") list=list.filter(r=> r.category===cat);''','saved-only filter')
sub('''function renderSavedView(){
  const list=[...RESOURCES].filter(r=> saved.has(r.id));''','''function renderSavedView(){
  resSavedOnly=true;
  const list=[...RESOURCES].filter(r=> saved.has(r.id));''','renderSavedView flag')
sub('$("#resSavedBtn").addEventListener("click", renderSavedView);',
'''$("#resSavedBtn").addEventListener("click", renderSavedView);
$("#resSavedOnly")?.addEventListener("click", ()=>{
  resSavedOnly = !resSavedOnly;
  const toggle=$("#resSavedOnly");
  if(toggle) toggle.setAttribute("aria-pressed", resSavedOnly ? "true" : "false");
  if(resSavedOnly) $("#resSavedBtn").textContent = "Show all resources";
  else $("#resSavedBtn").innerHTML = `Saved (<span id="resSavedCount">${saved.size}</span>)`;
  renderResources();
});''','saved-only toggle')
sub('if(wrap._dashPaused || document.hidden || maxOffset===0) return;','if(wrap._dashPaused || dashCalPaused() || document.hidden || maxOffset===0) return;','rotation pause')
sub('''        const baseStyle = `border-left-color:${calCatColor(e.category)};` + (isNext ? 'background:#FFFBF5;' : '');
        return `<div class="cal-event" id="cal-evt-${e.id}" style="${baseStyle}">''',
'''        return `<div class="cal-event${isNext?' is-next':''}" id="cal-evt-${e.id}">''','cal list row')
sub('      return `<div class="cal-event" id="cal-evt-${e.id}" style="border-left-color:${calCatColor(e.category)}">',
    '      return `<div class="cal-event" id="cal-evt-${e.id}">','cal list branch')
for old,new,label in json.load(open('/tmp/js/style-map.json')): sub(old,new,label,count=0)
for pat in [r' style="display:inline-flex; align-items:center; gap:5px"',
            r' style="display:inline-flex; align-items:center; gap:4px"',
            r' style="cursor:pointer; display:inline-flex; align-items:center; gap:5px"',
            r' style="cursor:pointer; border-style:dashed; display:inline-flex; align-items:center; gap:5px"',
            r' style="padding:7px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px"',
            r' style="padding:7px 11px; font-size:12px; display:inline-flex; align-items:center; gap:5px"']:
    js = re.sub(pat,'',js)
steps.append('leftover display-only styles')
sub('''  if(!list.length){
    wrap.innerHTML="";
    empty.hidden=false;
    empty.innerHTML=`<b>No resources match</b><p class="note-p">Try a different category or search term.</p>`;
    return;
  }
  empty.hidden=true;''','''  const toggle=$("#resSavedOnly");
  if(toggle) toggle.setAttribute("aria-pressed", resSavedOnly ? "true" : "false");
  if(!list.length){
    wrap.innerHTML="";
    empty.hidden=false;
    empty.innerHTML = resSavedOnly
      ? `<b>Nothing saved yet</b><p class="note-p">Use Save on any resource and it appears in this list. Saved items stay in this browser — they are never uploaded.</p>`
      : `<b>No resources match</b><p class="note-p">Try a different category or search term.</p>`;
    return;
  }
  empty.hidden=true;''','saved-only empty state')
p.write_text(js,encoding='utf-8')
print('steps applied:',len(steps))
left=re.findall(r'<[^>]*style="[^"]*"[^>]*>', js)
print('inline styles left in JS templates:', len(left))
for l in left: print('   ', re.sub(r'\s+',' ',l)[:130])
