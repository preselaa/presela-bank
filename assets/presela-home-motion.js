(() => {
  if (window.preselaHomeMotion) return;
  window.preselaHomeMotion = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function init(root = document) {
    root.querySelectorAll('[data-ps-design-edit]').forEach(section => {
      if (section.dataset.ready) return;
      section.dataset.ready = 'true';
      const track = section.querySelector('[data-ps-track]');
      const prev = section.querySelector('[data-ps-prev]');
      const next = section.querySelector('[data-ps-next]');
      if (!track || !prev || !next) return;
      const state = () => {
        prev.disabled = track.scrollLeft < 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      };
      const move = dir => {
        const card = track.firstElementChild;
        if (!card) return;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        track.scrollBy({left: dir * (card.getBoundingClientRect().width + gap), behavior: reduced.matches ? 'instant' : 'smooth'});
      };
      prev.addEventListener('click', () => move(-1));
      next.addEventListener('click', () => move(1));
      track.addEventListener('scroll', state, {passive:true});
      if ('ResizeObserver' in window) new ResizeObserver(state).observe(track);
      state();
    });
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer.unobserve(e.target);
        if (reduced.matches || typeof e.target.animate !== 'function') continue;
        e.target.animate([{opacity:.75,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
      }
    }, {threshold:.12});
    root.querySelectorAll('[data-template="index"] .section-resource-list__header,[data-template="index"] .ps-vip-feature-wrap,[data-template="index"] .ps-faq--support,.ps-design-edit__header').forEach(el => observer.observe(el));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>init(),{once:true}); else init();
  document.addEventListener('shopify:section:load', e=>init(e.target));
})();
