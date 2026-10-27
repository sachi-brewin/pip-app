// pip LP — small, dependency-free interactions. Respects "Reduce Motion".
(() => {
  // Set this when the App Store page exists. Until then the buttons show "近日公開" without a link
  // (Apple's badge may only be used once the app is available).
  // With the URL set, every button becomes the official Japanese App Store badge (2026-10-23 本人決定):
  // 40px in the header, 48px elsewhere; Apple requires 40px+ on screen and clear space of 1/4 of the height.
  // Privacy and support pages do not load this file; switch their buttons by hand (README).
  const APP_STORE_URL = 'https://apps.apple.com/jp/app/id6823105506';
  if (APP_STORE_URL) document.querySelectorAll('.js-appstore[data-live]').forEach(a => {
    a.href = APP_STORE_URL; a.removeAttribute('aria-disabled');
    a.className = `appstore-badge${a.closest('.site-head') ? ' sm' : ''}`;
    a.innerHTML = '<img src="assets/img/appstore-badge-ja.svg" alt="App Storeからダウンロード" width="109" height="40">';
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOODS = ['#B9D3F5', '#C9CEF5', '#D9C9EF', '#EEC3D6', '#EEC8AF'];
  // same 5 colors and OKLab interpolation as the app
  const moodAt = p => {
    const x = Math.min(Math.max(p, 0), 1) * 4, i = Math.min(Math.floor(x), 3), t = Math.round((x - i) * 100);
    return `color-mix(in oklab, ${MOODS[i]}, ${MOODS[i + 1]} ${t}%)`;
  };
  const heart = (color, cls = 'heart') => `<svg class="${cls}" aria-hidden="true"><use href="#heart" fill="url(#h-${color})"/></svg>`;


  /* ---------- reveal on scroll (once) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- marquee ---------- */
  const notes = [['だれかの優しさがうれしかった','pink'],['朝のコーヒーがおいしかった','blue'],['自分にちょっとやさしくできた','yellow'],['散歩する時間をつくれた','lav'],['友だちが話を聞いてくれた','peach'],['空がきれいだった','purple'],['早起きできた','blue']];
  const chips = list => list.map(([t, c]) => `<span>${heart(c)}${t}</span>`).join('');
  const fill = (id, list) => { const el = document.getElementById(id); if (el) el.innerHTML = chips(list) + chips(list); };
  fill('mq-pc', notes);
  fill('mq-sp1', notes.slice(0, 4));
  fill('mq-sp2', notes.slice(4).concat(notes.slice(0, 1)));

  /* ---------- demo 1: typing rows -> hearts ---------- */
  const rows = [...document.querySelectorAll('#rows .row')];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const burst = (row, color) => {
    if (reduce) return;
    const st = row.querySelector('.st');
    [[24, -4, -60], [17, 14, -48]].forEach(([size, dx, dy], k) => {
      const h = document.createElement('span');
      h.className = 'float-heart';
      h.style.cssText = `width:${size}px;height:${size * .875}px;--dx:${dx}px;--dy:${dy}px;animation-delay:${k * 80}ms`;
      h.innerHTML = `<svg width="100%" height="100%" aria-hidden="true"><use href="#heart" fill="url(#h-${color})" opacity=".75"/></svg>`;
      st.appendChild(h);
      setTimeout(() => h.remove(), 1000);
    });
  };
  const setHeart = row => {
    const c = row.dataset.heart;
    row.classList.remove('typing');
    row.querySelector('.st').innerHTML = heart(c, 'heart pop');
    burst(row, c);
  };
  const typeRows = async () => {
    for (const row of rows) {
      const t = row.querySelector('.t'), text = row.dataset.text;
      if (reduce) { t.textContent = text; setHeart(row); continue; }
      row.classList.add('typing');
      for (let k = 1; k <= text.length; k++) { t.textContent = text.slice(0, k); await wait(85); }
      await wait(260); setHeart(row); await wait(420);
    }
  };
  if (rows.length) {
    const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); typeRows(); } }, { threshold: .6 });
    o.observe(document.getElementById('rows'));
  }

  /* ---------- demo 2: mood slider tints its card ---------- */
  const thumb = document.getElementById('thumb'), demo = document.getElementById('mood-demo'), track = document.getElementById('track');
  if (thumb && demo && track) {
    // Starts like the app before a mood is chosen: white card, no thumb.
    // Once the card is in view, the thumb appears and the card tint fades in (0 -> 22%) while it moves.
    let tint = 0, started = false, dragging = false, visible = false, t0 = 0;
    const setMood = p => {
      thumb.style.left = `${p * 100}%`; thumb.style.background = moodAt(p);
      demo.style.backgroundColor = `color-mix(in oklab, ${moodAt(p)} ${Math.round(tint * 22)}%, #fff)`;
    };
    const start = () => {
      if (started) return; started = true;
      thumb.classList.add('on');
      if (reduce) { tint = 1; setMood(.72); return; }
      t0 = performance.now();
      const loop = now => {
        tint = Math.min(1, (now - t0) / 2400);
        if (visible && !dragging) setMood(.5 + .42 * Math.sin((now - t0) / 2600));
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    };
    setMood(.5);
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && !started) setTimeout(start, 1600);
    }, { threshold: .5 }).observe(demo);
    const drag = e => { const r = track.getBoundingClientRect(); setMood(Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)); };
    track.addEventListener('pointerdown', e => { start(); tint = 1; dragging = true; track.setPointerCapture(e.pointerId); drag(e); });
    track.addEventListener('pointermove', e => { if (dragging) drag(e); });
    track.addEventListener('pointerup', () => { dragging = false; });
  }

  /* ---------- demo 3: calendar fills in day by day ---------- */
  const cal = document.getElementById('cal');
  if (cal) {
    const GEMS = { 0: ['#F4F8FE', '#BFD7F6', '#ABC4E6'], .25: ['#F7F8FE', '#CDD2F6', '#BBC0E6'], .5: ['#F9F7FD', '#DCCDF0', '#CABBE0'],
                   .75: ['#FCF6F9', '#EFC8D9', '#DFB5C7'], 1: ['#FCF7F3', '#EFCCB5', '#DFBAA1'] };
    const filled = { 1: .0, 2: .25, 3: .5, 4: .75, 5: .0, 6: .25, 7: .5, 8: 1, 9: .75, 10: .5 };
    let html = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(w => `<span class="w">${w}</span>`).join('');
    const cells = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    cells.forEach((d, i) => {
      if (d === null) { html += '<span></span>'; return; }
      const p = filled[d];
      // same recipe as the app's calendar gem (PipMoodPalette.thumbColors): white 85% / white 8% / OKLab L-0.045
      const bg = p === undefined ? '' : `background:linear-gradient(135deg, ${GEMS[p].join(' 0%, ').replace(/ 0%, ([^ ]+)$/, ' 62%, $1 100%')});`;
      html += `<span class="d${p === undefined ? ' e' : ' c'}${d === 11 ? ' today' : ''}" style="--i:${i};${bg}"><span>${d}</span></span>`;
    });
    cal.innerHTML = html;
    const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { cal.classList.add('in'); o.disconnect(); } }, { threshold: .5 });
    o.observe(cal);
  }

  /* ---------- demo 4: the thanks count rolls up like a slot machine (3 a day) ---------- */
  const numBox = document.getElementById('ach-num'), countDemo = document.getElementById('count-demo');
  if (numBox && countDemo) {
    const label = countDemo.querySelector('.ach');
    const REP = 6; // strip = 0..9 repeated
    let reels = [], value = 0, timer = null;
    const makeReel = () => {
      const r = document.createElement('span'); r.className = 'reel';
      const st = document.createElement('span'); st.className = 'strip';
      for (let i = 0; i < 10 * REP; i++) { const d = document.createElement('span'); d.textContent = i % 10; st.appendChild(d); }
      r.appendChild(st); return { el: r, strip: st, pos: 0 };
    };
    // each reel takes the width of the digit it shows (proportional figures, like the app's label)
    const measure = () => {
      const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      numBox.appendChild(probe); const fs = parseFloat(getComputedStyle(numBox).fontSize) || 16;
      const w = [...'0123456789'].map(d => { probe.textContent = d; return probe.getBoundingClientRect().width / fs; });
      probe.remove(); return w;
    };
    let digitW = measure();
    document.fonts.ready.then(() => { digitW = measure(); reels.forEach(r => { r.el.style.width = `${digitW[r.pos % 10]}em`; }); });
    const place = (reel, pos, spin, dur) => {
      reel.strip.classList.toggle('spin', spin);
      reel.strip.style.setProperty('--d', dur + 's');
      reel.strip.style.transform = `translateY(${-pos * 1.25}em)`;
      reel.el.classList.toggle('spin', spin);
      reel.el.style.width = `${digitW[pos % 10]}em`;
      reel.pos = pos;
    };
    const render = (next, spin) => {
      const digits = String(next).split('').map(Number);
      while (reels.length < digits.length) { const r = makeReel(); reels.unshift(r); numBox.prepend(r.el); }
      while (reels.length > digits.length) { reels.shift().el.remove(); }
      const last = digits.length - 1;
      digits.forEach((d, i) => {
        const reel = reels[i];
        let pos = reel.pos;
        if (pos >= 30) { place(reel, pos % 10, false, 0); void reel.strip.offsetHeight; pos = reel.pos; }
        let target = Math.floor(pos / 10) * 10 + d;
        if (target < pos) target += 10;          // always roll forward
        if (spin && i === last) target += 10;    // the last digit spins one extra turn, like a slot
        place(reel, target, spin && target !== pos, .8 + i * .3);
      });
      value = next; label.setAttribute('aria-label', `${next}個のありがとう`);
    };
    numBox.textContent = '';
    if (reduce) { render(42, false); }
    else {
      render(0, false);
      const tick = () => {
        const next = value === 0 ? 39 : (value + 3 > 99 ? 39 : value + 3);
        render(next, true);
        timer = setTimeout(tick, value === 39 ? 2600 : 2000);
      };
      new IntersectionObserver(es => {
        if (es[0].isIntersecting) { if (!timer) timer = setTimeout(tick, 700); }
        else { clearTimeout(timer); timer = null; }
      }, { threshold: .5 }).observe(countDemo);
    }
  }

  /* ---------- FV parallax: the floating orbs and notes drift at different depths (text never moves) ---------- */
  // Uses the separate `translate` property so it stacks with the float animation's transform.
  const depthItems = [...document.querySelectorAll('.fv-deco [data-depth]')];
  const hero = document.querySelector('.hero');
  if (depthItems.length && hero && !reduce) {
    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      if (y > hero.offsetTop + hero.offsetHeight) return; // FV is out of view
      depthItems.forEach(el => { el.style.translate = `0 ${(-y * parseFloat(el.dataset.depth)).toFixed(1)}px`; });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
  }

  /* ---------- moving warm background (prototype C, 2026-10-17) ----------
     Warm pools drift along the edges and cycle peach → coral → pink → light orange with scroll.
     During the FV only a small hole around the glass character stays white (so the glass does not get muddy);
     after the FV a fourth pool fades in at the centre. Over the grey panel, the duo cards and the footer the layer fades out. */
  const flow = document.querySelector('.page-bg .flow');
  if (flow) {
    const WARM = ['#EEC8AF', '#F3C9BC', '#EEC3D6', '#F6D5C0'];
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const tone = k => { const n = WARM.length, x = ((k % 1) + 1) % 1 * n, i = Math.floor(x), t = x - i, A = hex(WARM[i]), B = hex(WARM[(i + 1) % n]); return A.map((v, j) => Math.round(v + (B[j] - v) * t)); };
    const rgb = (c, a = 1) => `rgba(${c.join(',')},${a})`;
    const heroEl = document.querySelector('.hero'), glassEl = document.querySelector('.glass-wrap');
    const fadeEls = [...document.querySelectorAll('.panel, .duo, .site-foot')];
    const set = (k, v) => flow.style.setProperty(k, v);
    const frame = t => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight), p = scrollY / max, s = reduce ? 0 : t / 1000;
      set('--c1', rgb(tone(p))); set('--c2', rgb(tone(p + .3))); set('--c3', rgb(tone(p + .6)));
      set('--x1', `${4 + 6 * Math.sin(s * .21)}%`); set('--y1', `${25 + 15 * Math.cos(s * .17) + p * 40}%`);
      set('--x2', `${96 - 6 * Math.sin(s * .15)}%`); set('--y2', `${55 + 15 * Math.sin(s * .19) - p * 35}%`);
      set('--x3', `${30 + 40 * (.5 + .5 * Math.sin(s * .09 + p * 3))}%`); set('--y3', `${100 - 4 * Math.sin(s * .11)}%`);
      const k = Math.min(Math.max(scrollY / ((heroEl ? heroEl.offsetHeight : innerHeight) * .9), 0), 1), hole = 1 - k;
      let mask = 'none';
      if (glassEl && hole > .02) { const g = glassEl.getBoundingClientRect(), fr = flow.getBoundingClientRect(), rr = g.width * 1.1 * hole;
        mask = `radial-gradient(circle at ${(g.left + g.width / 2 - fr.left).toFixed(0)}px ${(g.top + g.height / 2 - fr.top).toFixed(0)}px, transparent 0, transparent ${(rr * .55).toFixed(0)}px, #000 ${rr.toFixed(0)}px)`; }
      set('--hole-mask', mask);
      set('--c4', rgb(tone(p + .15), (k * (.55 + .45 * Math.sin(s * .3))).toFixed(2)));
      set('--x4', `${50 + 18 * Math.sin(s * .12)}%`); set('--y4', `${50 + 12 * Math.cos(s * .1)}%`);
      let cover = 0;
      fadeEls.forEach(el => { const r = el.getBoundingClientRect(); cover = Math.max(cover, Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / innerHeight); });
      set('--flow-o', (.45 * (1 - .85 * Math.min(1, cover * 1.4))).toFixed(3));
      if (!reduce) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    if (reduce) addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true });
  }

  /* ---------- research (PC): centre each number on its unit by the drawn shape, not the glyph box ---------- */
  // Unbounded's "1" sits right of centre inside its box, so the Japanese unit looked shifted left.
  const measureCtx = document.createElement('canvas').getContext('2d');
  const centreNumbers = () => document.querySelectorAll('.r-split .r-val b').forEach(b => {
    b.style.translate = '';
    if (innerWidth < 1280) return;
    const cs = getComputedStyle(b); measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = measureCtx.measureText(b.textContent);
    b.style.translate = `${(m.width / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2).toFixed(1)}px 0`;
  });
  document.fonts.ready.then(centreNumbers); addEventListener('resize', centreNumbers);

  /* ---------- examples arrows ---------- */
  const exRow = document.getElementById('ex-row');
  document.querySelectorAll('.ex-arrows button').forEach(b => b.addEventListener('click', () => {
    exRow.scrollBy({ left: Number(b.dataset.dir) * 296, behavior: reduce ? 'auto' : 'smooth' });
  }));
})();
