const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('has-js');
let cursorTrailCanvas = null;
let customCursor = null;
let coordinateGuides = null;
let draftingOverlay = null;
let isDraftingSelection = false;
function placePointerTools(container) {
  if (cursorTrailCanvas) container.append(cursorTrailCanvas);
  if (coordinateGuides) container.append(coordinateGuides);
  if (draftingOverlay) container.append(draftingOverlay);
  if (customCursor) container.append(customCursor);
}

const projectCatalog = [
  ['01','Perşembe Pazarı','MİMARİ PROJE','projeler/persembe-pazari.html'],
  ['02','Fatih Öğrenci Yurdu','MİMARİ PROJE','projeler/fatih-ogrenci-yurdu.html'],
  ['03','Kuzguncuk Kitap Kafe','UYGULAMA PROJESİ','projeler/kuzguncuk-kitap-kafe.html'],
  ['04','Baumit Yarışması','TASARIM YARIŞMASI','projeler/baumit-yarisma.html'],
  ['05','Pencere Detayları','YAPI DERSİ','projeler/pencere-detaylari.html'],
  ['06','Bina Yapım 1','YAPI DERSİ','projeler/bina-yapim-1.html'],
  ['07','Mimarlık Ofisi','EKİP ÇALIŞMASI','projeler/bina-yapim-2-ofis.html'],
  ['08','MDC25 Yarışması','TASARIM YARIŞMASI','projeler/mdc25-yarisma.html'],
  ['09','3B Yerleşim Tasarımı','3B TASARIM','projeler/3b-yerlesim-tasarimi.html'],
  ['10','Mimari Fotoğraflar','FOTOĞRAF','projeler/mimari-fotograflar.html'],
  ['11','NOCTUART Görsel Kimlik','GRAFİK TASARIM','projeler/noctuart-grafik-tasarim.html']
];
const rootPrefix = location.pathname.includes('/projeler/') ? '../' : '';
const menuTrigger = document.querySelector('.menu-open');
if (menuTrigger) {
  const menu = document.createElement('dialog');
  menu.className = 'site-menu';
  menu.id = 'site-menu';
  menu.setAttribute('aria-label', 'Çalışma indeksi');
  const inner = document.createElement('div'); inner.className = 'site-menu-inner';
  const top = document.createElement('div'); top.className = 'site-menu-top';
  const brand = document.createElement('a'); brand.className = 'menu-brand'; brand.href = `${rootPrefix}index.html`; brand.innerHTML = 'MEHMET TOPRAK <span>/</span> STUDIO INDEX';
  const close = document.createElement('button'); close.type = 'button'; close.className = 'site-menu-close'; close.innerHTML = 'KAPAT <b aria-hidden="true">×</b>';
  top.append(brand, close);
  const intro = document.createElement('div'); intro.className = 'site-menu-intro';
  const introNote = document.createElement('p'); introNote.innerHTML = 'SEÇKİ / 2023—2026<br>MİMARİ · GRAFİK · FOTOĞRAF';
  const introTitle = document.createElement('h2'); introTitle.innerHTML = 'Çalışma<br>indeksi<span>↘</span>';
  intro.append(introNote, introTitle);
  const list = document.createElement('nav'); list.className = 'site-menu-list'; list.setAttribute('aria-label','Projeler');
  projectCatalog.forEach(([number,title,kind,href]) => {
    const link = document.createElement('a'); link.className = 'menu-item'; link.href = rootPrefix + href; link.dataset.cursorLabel = `AÇ / ${number}`;
    const n = document.createElement('span'); n.textContent = number;
    const name = document.createElement('strong'); name.textContent = title;
    const type = document.createElement('small'); type.textContent = kind;
    const arrow = document.createElement('i'); arrow.setAttribute('aria-hidden','true'); arrow.textContent = '↗';
    link.append(n, name, type, arrow); list.append(link);
  });
  const bottom = document.createElement('div'); bottom.className = 'site-menu-bottom';
  const bottomNote = document.createElement('span'); bottomNote.textContent = 'MEHMET TOPRAK / İSTANBUL';
  const bottomYear = document.createElement('span'); bottomYear.textContent = 'MİMARLIK PORTFOLYOSU · 2026';
  const bottomContact = document.createElement('a'); bottomContact.href = `${rootPrefix}iletisim.html`; bottomContact.textContent = 'İLETİŞİM ↗';
  bottom.append(bottomNote,bottomYear,bottomContact); inner.append(top,intro,list,bottom); menu.append(inner); document.body.append(menu);
  menuTrigger.addEventListener('click', () => { menu.showModal(); placePointerTools(menu); menuTrigger.setAttribute('aria-expanded','true'); });
  close.addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => { placePointerTools(document.body); menuTrigger.setAttribute('aria-expanded','false'); menuTrigger.focus(); });
  menu.addEventListener('click', event => { if (event.target === menu) menu.close(); });
}

