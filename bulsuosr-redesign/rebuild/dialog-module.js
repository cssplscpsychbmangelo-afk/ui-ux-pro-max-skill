/* ── DIALOG BEHAVIOUR ────────────────────────────────────────────────────────
   Everything modal on this site (navigation drawer, command palette, record
   dialog) traps Tab inside itself, closes on Escape, and hands focus back to
   the control that opened it. */
function rememberFocus(el){ try{ el._osrOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null; }catch(e){ el._osrOpener=null; } }
function restoreFocus(el){ const opener=el && el._osrOpener; if(opener && document.contains(opener)){ try{ opener.focus(); }catch(e){} } }
function focusables(root){
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent!==null || el===document.activeElement);
}
document.addEventListener("keydown", event=>{
  if(event.key==="Escape"){
    const panel=$("#morePanel");
    if(panel && !panel.hidden){ closeMore(true); return; }
    if(cmd.hasAttribute("open")){ closeCmd(); return; }
    if(modal.hasAttribute("open")){ closeModal(); return; }
    if(drawer.hasAttribute("open")){ closeDrawer(); return; }
    return;
  }
  if(event.key!=="Tab") return;
  const top = modal.hasAttribute("open") ? modal : (cmd.hasAttribute("open") ? cmd : (drawer.hasAttribute("open") ? drawer : null));
  if(!top) return;
  const list=focusables(top);
  if(!list.length) return;
  const first=list[0], last=list[list.length-1];
  const inside=top.contains(document.activeElement);
  if(event.shiftKey && (!inside || document.activeElement===first)){ event.preventDefault(); last.focus(); }
  else if(!event.shiftKey && (!inside || document.activeElement===last)){ event.preventDefault(); first.focus(); }
});

/* ── "MORE" DISCLOSURE ───────────────────────────────────────────────────────
   The secondary routes (calendar, tracking, consultation, search, palette) live
   one keyboard step from the masthead instead of crowding the primary row. */
const moreBtn=$("#moreBtn"), morePanel=$("#morePanel");
function closeMore(returnFocus){ if(!moreBtn||!morePanel||morePanel.hidden) return; morePanel.hidden=true; moreBtn.setAttribute("aria-expanded","false"); if(returnFocus) moreBtn.focus(); }
function openMore(){ if(!moreBtn||!morePanel) return; morePanel.hidden=false; moreBtn.setAttribute("aria-expanded","true"); const first=morePanel.querySelector("a,button"); if(first) first.focus(); }
if(moreBtn && morePanel){
  moreBtn.addEventListener("click", ()=> morePanel.hidden ? openMore() : closeMore(true));
  document.addEventListener("click", event=>{
    if(morePanel.hidden) return;
    if(morePanel.contains(event.target) || moreBtn.contains(event.target)) return;
    closeMore(false);
  });
  morePanel.addEventListener("click", event=>{ if(event.target.closest("a,button")) closeMore(false); });
}

/* ── UPCOMING DATES: PAUSE ───────────────────────────────────────────────────
   Auto-rotating content needs a control and must stand still for readers who
   asked for reduced motion. */
let dashCalPausedByUser = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches);
function dashCalPaused(){ return dashCalPausedByUser || !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches); }
(function bindDashPause(){
  const button=document.getElementById("dashCalPause");
  if(!button) return;
  const sync=()=>{
    const paused=dashCalPaused();
    button.setAttribute("aria-pressed", paused ? "true" : "false");
    button.textContent = paused ? "Play" : "Pause";
    button.setAttribute("aria-label", paused ? "Play the upcoming dates rotation" : "Pause the upcoming dates rotation");
  };
  button.addEventListener("click", ()=>{ dashCalPausedByUser = !dashCalPaused(); sync(); toast(dashCalPaused() ? "Upcoming dates paused" : "Upcoming dates playing"); });
  sync();
})();

