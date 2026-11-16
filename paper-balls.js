// Kağıt topları: ana sayfada aşağı kaydırırken proje görselleri kağıt gibi buruşup
// top olur; toplar ekranın altına düşer, fareyle/parmakla tutulup fırlatılabilir.
// Yukarı kaydırınca top kendi yerine uçar ve kağıt yeniden açılır.
(() => {
  const grid = document.querySelector('.works-grid');
  if (!grid || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'paper-layer';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');

  const PAPER_BACK = '#efede4';
  const LIGHT = (() => { const l = [-0.35, -0.55, 0.76]; const n = Math.hypot(...l); return l.map(v => v / n); })();
  const GRAVITY = 2300;
  const START = 0.56, SPAN = 0.44; // kağıt, görselin alt kenarı ekranın %56'sından %12'sine çıkarken buruşur

  let dpr = 1, vw = innerWidth, vh = innerHeight;
  let raf = 0, last = performance.now();
  let drag = null, suppressClick = false, lastTap = null, hoverBall = null;
  let hint = null, hintShown = false;
  const bodies = [];

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function mulberry32(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };
  }
  function valueNoise(rnd, gx, gy) {
    const g = Array.from({ length: (gx + 1) * (gy + 1) }, () => rnd() * 2 - 1);
    return (u, v) => {
      const x = u * gx, y = v * gy, i = Math.min(gx - 1, Math.floor(x)), j = Math.min(gy - 1, Math.floor(y));
      const fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = g[j * (gx + 1) + i], b = g[j * (gx + 1) + i + 1], c = g[(j + 1) * (gx + 1) + i], d = g[(j + 1) * (gx + 1) + i + 1];
      return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
    };
  }

  const cards = [...grid.querySelectorAll('.work-card')].map((el, i) => ({
    el, i,
    frame: el.querySelector('.work-image'),
    img: el.querySelector('.work-image>img:not(.work-blueprint)'),
    caption: el.querySelector('.work-caption'),
    href: el.href,
    title: el.querySelector('h3')?.textContent || '',
    seed: 2026 + i * 7919,
    state: 'flat', t: 0, mesh: null, tex: null, body: null, ret: null
  })).filter(card => card.frame && card.img);

  // ---------- Kağıt ağı ----------
  function buildMesh(card, W, H) {
    const rnd = mulberry32(card.seed);
    const n0 = valueNoise(rnd, 3, 3), n1 = valueNoise(rnd, 3, 3), n2 = valueNoise(rnd, 4, 4), n3 = valueNoise(rnd, 6, 5);
    const NX = 13, NY = clamp(Math.round(NX * H / W), 7, 14);
    const R = clamp(0.115 * Math.sqrt(W * H), 30, 76) * (vw < 640 ? 0.85 : 1);
    const count = (NX + 1) * (NY + 1);
    const m = {
      W, H, R, NX, NY, count,
      u: new Float32Array(count), v: new Float32Array(count),
      fx: new Float32Array(count), fy: new Float32Array(count),
      tx: new Float32Array(count), ty: new Float32Array(count), tz: new Float32Array(count),
      w: new Float32Array(count), w2: new Float32Array(count),
      x: new Float32Array(count), y: new Float32Array(count), z: new Float32Array(count),
      sx: new Float32Array(count), sy: new Float32Array(count),
      faces: [], depth: null, order: null,
      spin: rnd() < 0.5 ? -1 : 1
    };
    let k = 0;
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const u = i / NX, v = j / NY;
      m.u[k] = u; m.v[k] = v;
      m.fx[k] = (u - 0.5) * W; m.fy[k] = (v - 0.5) * H;
      let dx = (2 * u - 1) * 0.9 + n0(u, v) * 1.5, dy = (2 * v - 1) * 0.9 + n1(u, v) * 1.5, dz = n2(u, v) * 1.7 + (rnd() - 0.5) * 0.7;
      const len = Math.hypot(dx, dy, dz) || 1, rr = R * (0.8 + 0.34 * rnd());
      m.tx[k] = dx / len * rr; m.ty[k] = dy / len * rr; m.tz[k] = dz / len * rr;
      m.w[k] = n3(u, v) * 0.75 + (rnd() - 0.5) * 0.55;
      m.w2[k] = rnd() - 0.5;
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      m.faces.push([a, b, c], [b, d, c]);
    }
    m.depth = new Float32Array(m.faces.length);
    m.order = m.faces.map((_, i) => i);
    return m;
  }

  function buildTexture(card, fr) {
    const tw = Math.round(Math.min(fr.width, 520)), th = Math.max(1, Math.round(tw * fr.height / fr.width));
    const c = document.createElement('canvas'); c.width = tw; c.height = th;
    const g = c.getContext('2d');
    const imgStyle = getComputedStyle(card.img);
    const transparent = s => !s || s === 'transparent' || /rgba\(.*,\s*0\)$/.test(s);
    g.fillStyle = !transparent(imgStyle.backgroundColor) ? imgStyle.backgroundColor : !transparent(getComputedStyle(card.frame).backgroundColor) ? getComputedStyle(card.frame).backgroundColor : '#efeee8';
    g.fillRect(0, 0, tw, th);
    const img = card.img;
    if (img.complete && img.naturalWidth) {
      const k = tw / fr.width, ir = img.getBoundingClientRect();
      const bx = (ir.left - fr.left) * k, by = (ir.top - fr.top) * k, bw = ir.width * k, bh = ir.height * k;
      const s = imgStyle.objectFit === 'contain' ? Math.min(bw / img.naturalWidth, bh / img.naturalHeight) : Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
      g.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
      g.restore();
    }
    return c;
  }

  function prepare(card, fr) {
    if (!card.mesh || Math.abs(card.mesh.W - fr.width) > 2 || Math.abs(card.mesh.H - fr.height) > 2) card.mesh = buildMesh(card, fr.width, fr.height);
    card.tex = buildTexture(card, fr);
    const img = card.img;
    if ((!img.complete || !img.naturalWidth) && !card.waitingImage) {
      // Hızlı kaydırmada tembel yüklenen görsel henüz gelmemiş olabilir: gelince dokuyu yenile.
      card.waitingImage = true;
      img.loading = 'eager';
      img.addEventListener('load', () => {
        card.waitingImage = false;
        if (card.state === 'flat' || !card.mesh) return;
        card.tex = buildTexture(card, card.frame.getBoundingClientRect());
        if (card.body) card.body.sprite = makeSprite(card);
        if (card.ret) card.ret.sprite = makeSprite(card);
        wake();
      }, { once: true });
    }
  }

  function layoutMesh(m, t) {
    const e = easeInOut(t);
    const wr = Math.sin(Math.PI * Math.min(1, t * 1.15)) * Math.min(m.W, m.H) * 0.11;
    const ax = t * 0.55, ay = t * 0.95 * m.spin, az = t * 0.4 * m.spin;
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    for (let k = 0; k < m.count; k++) {
      const x = lerp(m.fx[k], m.tx[k], e) + m.w2[k] * wr * 0.35;
      const y = lerp(m.fy[k], m.ty[k], e) + m.w[k] * wr * 0.2;
      const z = m.tz[k] * e + m.w[k] * wr;
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz;
      const x2 = x1 * cy + z * sy, z2 = -x1 * sy + z * cy;
      const y3 = y1 * cx - z2 * sx, z3 = y1 * sx + z2 * cx;
      m.x[k] = x2; m.y[k] = y3; m.z[k] = z3;
      const p = 1100 / (1100 - z3);
      m.sx[k] = x2 * p; m.sy[k] = y3 * p;
    }
  }

  function texTri(g, tex, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    const mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3;
    const grow = (x, y) => { const dx = x - mx, dy = y - my, l = Math.hypot(dx, dy) || 1; return [x + dx / l * 0.75, y + dy / l * 0.75]; };
    const [a0, b0] = grow(x0, y0), [a1, b1] = grow(x1, y1), [a2, b2] = grow(x2, y2);
    const D = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
    if (Math.abs(D) < 1e-6) return;
    const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / D;
    const b = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / D;
    const c = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / D;
    const d = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / D;
    const e = (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / D;
    const f = (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / D;
    g.save();
    g.beginPath(); g.moveTo(a0, b0); g.lineTo(a1, b1); g.lineTo(a2, b2); g.closePath(); g.clip();
    g.transform(a, b, c, d, e, f);
    g.drawImage(tex, 0, 0);
    g.restore();
  }

  function drawMesh(g, card, t, ox, oy) {
    const m = card.mesh, tex = card.tex, tw = tex.width, th = tex.height;
    layoutMesh(m, t);
    const { faces, depth, order } = m;
    for (let f = 0; f < faces.length; f++) { const [a, b, c] = faces[f]; depth[f] = m.z[a] + m.z[b] + m.z[c]; }
    order.sort((p, q) => depth[p] - depth[q]);
    const shadeK = Math.min(1, t * 2.4);
    for (const f of order) {
      const [a, b, c] = faces[f];
      const ux = m.x[b] - m.x[a], uy = m.y[b] - m.y[a], uz = m.z[b] - m.z[a];
      const vx = m.x[c] - m.x[a], vy = m.y[c] - m.y[a], vz = m.z[c] - m.z[a];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const front = nz >= 0;
      const x0 = ox + m.sx[a], y0 = oy + m.sy[a], x1 = ox + m.sx[b], y1 = oy + m.sy[b], x2 = ox + m.sx[c], y2 = oy + m.sy[c];
      if (front) texTri(g, tex, x0, y0, x1, y1, x2, y2, m.u[a] * tw, m.v[a] * th, m.u[b] * tw, m.v[b] * th, m.u[c] * tw, m.v[c] * th);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath();
      if (!front) { g.fillStyle = PAPER_BACK; g.fill(); }
      const s = front ? 1 : -1;
      const diff = clamp(nx * s * LIGHT[0] + ny * s * LIGHT[1] + nz * s * LIGHT[2], -1, 1);
      if (shadeK > 0.01) {
        g.fillStyle = diff < 0.62 ? `rgba(32,30,26,${((0.62 - diff) * 0.62 * shadeK).toFixed(3)})` : `rgba(255,255,250,${((diff - 0.62) * 0.75 * shadeK).toFixed(3)})`;
        g.fill();
      }
    }
  }

  function makeSprite(card) {
    const S = Math.ceil(card.mesh.R * 2.7);
    const c = document.createElement('canvas'); c.width = Math.ceil(S * dpr); c.height = Math.ceil(S * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMesh(g, card, 1, S / 2, S / 2);
    return { canvas: c, size: S };
  }

  // Buruşma sırasında kağıdın ekrandaki merkezi: görselin ortası, ama top ekranda kalsın diye aşağı itilir.
  function anchor(card, fr, t) {
    const m = card.mesh, e = easeInOut(t);
    const ext = lerp(Math.max(m.W, m.H) / 2, m.R, e);
    const x = fr.left + fr.width / 2, y0 = fr.top + fr.height / 2;
    const yMin = Math.min(vh - ext - 12, ext + 14);
    return { x, y: lerp(y0, Math.max(y0, yMin), smoothstep(0.25, 0.85, t)) };
  }

  // ---------- Durumlar ----------
  function setPaperClass(card, on) { card.el.classList.toggle('is-paper', on); if (!on && card.caption) card.caption.style.opacity = ''; }

  function release(card, pos) {
    const sprite = makeSprite(card);
    const body = { card, x: pos.x, y: pos.y, vx: (Math.random() - 0.5) * 320, vy: -120 - Math.random() * 120, r: card.mesh.R * 0.93, angle: 0, av: (Math.random() - 0.5) * 6, sprite, dragging: false };
    card.body = body; bodies.push(body); card.state = 'ball';
    if (!hintShown) { hintShown = true; hint = { body, until: performance.now() + 4200 }; }
  }

  function removeBody(body) { const i = bodies.indexOf(body); if (i >= 0) bodies.splice(i, 1); if (hoverBall === body) setHover(null); }

  function resetAll() {
    for (const card of cards) { if (card.body) removeBody(card.body); card.body = null; card.ret = null; card.state = 'flat'; setPaperClass(card, false); }
    drag = null; document.documentElement.classList.remove('is-dragging-paper');
  }

  function updateCards(now, listMode) {
    let busy = false;
    for (const card of cards) {
      if (listMode) continue;
      const fr = card.frame.getBoundingClientRect();
      const t = fr.width < 40 ? 0 : clamp((vh * START - fr.bottom) / (vh * SPAN), 0, 1);
      card.t = t; card.fr = fr;
      if (card.state === 'flat') {
        if (t > 0) { prepare(card, fr); card.state = 'paper'; setPaperClass(card, true); }
      } else if (card.state === 'paper') {
        if (t <= 0) { card.state = 'flat'; setPaperClass(card, false); }
        else if (t >= 1) release(card, anchor(card, fr, 1));
      } else if (card.state === 'ball') {
        if (t < 0.96 && !card.body.dragging) {
          card.ret = { x: card.body.x, y: card.body.y, a: card.body.angle, start: now, sprite: card.body.sprite };
          removeBody(card.body); card.body = null; card.state = 'returning';
        }
      } else if (card.state === 'returning') {
        if (now - card.ret.start >= 480) { card.ret = null; card.state = t <= 0 ? 'flat' : 'paper'; if (t <= 0) setPaperClass(card, false); }
      }
      if (card.caption && card.state !== 'flat') card.caption.style.opacity = String(clamp(1 - t * 1.6, 0, 1));
      if (card.state === 'paper' || card.state === 'returning') busy = true;
    }
    return busy;
  }

  // ---------- Fizik ----------
  function physics(dt) {
    const h = 1 / 120;
    let steps = Math.min(8, Math.ceil(dt / h)), moving = false;
    while (steps--) {
      for (const b of bodies) {
        if (b.dragging) continue;
        b.vy += GRAVITY * h; b.x += b.vx * h; b.y += b.vy * h;
        const floor = vh - b.r;
        if (b.y >= floor) {
          b.y = floor;
          if (b.vy > 0) b.vy = b.vy > 90 ? -b.vy * 0.42 : 0;
          b.vx *= 0.986; if (Math.abs(b.vx) < 4) b.vx = 0;
          b.av = b.vx / b.r;
        } else b.av *= 0.999;
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.5; }
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > vw - b.r) { b.x = vw - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
        b.angle += b.av * h;
      }
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), min = a.r + b.r;
        if (dist >= min || dist < 1e-4) continue;
        const nx = dx / dist, ny = dy / dist, overlap = min - dist;
        const wa = a.dragging ? 0 : b.dragging ? 1 : 0.5, wb = b.dragging ? 0 : a.dragging ? 1 : 0.5;
        a.x -= nx * overlap * wa; a.y -= ny * overlap * wa; b.x += nx * overlap * wb; b.y += ny * overlap * wb;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          const imp = -(1.5) * rv;
          a.vx -= imp * nx * wa; a.vy -= imp * ny * wa; b.vx += imp * nx * wb; b.vy += imp * ny * wb;
          a.av += (Math.random() - 0.5) * 2 * wa; b.av += (Math.random() - 0.5) * 2 * wb;
        }
      }
    }
    for (const b of bodies) if (b.dragging || Math.abs(b.vx) > 3 || Math.abs(b.vy) > 3 || b.y < vh - b.r - 0.5) moving = true;
    return moving;
  }

  // ---------- Çizim ----------
  function drawBall(sprite, x, y, angle, r) {
    const shadow = ctx.createRadialGradient(x + 4, y + 7, r * 0.2, x + 4, y + 7, r * 1.15);
    shadow.addColorStop(0, 'rgba(40,40,40,.22)'); shadow.addColorStop(1, 'rgba(40,40,40,0)');
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(x + 4, y + 7, r * 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.drawImage(sprite.canvas, -sprite.size / 2, -sprite.size / 2, sprite.size, sprite.size);
    ctx.restore();
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    for (const card of cards) {
      if (card.state === 'paper' && card.t > 0) { const p = anchor(card, card.fr, card.t); drawMesh(ctx, card, card.t, p.x, p.y); }
      else if (card.state === 'returning') {
        const k = easeInOut(clamp((now - card.ret.start) / 480, 0, 1));
        const p = anchor(card, card.fr, Math.max(card.t, 0.001));
        const a = card.ret.a % (Math.PI * 2), target = Math.abs(a) > Math.PI ? Math.sign(a) * Math.PI * 2 : 0;
        drawBall(card.ret.sprite, lerp(card.ret.x, p.x, k), lerp(card.ret.y, p.y, k), lerp(a, target, k), card.mesh.R);
      }
    }
    for (const b of bodies) drawBall(b.sprite, b.x, b.y, b.angle, b.r);
    if (hint && bodies.includes(hint.body)) {
      const left = hint.until - now;
      if (left > 0) {
        const alpha = Math.min(1, left / 600) * Math.min(1, (4200 - left) / 300);
        const b = hint.body, y = Math.max(28, b.y - b.r - 16);
        ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(250,54,0,${alpha})`;
        ctx.fillText('SÜRÜKLE · FIRLAT ↗', clamp(b.x, 80, vw - 80), y);
        ctx.fillStyle = `rgba(40,40,40,${alpha * 0.7})`;
        ctx.fillText('ÇİFT TIK · PROJEYİ AÇ', clamp(b.x, 80, vw - 80), y + 13);
      } else hint = null;
    }
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.04, (now - last) / 1000); last = now;
    const listMode = grid.classList.contains('list');
    if (listMode && (bodies.length || cards.some(c => c.state !== 'flat'))) resetAll();
    const cardsBusy = updateCards(now, listMode);
    const moving = physics(dt);
    draw(now);
    if (cardsBusy || moving || hint || drag) raf = requestAnimationFrame(tick);
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2); vw = innerWidth; vh = innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`; canvas.style.height = `${vh}px`;
    for (const b of bodies) { b.x = clamp(b.x, b.r, vw - b.r); b.y = Math.min(b.y, vh - b.r); }
    wake();
  }

  // ---------- Etkileşim ----------
  function hit(x, y) {
    for (let i = bodies.length - 1; i >= 0; i--) { const b = bodies[i]; if (Math.hypot(x - b.x, y - b.y) <= b.r * 1.08) return b; }
    return null;
  }
  function setHover(b) {
    if (hoverBall === b) return;
    hoverBall = b;
    document.documentElement.classList.toggle('over-paper-ball', !!b);
    const cursor = typeof customCursor !== 'undefined' ? customCursor : null;
    if (cursor) {
      cursor.classList.toggle('is-hovering', !!b);
      if (b) cursor.querySelector('.cursor-label').textContent = 'FIRLAT';
    }
  }
  function openProject(card) {
    document.body.classList.add('is-transitioning');
    setTimeout(() => { location.href = card.href; }, 430);
  }

  window.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const b = hit(event.clientX, event.clientY);
    if (!b) return;
    event.preventDefault(); event.stopPropagation();
    b.dragging = true; b.vx = b.vy = 0;
    const now = performance.now();
    drag = { b, id: event.pointerId, ox: b.x - event.clientX, oy: b.y - event.clientY, sx: event.clientX, sy: event.clientY, start: now, hist: [{ x: event.clientX, y: event.clientY, t: now }] };
    bodies.splice(bodies.indexOf(b), 1); bodies.push(b); // en üste al
    suppressClick = true;
    document.documentElement.classList.add('is-dragging-paper');
    wake();
  }, { capture: true, passive: false });

  window.addEventListener('touchstart', event => {
    const t = event.touches[0];
    if (t && hit(t.clientX, t.clientY)) event.preventDefault();
  }, { capture: true, passive: false });

  window.addEventListener('pointermove', event => {
    if (drag && drag.id === event.pointerId) {
      const now = performance.now(), b = drag.b;
      const nx = event.clientX + drag.ox, ny = event.clientY + drag.oy;
      b.angle += (nx - b.x) / b.r * 0.5;
      b.x = clamp(nx, b.r, vw - b.r); b.y = Math.min(ny, vh - b.r);
      drag.hist.push({ x: event.clientX, y: event.clientY, t: now });
      while (drag.hist.length > 2 && now - drag.hist[0].t > 90) drag.hist.shift();
      event.preventDefault();
      wake();
      return;
    }
    if (event.pointerType === 'mouse') setHover(hit(event.clientX, event.clientY));
  }, { capture: true, passive: false });

  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const { b, hist, sx, sy, start } = drag, now = performance.now();
    const first = hist[0], lastP = hist[hist.length - 1], span = Math.max(16, lastP.t - first.t);
    const recent = now - lastP.t < 60;
    b.vx = recent ? clamp((lastP.x - first.x) / span * 1000, -3400, 3400) : 0;
    b.vy = recent ? clamp((lastP.y - first.y) / span * 1000, -3400, 3400) : 0;
    b.av = b.vx / b.r * 0.6;
    b.dragging = false; drag = null;
    document.documentElement.classList.remove('is-dragging-paper');
    const tap = Math.hypot(event.clientX - sx, event.clientY - sy) < 6 && now - start < 300;
    if (tap) {
      if (lastTap && lastTap.b === b && now - lastTap.t < 380) { lastTap = null; openProject(b.card); }
      else lastTap = { b, t: now };
    } else lastTap = null;
    setTimeout(() => { suppressClick = false; }, 350);
    wake();
  }
  window.addEventListener('pointerup', endDrag, true);
  window.addEventListener('pointercancel', endDrag, true);
  window.addEventListener('click', event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  window.addEventListener('dblclick', event => { if (hit(event.clientX, event.clientY)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', wake));
  resize();
})();
