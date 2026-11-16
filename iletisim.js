const contactDetails = window.iletisimBilgileri || {};
document.querySelectorAll('[data-contact]').forEach(row => {
  const key = row.dataset.contact;
  const value = String(contactDetails[key] || '').trim();
  if (!value) return;
  const link = document.createElement('a');
  link.className = 'contact-value';
  if (key === 'telefon') {
    const number = value.replace(/[\s().-]/g, '');
    if (!/^\+?\d{7,15}$/.test(number)) return;
    link.href = 'tel:' + number;
    link.textContent = value + ' ↗';
  } else if (key === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    link.href = 'mailto:' + value;
    link.textContent = value + ' ↗';
  } else {
    let url;
    try { url = new URL(value); } catch { return; }
    if (!['https:', 'http:'].includes(url.protocol)) return;
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') + ' ↗';
  }
  row.querySelector('.contact-value').replaceWith(link);
});
