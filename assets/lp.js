// pip LP — small, dependency-free interactions. Respects "Reduce Motion".
(() => {
  // Set this when the App Store page exists. Until then the buttons show "近日公開" without a link.
  // Privacy and support pages link their header button to the top; change their label by hand.
  const APP_STORE_URL = '';
  if (APP_STORE_URL) document.querySelectorAll('.js-appstore[data-live]').forEach(a => {
    a.href = APP_STORE_URL; a.textContent = a.dataset.live; a.removeAttribute('aria-disabled');
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
    let html = ['月','火','水','木','金','土','日'].map(w => `<span class="w">${w}</span>`).join('');
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

  /* ---------- examples arrows ---------- */
  const exRow = document.getElementById('ex-row');
  document.querySelectorAll('.ex-arrows button').forEach(b => b.addEventListener('click', () => {
    exRow.scrollBy({ left: Number(b.dataset.dir) * 296, behavior: reduce ? 'auto' : 'smooth' });
  }));
})();
