/* About page: section jump bar scrolls within the page and tracks the section in view. */
(function(){
  const nav=document.querySelector('#page-about .ab-jump');
  if(!nav) return;
  const buttons=[...nav.querySelectorAll('[data-about-jump]')];
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const target=document.getElementById(button.dataset.aboutJump);
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  }));
  if(!('IntersectionObserver' in window)) return;
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      buttons.forEach(button=>button.classList.toggle('is-active', button.dataset.aboutJump===entry.target.id));
    });
  },{rootMargin:'-35% 0px -55% 0px'});
  buttons.forEach(button=>{ const el=document.getElementById(button.dataset.aboutJump); if(el) observer.observe(el); });
})();