const lineTransition = document.createElement('div');
lineTransition.className = 'line-transition'; lineTransition.setAttribute('aria-hidden','true');
lineTransition.innerHTML = '<span></span><span></span><span></span>';
document.body.append(lineTransition);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || reducedMotion || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin || destination.pathname === location.pathname || destination.hash && destination.pathname === location.pathname) return;
  event.preventDefault(); document.body.classList.add('is-transitioning');
  window.setTimeout(() => { location.href = destination.href; }, 430);
});
const gallery = document.querySelector('.works-grid');
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  if (!gallery) return;
  gallery.classList.toggle('list', button.dataset.view === 'list');
  document.querySelectorAll('[data-view]').forEach(control => { control.classList.toggle('active', control === button); control.setAttribute('aria-pressed', String(control === button)); });
}));

const projectHeading = document.querySelector('.project-heading');
const projectFactRows = [...document.querySelectorAll('.project-overview dl > div')].slice(0,3);
if (projectHeading && projectFactRows.length) {
  const facts = document.createElement('div'); facts.className = 'project-quick-facts'; facts.setAttribute('aria-label','Proje bilgileri');
  projectFactRows.forEach(row => {
    const item = document.createElement('div'); item.className = 'project-quick-fact';
    const label = document.createElement('span'); label.textContent = row.querySelector('dt')?.textContent || '';
    const value = document.createElement('span'); value.textContent = row.querySelector('dd')?.textContent || '';
    item.append(label,value); facts.append(item);
  });
  projectHeading.after(facts);
}

