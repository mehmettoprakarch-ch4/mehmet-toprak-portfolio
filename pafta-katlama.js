// Pafta katlama: ana sayfada aşağı kaydırırken proje görselleri, bir mimari pafta gibi
// akordeon şeklinde katlanır; yukarı kaydırınca aynı yoldan geri açılır.
// Yalnızca CSS 3D dönüşümleri kullanılır (canvas yok), katlama doğrudan kaydırmaya bağlıdır.
(() => {
  const grid = document.querySelector('.works-grid');
  if (!grid || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const START = 0.68;               // görselin alt kenarı ekranın %68'ine gelince katlanmaya başlar
  const SPAN = 0.5;                 // ve %18'ine gelince tamamen katlanır
  const MAX_ANGLE = 80 * Math.PI / 180;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const cards = [...grid.querySelectorAll('.work-card')].map(el => ({
    el,
    frame: el.querySelector('.work-image'),
    img: el.querySelector('.work-image>img:not(.work-blueprint)'),
    number: el.querySelector('.work-number')?.textContent.trim() || '',
    t: 0,
    fold: null
  })).filter(card => card.frame && card.img);

  function build(card) {
    const { frame, img } = card;
    const W = frame.clientWidth, H = frame.clientHeight;
    const N = W > 520 ? 6 : 4, w = W / N;
    const style = getComputedStyle(img), frameBg = getComputedStyle(frame).backgroundColor;
    const bg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? style.backgroundColor : frameBg;
    const layer = document.createElement('div');
    layer.className = 'fold-layer';
    layer.setAttribute('aria-hidden', 'true');
    const panels = [];
    for (let i = 0; i < N; i++) {
      const panel = document.createElement('div');
      panel.className = 'fold-panel';
      panel.style.width = `${Math.ceil(w) + 1}px`;
      panel.style.height = `${H}px`;
      panel.style.background = bg;
      const copy = document.createElement('img');
      copy.src = img.currentSrc || img.src;
      copy.alt = '';
      copy.decoding = 'async';
      Object.assign(copy.style, {
        left: `${img.offsetLeft - i * w}px`, top: `${img.offsetTop}px`,
        width: `${img.offsetWidth}px`, height: `${img.offsetHeight}px`,
        objectFit: style.objectFit, objectPosition: style.objectPosition,
        padding: style.padding, boxSizing: style.boxSizing
      });
      panel.append(copy);
      layer.append(panel);
      panels.push(panel);
    }
    const stamp = document.createElement('span');
    stamp.className = 'fold-stamp';
    stamp.innerHTML = `PAFTA ${card.number}<br>KATLANDI`;
    layer.append(stamp);
    frame.append(layer);
    card.fold = { layer, panels, stamp, W, H, w, N };
  }

  function destroy(card) {
    card.fold?.layer.remove();
    card.fold = null;
    card.el.classList.remove('is-folding');
    card.t = 0;
  }

  function paint(card, t) {
    if (!card.fold) build(card);
    const { layer, panels, stamp, W, w } = card.fold;
    const e = smooth(0, 1, t);
    const angle = MAX_ANGLE * e, c = Math.cos(angle), s = Math.sin(angle);
    const offset = (W - W * c) / 2; // katlanan pafta ortada kalsın
    panels.forEach((panel, i) => {
      const odd = i % 2 === 1;
      panel.style.transform = `translate3d(${(offset + i * w * c).toFixed(2)}px,0,${odd ? (-w * s).toFixed(2) : 0}px) rotateY(${odd ? -angle : angle}rad)`;
      panel.style.setProperty('--shade', (Math.sqrt(s) * (odd ? 0.32 : 0.55)).toFixed(3));
    });
    const settle = smooth(0.62, 1, t);
    layer.style.transform = settle ? `translateY(${(-settle * 10).toFixed(1)}px) rotate(${(-2.5 * settle).toFixed(2)}deg)` : '';
    stamp.style.opacity = smooth(0.7, 0.95, t).toFixed(2);
  }

  let pending = false;
  function update() {
    pending = false;
    const vh = innerHeight, listMode = grid.classList.contains('list');
    for (const card of cards) {
      let t = 0;
      if (!listMode) {
        const rect = card.frame.getBoundingClientRect();
        if (rect.bottom > -vh && rect.top < vh * 2) t = clamp((vh * START - rect.bottom) / (vh * SPAN), 0, 1);
        else t = rect.bottom <= -vh ? 1 : 0;
      }
      if (Math.abs(t - card.t) < 0.001) continue;
      card.t = t;
      const folding = t > 0;
      card.el.classList.toggle('is-folding', folding);
      if (folding) paint(card, t);
    }
  }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { cards.forEach(destroy); schedule(); }, { passive: true });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { cards.forEach(destroy); schedule(); }));
  schedule();
})();
