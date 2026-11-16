// Hareket katmanı: topoğrafik açılış ekranı, eş yükselti eğrileri, kelime kelime koyulaşan metin,
// kayan şerit ve bulanıktan nete gelen görseller. Hepsi hafif: canvas ya da fizik motoru yok.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const SVG = 'http://www.w3.org/2000/svg';

  if (reduced) { root.classList.remove('intro-pending'); return; }

  // ---------- Eş yükselti eğrisi üretici ----------
  function random(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };
  }
  function smoothPath(points) {
    const n = points.length; let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  // Bir tepe: dıştan içe iç içe geçen kapalı eğriler. Her eğri aynı ana biçimi küçültür, böylece kesişmezler.
  function hill(seed, cx, cy, R, levels) {
    const rand = random(seed);
    const waves = [2, 3, 4, 5, 6].map(j => ({ j, a: (rand() * 0.22) / j * 1.6, p: rand() * Math.PI * 2 }));
    const drift = [(rand() - 0.5) * R * 0.35, (rand() - 0.5) * R * 0.25];
    const out = [];
    for (let k = 0; k < levels; k++) {
      const s = 1 - (k / levels) * 0.93;
      const wobble = { j: 7 + (k % 3), a: 0.012 + rand() * 0.012, p: rand() * Math.PI * 2 };
      const ox = cx + drift[0] * (1 - s), oy = cy + drift[1] * (1 - s);
      const pts = [];
      for (let i = 0; i < 90; i++) {
        const t = i / 90 * Math.PI * 2;
        let r = 1;
        for (const w of waves) r += w.a * Math.sin(w.j * t + w.p);
        r += wobble.a * Math.sin(wobble.j * t + wobble.p);
        pts.push([ox + Math.cos(t) * R * s * r, oy + Math.sin(t) * R * s * r * 0.82]);
      }
      const label = pts.reduce((best, p) => p[0] > best[0] ? p : best, pts[0]);
      out.push({ d: smoothPath(pts), k, label, summit: [ox, oy] });
    }
    return out;
  }
  function contourSvg(lines, width, height, cls, levels) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', `0 0 ${Math.round(width)} ${Math.round(height)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', cls);
    const paths = lines.map(line => {
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', line.d);
      path.setAttribute('pathLength', '1');
      const index = line.k % 4 === 0, accent = line.k === levels - 3;
      path.setAttribute('class', accent ? 'accent' : index ? 'idx' : '');
      svg.append(path);
      return path;
    });
    return { svg, paths };
  }

  // ---------- 1) Açılış ekranı: Toprak / topoğrafya ----------
  function intro() {
    if (!root.classList.contains('intro-pending')) return;
    try { sessionStorage.setItem('mt-acilis', '1'); } catch (e) {}
    const W = innerWidth, H = innerHeight, LEVELS = 16;
    const overlay = document.createElement('div');
    overlay.className = 'intro';
    overlay.setAttribute('aria-hidden', 'true');
    const sheet = document.createElement('div');
    sheet.className = 'intro-sheet';
    const main = hill(1907, W * 0.63, H * 0.56, Math.max(W, H) * 0.62, LEVELS);
    const side = hill(4123, W * 0.12, H * 0.16, Math.min(W, H) * 0.3, 6).map(l => ({ ...l, k: l.k + 1 }));
    const { svg, paths } = contourSvg([...main, ...side], W, H, 'intro-map', LEVELS);
    svg.setAttribute('preserveAspectRatio', 'none');
    paths.forEach((path, i) => path.style.setProperty('--d', `${(i < LEVELS ? i : i - LEVELS) * 0.045}s`));
    main.forEach(line => {
      if (line.k % 4 !== 0 || line.k === 0) return;
      const text = document.createElementNS(SVG, 'text');
      text.setAttribute('x', (line.label[0] + 6).toFixed(0));
      text.setAttribute('y', line.label[1].toFixed(0));
      text.textContent = `+${(line.k / LEVELS * 100).toFixed(2)}`;
      text.style.setProperty('--d', `${line.k * 0.045 + 0.5}s`);
      svg.append(text);
    });
    const summit = main[LEVELS - 1].summit;
    const peak = document.createElementNS(SVG, 'text');
    peak.setAttribute('x', summit[0].toFixed(0)); peak.setAttribute('y', summit[1].toFixed(0));
    peak.setAttribute('class', 'peak'); peak.setAttribute('text-anchor', 'middle');
    peak.textContent = '＋';
    peak.style.setProperty('--d', '1.3s');
    svg.append(peak);
    sheet.append(svg);
    sheet.insertAdjacentHTML('beforeend',
      '<p class="intro-top">MEHMET TOPRAK<span>ARAZİ OKUMASI / PORTFOLYO 2026</span></p>' +
      '<p class="intro-def"><i>toprak</i> (a.) — yer, zemin, arazi.<br>Her proje bir zemin okumasıyla başlar.</p>' +
      '<p class="intro-kot"><span>KOT</span><b>±0.00</b><span class="intro-skip">GEÇMEK İÇİN TIKLA</span></p>' +
      '<div class="intro-cut"><span>A — A &nbsp; KESİT</span></div>');
    overlay.append(sheet);
    document.body.append(overlay);
    const value = sheet.querySelector('.intro-kot b');

    let finished = false;
    const start = performance.now(), DURATION = 1750;
    function count(now) {
      if (finished) return;
      const t = clamp((now - start) / DURATION, 0, 1), e = 1 - Math.pow(1 - t, 3);
      value.textContent = t === 0 ? '±0.00' : `+${(e * 100).toFixed(2)}`;
      if (t < 1) requestAnimationFrame(count);
    }
    requestAnimationFrame(() => { overlay.classList.add('draw'); requestAnimationFrame(count); });

    function finish() {
      if (finished) return;
      finished = true;
      value.textContent = '+100.00';
      overlay.classList.add('draw', 'cut');
      setTimeout(() => {
        const lower = sheet.cloneNode(true);
        sheet.classList.add('upper'); lower.classList.add('lower');
        overlay.append(lower);
        root.classList.remove('intro-pending');
        document.body.classList.add('intro-reveal');
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('split')));
        setTimeout(() => overlay.remove(), 1000);
      }, 420);
    }
    const timer = setTimeout(finish, DURATION + 350);
    const skip = () => { clearTimeout(timer); finish(); };
    overlay.addEventListener('click', skip);
    addEventListener('keydown', skip, { once: true });
    addEventListener('wheel', skip, { once: true, passive: true });
    addEventListener('touchmove', skip, { once: true, passive: true });
  }

  // ---------- 2) Bölüm arka planlarında kaydırdıkça çizilen eş yükselti eğrileri ----------
  const topoSections = [...document.querySelectorAll('.manifest, .process-band')].map((section, i) => {
    const lines = hill(311 + i * 97, i ? 760 : 820, i ? 260 : 330, i ? 520 : 600, 12);
    const { svg, paths } = contourSvg(lines, 1000, 600, 'topo', 12);
    section.classList.add('has-topo');
    section.prepend(svg);
    return { section, paths, last: -1 };
  });
  function paintTopo(vh) {
    for (const topo of topoSections) {
      const r = topo.section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = clamp((vh - r.top) / (vh * 0.55 + r.height * 0.6), 0, 1);
      if (Math.abs(p - topo.last) < 0.002) continue;
      topo.last = p;
      topo.paths.forEach((path, k) => { path.style.strokeDashoffset = (1 - clamp((p - k * 0.035) / 0.5, 0, 1)).toFixed(3); });
    }
  }

  // ---------- 3) Kelime kelime koyulaşan metin ----------
  function splitWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    for (const node of nodes) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(part); continue; }
        const span = document.createElement('span'); span.className = 'word'; span.textContent = part;
        frag.append(span); words.push(span);
      }
      node.replaceWith(frag);
    }
    return words;
  }
  const readers = [...document.querySelectorAll('.manifest h2, .manifest-note p, .process-band h2, .process-band p:not(.eyebrow)')]
    .map(el => ({ el, words: splitWords(el), lit: -1 }));
  function paintWords(vh) {
    for (const reader of readers) {
      const r = reader.el.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (vh * 0.42 + r.height * 0.5), 0, 1);
      const lit = Math.round(p * reader.words.length);
      if (lit === reader.lit) continue;
      reader.words.forEach((word, i) => word.classList.toggle('on', i < lit));
      reader.lit = lit;
    }
  }

  // ---------- 4) Kayan şerit: kaydırma hızına ve yönüne göre hızlanır ----------
  const marquees = [...document.querySelectorAll('.marquee-track')].map(track => {
    track.innerHTML += track.innerHTML; // kesintisiz döngü için içeriği ikiler
    const animation = track.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 42000, iterations: Infinity });
    return animation;
  }).filter(Boolean);
  let rate = 1, targetRate = 1, lastY = scrollY, lastT = performance.now(), direction = 1, marqueeLoop = 0;
  function stepMarquee() {
    marqueeLoop = 0;
    rate += (targetRate - rate) * 0.08;
    marquees.forEach(a => { a.playbackRate = rate; });
    targetRate += (direction - targetRate) * 0.04; // kaydırma bitince normal hıza döner
    if (Math.abs(rate - direction) > 0.02) marqueeLoop = requestAnimationFrame(stepMarquee);
  }
  function kickMarquee() {
    if (!marquees.length) return;
    const now = performance.now(), dy = scrollY - lastY, dt = Math.max(16, now - lastT);
    lastY = scrollY; lastT = now;
    if (dy) direction = dy > 0 ? 1 : -1;
    targetRate = direction * (1 + Math.min(9, Math.abs(dy / dt) * 6));
    if (!marqueeLoop) marqueeLoop = requestAnimationFrame(stepMarquee);
  }

  // ---------- 5) Görseller bulanıktan nete gelir ----------
  const focusTargets = [...document.querySelectorAll('.work-image>img:not(.work-blueprint), .project-cover img, .story-row img, .drawing-grid img')];
  if ('IntersectionObserver' in window && focusTargets.length) {
    focusTargets.forEach(img => img.classList.add('focus-reveal'));
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-focused');
      io.unobserve(entry.target);
    }), { threshold: 0.18 });
    focusTargets.forEach(img => io.observe(img));
  }

  // ---------- Kaydırma döngüsü ----------
  let pending = false;
  function frame() { pending = false; const vh = innerHeight; paintTopo(vh); paintWords(vh); }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', () => { schedule(); kickMarquee(); }, { passive: true });
  addEventListener('resize', () => { topoSections.forEach(t => { t.last = -1; }); readers.forEach(r => { r.lit = -1; }); schedule(); }, { passive: true });

  intro();
  schedule();
})();