const lightbox = document.querySelector('#lightbox');
if (lightbox) {
  const images = [...document.querySelectorAll('.zoom-image')];
  const largeImage = lightbox.querySelector('img');
  let selected = 0, opener, zoom = 1, panX = 0, panY = 0, pointerStart = null, moved = false;
  lightbox.classList.add('lightbox');
  function paintZoom() {
    largeImage.style.setProperty('--image-zoom', zoom);
    largeImage.style.setProperty('--pan-x', `${panX}px`);
    largeImage.style.setProperty('--pan-y', `${panY}px`);
    lightbox.classList.toggle('is-zoomed', zoom > 1.01);
  }
  function resetZoom() { zoom = 1; panX = 0; panY = 0; pointerStart = null; largeImage.classList.remove('is-dragging'); paintZoom(); }
  function clampPan() {
    const fit = Math.min(largeImage.clientWidth / (largeImage.naturalWidth || 1), largeImage.clientHeight / (largeImage.naturalHeight || 1));
    const maxX = Math.max(0, (largeImage.naturalWidth * fit * zoom - largeImage.clientWidth) / 2);
    const maxY = Math.max(0, (largeImage.naturalHeight * fit * zoom - largeImage.clientHeight) / 2);
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
    paintZoom();
  }
  function show(index) {
    selected = (index + images.length) % images.length;
    const source = images[selected];
    resetZoom();
    largeImage.src = source.dataset.image;
    largeImage.alt = source.dataset.caption;
    lightbox.querySelector('p').textContent = `${selected + 1} / ${images.length} · ${source.dataset.caption} · TEKERLEKLE YAKINLAŞTIR`;
  }
  images.forEach((button,index) => button.addEventListener('click', () => { opener = button; show(index); lightbox.showModal(); placePointerTools(lightbox); document.body.classList.add('modal-open'); }));
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(selected - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(selected + 1));
  lightbox.addEventListener('close', () => { placePointerTools(document.body); document.body.classList.remove('modal-open'); resetZoom(); opener?.focus(); });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { event.preventDefault(); show(selected + 1); } if (event.key === 'ArrowLeft') { event.preventDefault(); show(selected - 1); } });
  lightbox.addEventListener('wheel', event => {
    if (event.target !== largeImage) return;
    event.preventDefault();
    zoom = Math.min(5, Math.max(1, zoom * Math.exp(-event.deltaY * .0012)));
    if (zoom <= 1.01) { zoom = 1; panX = 0; panY = 0; }
    clampPan();
  }, {passive:false});
  largeImage.addEventListener('load', () => { if (zoom > 1) clampPan(); });
  largeImage.addEventListener('click', event => {
    const touchActivation = event.pointerType === 'touch' || (!('pointerType' in event) && matchMedia('(pointer:coarse)').matches);
    if (!touchActivation) return;
    if (moved) { moved = false; return; }
    zoom = zoom > 1.01 ? 1 : 2;
    if (zoom === 1) panX = panY = 0;
    clampPan();
  });
  largeImage.addEventListener('pointerdown', event => {
    if (isDraftingSelection || zoom <= 1.01 || event.button !== 0) return;
    event.preventDefault();
    pointerStart = {x:event.clientX,y:event.clientY,panX,panY,id:event.pointerId};
    moved = false;
    largeImage.setPointerCapture(event.pointerId);
    largeImage.classList.add('is-dragging');
    customCursor?.classList.add('is-panning');
  });
  largeImage.addEventListener('pointermove', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    panX = pointerStart.panX + dx; panY = pointerStart.panY + dy;
    clampPan();
  });
  const stopPan = event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    pointerStart = null;
    largeImage.classList.remove('is-dragging');
    customCursor?.classList.remove('is-panning');
  };
  largeImage.addEventListener('pointerup', stopPan);
  largeImage.addEventListener('pointercancel', stopPan);
}

if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = [...document.querySelectorAll('[data-reveal],.manifest,.process-band,.project-page .story-row,.project-page .drawing-section')];
  revealTargets.forEach((element,index) => { if (element.matches('.work-card')) element.style.setProperty('--reveal-delay', `${(index % 3) * 75}ms`); });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .12, rootMargin: '0px 0px -4% 0px' });
  revealTargets.forEach(element => observer.observe(element));
} else {
  document.querySelectorAll('[data-reveal],.manifest,.process-band,.project-page .story-row,.project-page .drawing-section').forEach(element => element.classList.add('is-revealed'));
}

const heroArt = document.querySelector('.hero-art');
if (heroArt && !reducedMotion && matchMedia('(pointer:fine) and (hover:hover)').matches) {
  heroArt.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') { heroArt.style.setProperty('--reveal-radius','116px'); heroArt.style.setProperty('--plan-radius','205px'); } });
  heroArt.addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return; const box = heroArt.getBoundingClientRect(); heroArt.style.setProperty('--pointer-x', `${event.clientX - box.left}px`); heroArt.style.setProperty('--pointer-y', `${event.clientY - box.top}px`); });
  heroArt.addEventListener('pointerleave', () => { heroArt.style.setProperty('--reveal-radius','0px'); heroArt.style.setProperty('--plan-radius','0px'); });
}

const heroStage = document.querySelector('.hero-stage');
const parallaxImages = reducedMotion ? [] : [...document.querySelectorAll('.work-image>img:not(.work-blueprint),.project-cover img,.story-row img,.drawing-grid img')];
let scrollPending = false;
function paintScrollScene() {
  scrollPending = false;
  if (reducedMotion) return;
  if (heroStage) {
    const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * .9)));
    heroStage.style.transform = `translate3d(0,${-progress * 26}px,0) scale(${1 - progress * .025})`;
  }
  for (const image of parallaxImages) {
    const frame = image.closest('.work-image,.zoom-image') || image;
    const bounds = frame.getBoundingClientRect();
    if (bounds.bottom < -80 || bounds.top > innerHeight + 80) { image.style.setProperty('--parallax-y','0px'); continue; }
    const offset = Math.min(14, Math.max(-14, (innerHeight / 2 - (bounds.top + bounds.height / 2)) * .018));
    image.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
  }
}
window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(paintScrollScene); } }, { passive:true });
window.addEventListener('resize', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(paintScrollScene); } }, { passive:true });
paintScrollScene();

