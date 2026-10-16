// pip site — header turns into a floating bar after scrolling; phones always have the menu button (all pages)
(() => {
  const head = document.querySelector('.site-head');
  if (!head) return;
  const btn = head.querySelector('.menu-btn'), panel = document.getElementById('menu');
  const setOpen = open => {
    if (!btn || !panel) return;
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };
  const update = () => {
    const scrolled = window.scrollY > 24;
    head.classList.toggle('is-scrolled', scrolled);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  if (btn && panel) {
    btn.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
})();