const finePointer = !reducedMotion && matchMedia('(pointer:fine) and (hover:hover)').matches;
if (finePointer) {
  document.body.classList.add('has-custom-cursor');
  const canvas = cursorTrailCanvas = document.createElement('canvas'); canvas.id = 'cursor-trail'; canvas.setAttribute('aria-hidden','true');
  const guides = coordinateGuides = document.createElement('div'); guides.className = 'coordinate-guides'; guides.setAttribute('aria-hidden','true');
  guides.innerHTML = '<span class="coordinate-guide-x"></span><span class="coordinate-guide-y"></span>';
  const selection = draftingOverlay = document.createElement('div'); selection.className = 'draft-selection'; selection.setAttribute('aria-hidden','true');
  selection.innerHTML = '<span class="draft-selection-size"></span>';
  const cursor = customCursor = document.createElement('div'); cursor.className = 'architecture-cursor'; cursor.setAttribute('aria-hidden','true');
  cursor.innerHTML = '<span class="cursor-horizontal"></span><span class="cursor-vertical"></span><span class="cursor-center"></span><span class="cursor-tick"></span><span class="cursor-tick cursor-tick-b"></span><span class="cursor-label">İNCELE</span><span class="cursor-measure">X 00% · Y 00%</span>';
  document.body.append(canvas,guides,selection,cursor);
  const ctx = canvas.getContext('2d'); let ratio = Math.min(window.devicePixelRatio || 1, 2); let points = []; let frame = 0; let pointer = { x: innerWidth/2, y: innerHeight/2 };
  const measure = cursor.querySelector('.cursor-measure');
  const selectionSize = selection.querySelector('.draft-selection-size');
  let draft = null, firstPress = null, lastRelease = null, fadeTimer = 0, hideTimer = 0, suppressDraftClick = false;
  const clamp = (value, max) => Math.min(max, Math.max(0, value));
  function clearDraft() {
    clearTimeout(fadeTimer); clearTimeout(hideTimer);
    draft = null; firstPress = null; lastRelease = null; isDraftingSelection = false; suppressDraftClick = false;
    selection.classList.remove('is-visible','is-fading');
    cursor.classList.remove('is-drafting');
  }
  function paintDraft(x,y) {
    const left = Math.min(draft.x,x), top = Math.min(draft.y,y);
    const width = Math.abs(x-draft.x), height = Math.abs(y-draft.y);
    selection.style.left = `${left}px`; selection.style.top = `${top}px`;
    selection.style.width = `${width}px`; selection.style.height = `${height}px`;
    selectionSize.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    draft.moved ||= width + height > 5;
  }
  function finishDraft(event) {
    if (!draft || event.pointerId !== draft.id) {
      if (firstPress?.id === event.pointerId) {
        const distance = Math.hypot(event.clientX-firstPress.x,event.clientY-firstPress.y);
        lastRelease = distance < 6 ? { x:event.clientX, y:event.clientY, time:performance.now(), target:firstPress.target } : null;
        firstPress = null;
      }
      return;
    }
    const moved = draft.moved;
    draft = null; isDraftingSelection = false;
    cursor.classList.remove('is-drafting');
    if (!moved) { clearDraft(); return; }
    fadeTimer = setTimeout(() => {
      selection.classList.add('is-fading');
      hideTimer = setTimeout(() => selection.classList.remove('is-visible','is-fading'), 300);
    }, 650);
    setTimeout(() => { suppressDraftClick = false; }, 400);
  }
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest?.('a,button,input,textarea,select,[contenteditable="true"]')) { firstPress = null; lastRelease = null; return; }
    const secondPress = lastRelease && performance.now()-lastRelease.time < 600 && lastRelease.target === event.target && Math.hypot(event.clientX-lastRelease.x,event.clientY-lastRelease.y) < 12;
    if (!secondPress) { firstPress = { id:event.pointerId, x:event.clientX, y:event.clientY, target:event.target }; return; }
    clearDraft();
    draft = { id:event.pointerId, x:clamp(event.clientX,innerWidth), y:clamp(event.clientY,innerHeight), moved:false };
    isDraftingSelection = true; suppressDraftClick = true;
    paintDraft(draft.x,draft.y);
    selection.classList.add('is-visible');
    cursor.classList.add('is-drafting');
    event.preventDefault();
  },true);
  document.addEventListener('click', event => {
    if (!suppressDraftClick || event.detail < 2) return;
    suppressDraftClick = false;
    event.preventDefault(); event.stopImmediatePropagation();
  },true);
  window.addEventListener('pointerup', finishDraft,true);
  window.addEventListener('pointercancel', event => { if (draft?.id === event.pointerId) clearDraft(); },true);
  window.addEventListener('blur', clearDraft);
  function resizeCanvas() { ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio); canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio,0,0,ratio,0,0); }
  resizeCanvas(); window.addEventListener('resize',resizeCanvas,{passive:true});
  function drawTrail(now) {
    frame = 0; ctx.clearRect(0,0,innerWidth,innerHeight); cursor.style.left = `${pointer.x}px`; cursor.style.top = `${pointer.y}px`;
    points = points.filter(point => now - point.time < 560);
    for (let i = 1; i < points.length; i++) { const a = points[i-1], b = points[i]; const age = (now - b.time) / 560; const alpha = Math.max(0,1-age); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineWidth = 1.4 + alpha * .6; ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(250,54,0,${alpha * .78})`; ctx.stroke(); }
    if (points.length > 1) frame = requestAnimationFrame(drawTrail);
  }
  function wakeTrail(event) { pointer.x = event.clientX; pointer.y = event.clientY; points.push({x:pointer.x,y:pointer.y,time:performance.now()}); if (points.length > 32) points.shift(); if (!frame) frame = requestAnimationFrame(drawTrail); }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    wakeTrail(event);
    guides.style.setProperty('--guide-x', `${event.clientX}px`);
    guides.style.setProperty('--guide-y', `${event.clientY}px`);
    guides.classList.add('is-visible');
    if (draft?.id === event.pointerId) paintDraft(clamp(event.clientX,innerWidth),clamp(event.clientY,innerHeight));
    const measuringFrame = event.target.closest?.('.hero-art,.work-image,.zoom-image,.story-row figure,.drawing-grid figure,#lightbox > img');
    if (measuringFrame) {
      const rect = measuringFrame.getBoundingClientRect();
      const x = Math.min(100,Math.max(0,Math.round((event.clientX - rect.left) / rect.width * 100)));
      const y = Math.min(100,Math.max(0,Math.round((event.clientY - rect.top) / rect.height * 100)));
      measure.textContent = `X ${String(x).padStart(2,'0')}% · Y ${String(y).padStart(2,'0')}%`;
    } else measure.textContent = `X ${String(Math.round(event.clientX)).padStart(3,'0')} · Y ${String(Math.round(event.clientY)).padStart(3,'0')}`;
  },{passive:true});
  document.addEventListener('pointerleave', () => guides.classList.remove('is-visible'));
  window.addEventListener('blur', () => guides.classList.remove('is-visible'));
  const hoverTargets = document.querySelectorAll('a,button,.zoom-image');
  hoverTargets.forEach(element => {
    element.addEventListener('pointerenter', () => { cursor.classList.add('is-hovering'); const label = element.dataset.cursorLabel || (element.classList.contains('menu-open') ? 'İNDEKS' : element.classList.contains('zoom-image') ? 'BÜYÜT' : 'AÇ'); cursor.querySelector('.cursor-label').textContent = label; });
    element.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
  });
  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('pointermove', event => { const rect = card.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - .5; const y = (event.clientY - rect.top) / rect.height - .5; card.style.setProperty('--tilt-x', `${x * 2.3}deg`); card.style.setProperty('--tilt-y', `${-y * 2.3}deg`); });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--tilt-x','0deg'); card.style.setProperty('--tilt-y','0deg'); });
  });
}

const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.topbar nav a').forEach(link => { const file = new URL(link.href).pathname.split('/').pop(); if (file === currentFile) link.setAttribute('aria-current','page'); });
