'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app'), go = h => { location.hash = h; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hl = s => esc(s).replace(/\*(.+?)\*/g, '<mark>$1</mark>'), plain = s => String(s).replace(/\*/g, '');
const pick = a => a[Math.floor(Math.random() * a.length)];
async function api(m, u, b) {
  const r = await fetch('/api' + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: m === 'GET' ? undefined : JSON.stringify(b || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Something went wrong'), { status: r.status });
  return d;
}
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3400); };
const speak = t => { if (!('speechSynthesis' in window)) return toast('Read aloud is not supported in this browser'); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = .9; u.lang = 'en-ZA'; speechSynthesis.speak(u); };

// ---------- icon set (inline SVG, no emojis) ----------
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', book: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 5v15"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>', calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2M16 12v4"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>', flask: '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/><path d="M7 15h10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>', compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.6-1.4.4-2.8 2-2.8H18a3 3 0 0 0 3-3C21 7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.200 9.500l6.100-.9z"/>', flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4"/><path d="M12 13v4M8 21h8M10 17h4"/>', medal: '<circle cx="12" cy="9" r="5"/><path d="M9 13.500L7 21l5-3 5 3-2-7.500"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V4a3 3 0 0 0-3 0z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  access: '<circle cx="12" cy="4.500" r="1.800"/><path d="M5 8l7 1.500L19 8M12 9.500V14l-3 6M12 14l3 6"/>', volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>',
  check: '<path d="M4 12l5 5L20 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', play: '<path d="M7 4l13 8-13 8z"/>',
  users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0"/><circle cx="17" cy="9" r="2.500"/><path d="M17 14a5 5 0 0 1 5 5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/>', calendar: '<rect x="3.500" y="5" width="17" height="16" rx="2"/><path d="M3.500 10h17M8 3v4M16 3v4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.500c.7.7 1 1.500 1 2.500h6c0-1 .3-1.800 1-2.500A6 6 0 0 0 12 3z"/>', music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', sparkles: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/><path d="M19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>', printer: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>', rocket: '<path d="M12 3c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="10" r="1.800"/><path d="M9 16l-2 5 5-2M15 16l2 5-5-2"/>',
  football: '<circle cx="12" cy="12" r="9"/><path d="M12 8l3.500 2.500-1.300 4H9.800l-1.300-4z"/><path d="M12 3v5M15.500 10.500L20 9M14.200 14.500l2.800 3.500M9.800 14.500L7 18M8.500 10.500L4 9"/>',
  netball: '<circle cx="12" cy="12" r="9"/><path d="M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14M3 12h18"/>', paw: '<circle cx="7" cy="10" r="1.800"/><circle cx="11" cy="6.500" r="1.800"/><circle cx="16" cy="7" r="1.800"/><circle cx="19" cy="11.500" r="1.800"/><path d="M12 12c-3 0-6 4-5 6.500 1 2 3.500 1.200 5 1.200s4 .8 5-1.200c1-2.500-2-6.500-5-6.500z"/>',
  gamepad: '<rect x="2.500" y="7" width="19" height="11" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1"/><circle cx="18.500" cy="13.500" r="1"/>', planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.500" transform="rotate(-20 12 12)"/>',
  bone: '<path d="M5 6a2 2 0 1 1 3-1.500l9 9a2 2 0 1 1 1.500 3 2 2 0 1 1-3 1.500l-9-9A2 2 0 1 1 5 6z"/>', car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 12h16"/><circle cx="8" cy="17" r="1.500"/><circle cx="16" cy="17" r="1.500"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4.500 4.500 0 0 0 8 0M9 9.500h.01M15 9.500h.01"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', grid: '<rect x="3" y="3" width="8" height="8" rx="1.500"/><rect x="13" y="3" width="8" height="8" rx="1.500"/><rect x="3" y="13" width="8" height="8" rx="1.500"/><rect x="13" y="13" width="8" height="8" rx="1.500"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>', book2: '<path d="M5 4h14v16H5z"/><path d="M9 4v16M12 9h4"/>',
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.star}</svg>`;
const SUBJ_ICON = { book: 'book', chat: 'chat', calculator: 'calculator', heart: 'heart', flask: 'flask', globe: 'globe', cog: 'cog', coins: 'coins', compass: 'compass', palette: 'palette' };
const INTERESTS = [['Football', 'football'], ['Netball', 'netball'], ['Music', 'music'], ['Animals', 'paw'], ['Art', 'palette'], ['Gaming', 'gamepad'], ['Space', 'planet'], ['Dinosaurs', 'bone'], ['Cars', 'car']];
const STAGE_ICON = ['sprout', 'sprout', 'star', 'planet', 'globe'].map(n => n === 'sprout' ? 'activity' : n);

// ---------- encouragement ----------
const PRAISE = ['Great focus!', 'You are doing amazingly!', 'Brilliant thinking!', 'Keep going, explorer!', 'Your brain is growing stronger!', 'Fantastic effort!', 'You are a star learner!', 'Nice work, keep it up!'];
const BOOST = ['Every small step moves you closer to the stars.', 'Mistakes help your brain grow. Keep exploring!', 'You are braver than you think and smarter than you know.', 'Today is a great day to learn something new.', 'Learning at your own pace is a superpower.'];
const IDLE_MSG = ['Still with us, explorer? Take a deep breath and stretch your arms. Your progress is saved, and we will be here when you are ready.', 'It looks like you drifted off for a moment. That is okay! Wiggle your fingers, sip some water and jump back in.'];

// ---------- preferences and accessibility ----------
const DEF = { textSize: 1, dyslexia: false, focus: false, calm: false, tts: false, spacing: false, colorblind: 'none' };
let me = null, prefs = { ...DEF, ...JSON.parse(localStorage.getItem('lv_prefs') || '{}') };
function applyPrefs() {
  const r = document.documentElement; r.style.fontSize = 16 * prefs.textSize + 'px';
  Object.assign(r.dataset, { dys: prefs.dyslexia, focus: prefs.focus, calm: prefs.calm, sp: prefs.spacing, cb: prefs.colorblind });
  localStorage.setItem('lv_prefs', JSON.stringify(prefs));
}
const savePrefs = () => { applyPrefs(); if (me?.role === 'learner') api('PUT', '/me/profile', { prefs }).catch(() => {}); };
const a11yHTML = () => `<div class="field"><label for="a-size">Text size</label><input id="a-size" type="range" min="0.9" max="1.6" step="0.1" value="${prefs.textSize}"></div>
${[['dyslexia', 'Dyslexia-friendly text'], ['spacing', 'Extra line spacing'], ['focus', 'Focus mode (one thing at a time)'], ['calm', 'Calm mode (no animation, sensory-friendly)'], ['tts', 'Read lessons aloud automatically']].map(([k, l]) => `<label class="check"><input type="checkbox" data-k="${k}" ${prefs[k] ? 'checked' : ''}> ${l}</label>`).join('')}
<div class="field" style="margin-top:12px"><label for="a-cb">Colour vision</label><select id="a-cb">${[['none', 'Standard colours'], ['deut', 'Red-green (deuteranopia)'], ['prot', 'Red-green (protanopia)'], ['trit', 'Blue-yellow (tritanopia)']].map(([v, l]) => `<option value="${v}" ${prefs.colorblind === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
function bindA11y(root) {
  $('#a-size', root).oninput = e => { prefs.textSize = +e.target.value; savePrefs(); };
  $('#a-cb', root).onchange = e => { prefs.colorblind = e.target.value; savePrefs(); };
  $$('[data-k]', root).forEach(c => c.onchange = () => { prefs[c.dataset.k] = c.checked; savePrefs(); });
}
function a11yPanel() {
  $('#a11y').innerHTML = `<button class="btn fab" id="fab" aria-label="Accessibility settings" aria-expanded="false">${ic('access', 26)}</button><div class="card panel" id="pnl" role="dialog" aria-label="Accessibility settings" hidden><h3>Make Learniverse comfortable</h3>${a11yHTML()}<button class="btn ghost sm" id="rst">Reset</button></div>`;
  bindA11y($('#pnl'));
  $('#fab').onclick = () => { const p = $('#pnl'); p.hidden = !p.hidden; $('#fab').setAttribute('aria-expanded', !p.hidden); };
  $('#rst').onclick = () => { prefs = { ...DEF }; savePrefs(); a11yPanel(); };
}

// ---------- Google Translate (all 11 official languages) ----------
const LANGS = [['en', 'English'], ['af', 'Afrikaans'], ['zu', 'isiZulu'], ['xh', 'isiXhosa'], ['nso', 'Sepedi'], ['tn', 'Setswana'], ['st', 'Sesotho'], ['ts', 'Xitsonga'], ['ss', 'siSwati'], ['ve', 'Tshivenda'], ['nr', 'isiNdebele']];
const langHTML = () => `<label class="sr" style="position:absolute;left:-9999px" for="lang">Language</label><select class="lang notranslate" id="lang" translate="no" aria-label="Language">${LANGS.map(([c, n]) => `<option value="${c}" ${localStorage.getItem('lv_lang') === c ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
let translateTimer = null, translateObserver = null, translateRefresh = null;
function applyTranslateLanguage(attempt = 0) {
  const code = localStorage.getItem('lv_lang') || 'en';
  if (code === 'en') return true;
  const c = $('.goog-te-combo');
  if (c) { c.value = code; c.dispatchEvent(new Event('change')); return true; }
  if (attempt < 40) {
    clearTimeout(translateTimer);
    translateTimer = setTimeout(() => applyTranslateLanguage(attempt + 1), 250);
    return false;
  }
  toast('Google Translate could not be loaded. Check your connection and try again.');
  return false;
}
function setLang(code) {
  localStorage.setItem('lv_lang', code);
  if (code === 'en') { ['', ';domain=' + location.hostname].forEach(d => { document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + d; }); return location.reload(); }
  clearTimeout(translateTimer);
  applyTranslateLanguage();
}
function initTranslate() {
  window.googleTranslateElementInit = () => {
    new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: LANGS.map(l => l[0]).join(','), autoDisplay: false }, 'gt');
    if ((localStorage.getItem('lv_lang') || 'en') !== 'en') applyTranslateLanguage();
  };
  const s = document.createElement('script'); s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; s.async = true;
  s.onerror = () => { if ((localStorage.getItem('lv_lang') || 'en') !== 'en') toast('Google Translate could not be loaded. Check your connection and try again.'); };
  document.head.appendChild(s);
  translateObserver = new MutationObserver(() => {
    if ((localStorage.getItem('lv_lang') || 'en') === 'en') return;
    clearTimeout(translateRefresh);
    translateRefresh = setTimeout(() => applyTranslateLanguage(), 150);
  });
  translateObserver.observe(app, { childList: true });
}
document.addEventListener('change', e => { if (e.target.id === 'lang') setLang(e.target.value); });

// ---------- motion: stars, reveal, count-up, confetti, idle detection ----------
(function stars() {
  const c = $('#stars'), x = c.getContext('2d'); let S = [];
  const size = () => { c.width = innerWidth; c.height = innerHeight; S = Array.from({ length: Math.min(170, innerWidth / 8) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.4 + .3, p: Math.random() * 6 })); };
  size(); addEventListener('resize', size);
  (function f(t) { if (document.documentElement.dataset.calm !== 'true') { x.clearRect(0, 0, c.width, c.height); S.forEach(s => { x.globalAlpha = .45 + .5 * Math.sin(t / 900 + s.p); x.fillStyle = '#fff'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); }); } requestAnimationFrame(f); })(0);
})();
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.rv').forEach(el => io.observe(el));
  $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); });
}
function confetti() {
  if (prefs.calm || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c); const x = c.getContext('2d');
  const cols = ['#ffb703', '#22c7e8', '#6d5dfc', '#2ecc71', '#ff6b9d'], ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3, s: Math.random() * 7 + 4, c: pick(cols), r: Math.random() * 6 }));
  let f = 0; (function d() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 110) requestAnimationFrame(d); else c.remove(); })();
}
let idleT = null, idleH = null, qTimer = null;
function stopIdle() { clearTimeout(idleT); clearInterval(qTimer); if (idleH) ['pointermove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(e => removeEventListener(e, idleH)); idleH = null; }
function watchIdle(ms = 45000) { // gentle "are you still there?" popup when nothing moves on screen
  stopIdle();
  idleH = () => { clearTimeout(idleT); idleT = setTimeout(showIdle, ms); };
  ['pointermove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(e => addEventListener(e, idleH, { passive: true })); idleH();
}
function showIdle() {
  if ($('#idle')) return; const msg = pick(IDLE_MSG);
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="idle" role="alertdialog" aria-labelledby="idt" aria-describedby="idd"><div class="card pop"><div class="ibox">${ic('bell', 32)}</div><h2 id="idt">Time for a quick check-in</h2><p id="idd" class="muted">${msg}</p><button class="btn" id="back">I am back, let's go</button></div></div>`);
  if (prefs.tts) speak(msg); $('#back').focus(); $('#back').onclick = () => { $('#idle').remove(); if ('speechSynthesis' in window) speechSynthesis.cancel(); idleH && idleH(); toast(pick(PRAISE)); };
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && idleH) toast('Welcome back, explorer!'); });

// ---------- public site ----------
// ---------- buddies and image fallbacks (drop your own images in assets/buddies, assets/subjects, assets/team) ----------
let BUDDIES = [];
const loadBuddies = async () => { if (!BUDDIES.length) BUDDIES = await api('GET', '/buddies'); return BUDDIES; };
const buddyOf = slug => BUDDIES.find(b => b.slug === slug);
const buddyImg = (slug, cls = '') => `<img class="buddy-img ${cls}" src="assets/buddies/${slug[0].toUpperCase() + slug.slice(1)}.jpg" data-fb="assets/logo-mark.png" alt="${esc(buddyOf(slug)?.name || 'Learniverse buddy')}">`;
const buddySay = (slug, text, cls = 'sm') => { const b = buddyOf(slug); return b ? `<div class="buddy-say">${buddyImg(slug, cls)}<div class="bubble"><b>${esc(b.name)}</b><br>${esc(text)}</div></div>` : ''; };
function fixImgs(root = document) { $$('img[data-fb]', root).forEach(i => { const swap = () => { if (i.dataset.done) return; i.dataset.done = 1; i.src = i.dataset.fb; }; i.addEventListener('error', swap, { once: true }); if (i.complete && i.naturalWidth === 0) swap(); }); }
const TEAM = [
  {
    name: 'Tebogo Mosoma',
    image: 'Tebogo.jpeg',
    title: 'Co-founder — Business Technology Professional & Athlete',
    bio: 'Tebogo is an extraordinary individual with a passion for technology, innovation, and solving real-world problems. With experience in software development, data analytics, and AI-driven solutions, he enjoys turning ideas into practical, user-focused digital experiences. A four-time hackathon finalist, team leader, and academic mentor, he brings strong technical thinking, collaboration, and leadership to every project. Beyond technology, Tebogo is a dedicated middle-distance athlete who competes in events ranging from the 800m, 1500m and road running. His athletic journey has helped shape his discipline, resilience, consistency, and ability to perform under pressure. He is passionate about continuous growth and using both technology and teamwork to create meaningful impact.',
  },
  {
    name: 'Unathi Masemola',
    image: 'Unathi.jpeg',
    title: 'Co-founder — Business Information Systems Graduate & Aspiring Business/Data Analyst',
    bio: 'Unathi is a Business Information Systems graduate with an academic background that has allowed her to explore different areas of Information Technology, business processes, systems development and technology-driven solutions. She is particularly interested in pursuing business and data analytics, exploring how data can be transformed into meaningful insights that support better business decisions. She is also passionate about continuously developing her skills as a developer, expanding her technical knowledge and embracing lifelong learning, as she believes there is always room to grow and something new to discover. Outside the academic world, Unathi is a sports enthusiast who enjoys keeping up with different sporting events, a social butterfly who appreciates good company and social gatherings, and an explorer at heart. She has a genuine fascination with geography, different countries, cultures and traditions. She can easily get lost exploring Google Maps, discovering places she has never heard of and learning random facts about the world. Travelling the world and experiencing its diversity is definitely on her bucket list. She loves new experiences, interesting conversations and anything that gives her an opportunity to learn something new.',
  },
  {
    name: 'Lerato Letsoalo',
    image: 'Lerato.jpeg',
    title: 'Co-founder — Technology Enthusiast, Aspiring Data Engineer & Innovator',
    bio: 'Lerato is a Business Information Systems student at STADIO Higher Education with a strong interest in technology, data and innovation. Her academic journey has allowed her to explore different areas of Information Technology, from software development and database management to business intelligence and systems design. She is particularly passionate about data engineering and AI/ML, and how technology can be used to solve real-world problems and create meaningful solutions. She enjoys taking ideas from concept to reality, whether through developing applications, experimenting with new technologies or collaborating with others to build something impactful. Through hackathons, academic projects and mentorship, she has also developed a strong appreciation for teamwork, leadership and continuous learning. She believes that curiosity, consistency and a willingness to step outside one’s comfort zone are essential to growth. Outside of technology, Lerato is someone who enjoys exploring different interests and trying new things. She is a musician at heart and plays both the violin and viola, which have taught her patience, discipline and the value of practice. She also enjoys meaningful conversations, meeting new people, travelling and discovering different places and cultures. Naturally curious, she is always looking for something new to learn, experience or challenge herself with. Ultimately, she believes in growing beyond what she already knows, embracing new opportunities and using her skills to make a positive difference.',
  },
];
const paragraphs = text => text.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
function landing() {
  stopIdle();
  app.innerHTML = `<header class="top"><a class="brand" href="#/"><img src="assets/logo-mark.png" alt="">Learniverse</a>
<nav aria-label="Main">${[['about', 'Who We Are'], ['mission', 'Our Mission'], ['vision', 'Our Vision'], ['approach', 'Inclusive Learning'], ['parents', 'For Parents'], ['teachers', 'For Teachers'], ['contact', 'Contact Us']].map(([i, l]) => `<a href="#/" data-s="${i}">${l}</a>`).join('')}</nav>
<div class="who">${langHTML()}<a class="btn ghost sm" href="#/login">Log in</a><a class="btn sm" href="#/register">Register</a></div></header>
<main id="main" class="wrap"><section class="hero"><div class="logo-orbit"><img class="logo-round" src="assets/logo-mark.png" alt="Learniverse mascot"><i class="orb"></i><i class="orb o2"></i></div>
<h1>Explore a universe of knowledge</h1><p>Learniverse is an inclusive, technology-driven educational platform designed to make learning more accessible, engaging and personalised for children.</p>
<div class="row" style="justify-content:center"><a class="btn" href="#/register">${ic('rocket')} Start your journey</a><a class="btn ghost" href="#/login">I already have an account</a></div></section>
<section class="sec rv" id="about"><span class="eyebrow">Who we are</span><h2>Who We Are</h2><div class="card public-copy">${paragraphs(`Learniverse is an inclusive, technology-driven educational platform designed to make learning more accessible, engaging and personalised for children.\n\nWe believe that education should not follow a one-size-fits-all approach. Every child has their own interests, strengths, learning preferences and pace. Our goal is to create an environment where children can explore concepts, develop their knowledge and build confidence through learning experiences that work for them.\n\nWhether a child learns through visuals, audio, reading, interactive activities or hands-on experiences, Learniverse aims to make learning meaningful and enjoyable.\n\nWe welcome all learners, including neurodivergent children and neurotypical children who may benefit from additional support, alternative explanations or a different approach to learning. No labels. No limitations. Just learning without boundaries.`)}</div>
<h2 class="team-heading">Meet Our Team</h2><div class="grid">${TEAM.map((t, i) => `<article class="card team lift"><img class="team-img" src="assets/team/${t.image}" data-fb="assets/logo-mark.png" alt="Photo of ${t.name}" loading="lazy"><h3>${t.name}</h3><p class="team-title">${esc(t.title)}</p><p class="team-bio collapsed" id="team-bio-${i}">${esc(t.bio)}</p><button class="btn ghost sm" type="button" data-bio-toggle="${i}" aria-controls="team-bio-${i}" aria-expanded="false">Read more</button></article>`).join('')}</div></section>
<section class="sec rv" id="mission"><span class="eyebrow">Why we exist</span><h2>Our Mission</h2><div class="card public-copy">${paragraphs(`At Learniverse, our mission is to make quality education more inclusive, accessible, engaging and meaningful for every child by creating personalised learning experiences that recognise and accommodate the different ways children learn. We believe that every learner deserves an educational environment where their individual strengths, interests, abilities and learning preferences are understood and supported. Through technology, interactive educational resources and adaptive learning approaches, we aim to move beyond traditional one-size-fits-all teaching methods by allowing children to learn at their own pace, explore concepts in different ways and receive additional support where needed. Whether a child learns best through visual explanations, audio, reading, practical activities or interactive experiences, Learniverse strives to provide opportunities that make learning more approachable, enjoyable and effective. Our mission extends beyond academic development; we want to nurture curiosity, encourage independence, build confidence and empower children to recognise their own potential, regardless of their learning differences, abilities or individual circumstances.`)}</div></section>
<section class="sec rv" id="vision"><span class="eyebrow">Where we are going</span><h2>Our Vision</h2><div class="card public-copy">${paragraphs(`Our vision is to build an inclusive and accessible learning ecosystem where every child, regardless of their abilities, learning preferences, background or educational challenges, has the opportunity to discover their potential and thrive academically and personally. We envision a future where technology helps bridge educational gaps, where learning is not restricted by rigid teaching methods and where children are not expected to adapt to a single way of learning. Instead, we aspire to create a platform that continuously evolves around the needs of its learners, offering flexible, personalised and engaging educational experiences that support different learning journeys. By combining educational innovation, adaptive technology and a deep commitment to inclusivity, we hope to contribute towards a future in which every child feels represented, supported, valued and confident in their ability to succeed. Ultimately, we want Learniverse to become more than an educational platform; we want it to become a space where curiosity is encouraged, differences are embraced and every child is given the opportunity to reach for their own universe of possibilities.`)}</div></section>
<section class="sec rv" id="approach"><span class="eyebrow">Different minds. Different strengths.</span><h2>Our Approach to Inclusive Learning</h2><p class="lead">Different minds. Different strengths. One learning universe.</p><div class="card public-copy">${paragraphs(`At Learniverse, we understand that two children in the same classroom may experience the same lesson very differently.\n\nOne child might understand a concept immediately through a diagram, while another may need an audio explanation, a practical example or additional practice.\n\nWe don't expect children to fit into one learning method. Instead, we aim to make learning more flexible by allowing children to engage with content in ways that support their individual needs.\n\nOur platform is not designed to diagnose, categorise or compare children. It is designed to support them.\n\nAccessibility is not an exclusive feature reserved for selected learners. It is part of the learning experience for everyone.`)}</div></section>
<section class="sec rv" id="parents"><span class="eyebrow">Be part of your child's learning journey</span><h2>For Parents and Guardians</h2><div class="card public-copy"><p>Learniverse gives parents and guardians a way to stay involved in their child's educational development.</p><h3>Parents will be able to:</h3><ul>${['Monitor learning progress.', 'View completed lessons and activities.', 'Follow quiz and assessment performance.', 'Identify areas that may need additional practice.', 'Receive learning recommendations.', "Better understand their child's learning journey."].map(x => `<li>${x}</li>`).join('')}</ul></div></section>
<section class="sec rv" id="teachers"><span class="eyebrow">Supporting the people who make learning possible</span><h2>For Teachers and Tutors</h2><div class="card public-copy">${paragraphs(`At Learniverse, we recognise that teachers and tutors play an essential role in every child's educational journey. We understand that supporting a classroom of learners with different abilities, interests, strengths and learning needs can be challenging, particularly when traditional teaching approaches do not always accommodate everyone. Learniverse aims to support educators by providing tools and resources that make it easier to deliver engaging, flexible and personalised learning experiences.\n\nThrough our platform, teachers and tutors will be able to access CAPS-aligned learning materials, support learners across different grades and subjects, monitor individual and group progress, and identify areas where additional guidance or practice may be beneficial.`)}</div></section>
<section class="sec rv" id="contact"><span class="eyebrow">Get in touch</span><h2>Contact Us</h2><p class="lead">Questions, feedback or a school that wants to partner? Send us a message.</p>
<form class="card" id="cf" style="max-width:600px;margin:auto"><div class="field"><label for="cn">Your name</label><input id="cn" required maxlength="80"></div><div class="field"><label for="ce">Email</label><input id="ce" type="email" required></div><div class="field"><label for="cm">Message</label><textarea id="cm" required minlength="10" maxlength="2000"></textarea></div><p class="err" id="cerr" role="alert"></p><button class="btn">${ic('mail')} Send message</button></form><p class="lead contact-email">Or email us at <a class="btn ghost sm" href="mailto:learniverse.platform@gmail.com">${ic('mail', 16)} learniverse.platform@gmail.com</a>.</p></section></main>
<footer class="site-footer"><div class="footer-main"><div><b>Learniverse</b><p>Learning without boundaries.</p></div><div><h2>Contact</h2><a class="btn ghost sm" href="mailto:learniverse.platform@gmail.com">${ic('mail', 16)} learniverse.platform@gmail.com</a></div><div><h2>Follow us</h2><p>Our social media profiles are coming soon.</p></div></div><div class="footer-bottom">© 2026 Learniverse. All rights reserved.</div></footer>`;
  fixImgs();
  $$('[data-bio-toggle]').forEach(button => button.onclick = () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', expanded);
    button.textContent = expanded ? 'Read less' : 'Read more';
    $(`#team-bio-${button.dataset.bioToggle}`).classList.toggle('collapsed', !expanded);
  });
  $('#cf').onsubmit = async e => { e.preventDefault(); try { await api('POST', '/contact', { name: $('#cn').value, email: $('#ce').value, message: $('#cm').value }); e.target.reset(); $('#cerr').textContent = ''; toast('Thank you! We will get back to you soon.'); } catch (x) { $('#cerr').textContent = x.message; } };
  reveal();
}
document.addEventListener('click', e => { const a = e.target.closest('[data-s]'); if (!a) return; e.preventDefault(); const sc = () => document.getElementById(a.dataset.s)?.scrollIntoView({ behavior: 'smooth' }); location.hash.length > 2 ? (go('#/'), setTimeout(sc, 80)) : sc(); });

function plainHeader() { return `<header class="top"><a class="brand" href="#/"><img src="assets/logo-mark.png" alt="">Learniverse</a><div class="who">${langHTML()}</div></header>`; }
function auth(mode) {
  stopIdle(); const reg = mode === 'register';
  app.innerHTML = `${plainHeader()}<main id="main" class="wrap"><div class="card auth">${reg ? '<a class="btn ghost sm" href="#/">Back to public website</a><br><br>' : ''}<div class="tabs"><a href="#/login" ${reg ? '' : 'aria-current="page"'}>Log in</a><a href="#/register" ${reg ? 'aria-current="page"' : ''}>Register</a></div>
<h1 style="font-size:1.8rem">${reg ? 'Join the universe' : 'Welcome back'}</h1><form id="af">
${reg ? `<div class="field"><label for="n">Full name</label><input id="n" required maxlength="80" autocomplete="name"></div>` : ''}
<div class="field"><label for="e">Email</label><input id="e" type="email" required autocomplete="email"></div>
<div class="field"><label for="p">Password ${reg ? '(8+ characters)' : ''}</label><input id="p" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
${reg ? `<div class="field"><label for="r">I am a</label><select id="r"><option value="learner">Learner</option><option value="parent">Parent or guardian</option><option value="teacher">Teacher or tutor</option></select></div>
<div id="tf" hidden><div class="field"><label for="tk">I am a</label><select id="tk"><option value="teacher">Teacher (school or learning centre)</option><option value="tutor">Independent tutor</option></select></div><div class="field"><label for="to">School or organisation (optional)</label><input id="to" maxlength="100"></div></div>
<label class="check"><input type="checkbox" id="c" required><span id="ct">A parent or guardian has agreed to this learner account and to Learniverse storing learning progress to personalise lessons.</span></label>` : ''}
${reg ? '' : '<p style="text-align:right;margin:-4px 0 10px"><a class="btn ghost sm" href="#/forgot">Forgot your password?</a></p>'}<p class="err" id="er" role="alert"></p><button class="btn" style="width:100%">${reg ? 'Create account' : 'Log in'}</button></form></div></main>`;
  if (reg) $('#r').onchange = e => { const v = e.target.value; $('#tf').hidden = v !== 'teacher'; $('#ct').textContent = v === 'parent' ? 'I accept the privacy notice and will use Learniverse on behalf of my child.' : v === 'teacher' ? 'I confirm I am a teacher or tutor. I will only use learner information I am given access to for educational purposes, keep it confidential and follow POPIA.' : 'A parent or guardian has agreed to this learner account and to Learniverse storing learning progress to personalise lessons.'; };
  $('#af').onsubmit = async e => {
    e.preventDefault();
    try {
      me = await api('POST', reg ? '/auth/register' : '/auth/login', reg ? { name: $('#n').value, email: $('#e').value, password: $('#p').value, role: $('#r').value, consent: $('#c').checked, kind: $('#tk').value, organisation: $('#to').value } : { email: $('#e').value, password: $('#p').value });
      if (me.role === 'learner' && me.prefs) { prefs = { ...prefs, ...me.prefs }; applyPrefs(); }
      go(me.role === 'learner' && (!me.onboarded || !me.buddy) ? '#/onboard' : '#/app');
    } catch (x) { $('#er').textContent = x.message; }
  };
}
function forgot() {
  stopIdle();
  app.innerHTML = `${plainHeader()}<main id="main" class="wrap"><div class="card auth"><h1 style="font-size:1.8rem">Forgot your password?</h1><p class="muted">Enter the email you registered with. If an account exists, we will email you a link to choose a new password. Learners can ask a parent or guardian to help.</p>
<form id="ff"><div class="field"><label for="e">Email</label><input id="e" type="email" required autocomplete="email"></div><p class="err" id="er" role="alert"></p><button class="btn" style="width:100%">${ic('mail')} Send reset link</button></form><p style="text-align:center"><a class="btn ghost" href="#/login">Back to log in</a></p></div></main>`;
  $('#ff').onsubmit = async e => { e.preventDefault(); try { await api('POST', '/auth/forgot', { email: $('#e').value }); $('#ff').outerHTML = `<div class="hook">${ic('check', 22)} If that email is registered, a reset link is on its way. It works for 1 hour. Check your spam folder too.</div>`; } catch (x) { $('#er').textContent = x.message; } };
}
function resetView(token) {
  stopIdle();
  app.innerHTML = `${plainHeader()}<main id="main" class="wrap"><div class="card auth"><h1 style="font-size:1.8rem">Choose a new password</h1><form id="rf"><div class="field"><label for="p1">New password (8+ characters)</label><input id="p1" type="password" required minlength="8" autocomplete="new-password"></div><div class="field"><label for="p2">Confirm new password</label><input id="p2" type="password" required minlength="8" autocomplete="new-password"></div><p class="err" id="er" role="alert"></p><button class="btn" style="width:100%">Save new password</button></form></div></main>`;
  $('#rf').onsubmit = async e => { e.preventDefault(); if ($('#p1').value !== $('#p2').value) return ($('#er').textContent = 'The two passwords do not match'); try { await api('POST', '/auth/reset', { token, password: $('#p1').value }); $('#rf').outerHTML = `<div class="hook">${ic('check', 22)} Your password has been changed.</div><p><a class="btn" href="#/login">Log in</a></p>`; } catch (x) { $('#er').textContent = x.message; } };
}
async function buddyPicker(done) {
  stopIdle(); await loadBuddies(); let sel = me.buddy || null;
  const draw = () => {
    const b = buddyOf(sel), first = b?.name.split(' ')[0];
    app.innerHTML = `${plainHeader()}<main id="main" class="wrap"><div class="buddy-heading"><h1>Choose your Learniverse buddy!</h1><p class="muted">Tap a character to meet them. Your buddy will cheer you on all the way.</p></div>
<div class="buddy-grid">${BUDDIES.map(x => `<button class="bcard ${sel === x.slug ? 'on' : ''}" data-b="${x.slug}" aria-pressed="${sel === x.slug}">${buddyImg(x.slug)}<b>${esc(x.name)}</b><span class="muted">${esc(x.role)}</span></button>`).join('')}</div>
${b ? `<div class="card pop-in buddy-detail" style="border-color:${b.color}"><div class="row">${buddyImg(b.slug, 'lg')}<div><h2 style="margin:0">${esc(b.name)}</h2><p><span class="tag">${esc(b.role)}</span></p><p style="margin:0"><b>Personality:</b> ${esc(b.personality)}</p></div></div><div class="bubble big">${esc(b.intro)}</div><div class="row"><button class="btn ghost" id="hear">${ic('volume')} Hear ${esc(first)}</button><button class="btn alt" id="pk">${ic('check')} Choose ${esc(first)}</button></div><p class="err" id="er" role="alert"></p></div>` : ''}</main>`;
    fixImgs(); $$('.bcard').forEach(c => c.onclick = () => { sel = c.dataset.b; draw(); $('.buddy-detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); if (prefs.tts) speak(buddyOf(sel).intro); });
    if (b) { $('#hear').onclick = () => speak(b.intro); $('#pk').onclick = async () => { try { me = await api('PUT', '/me/profile', { buddy: sel }); confetti(); toast(`${first} is now your buddy!`); done(); } catch (x) { $('#er').textContent = x.message; } }; }
  };
  draw();
}
async function onboard() {
  if (!me.buddy) return buddyPicker(() => route());
  stopIdle(); let grade = me.grade, ints = new Set(me.interests || []); await loadBuddies();
  app.innerHTML = `${plainHeader()}<main id="main" class="wrap">${buddySay(me.buddy, `Great choice! Now tell me about you so I can build lessons you will love.`, 'sm')}<h1>Let's set up your spaceship</h1>
<div class="card"><h2>1. Which grade are you in?</h2><div class="chips" id="gr">${[1, 2, 3, 4, 5, 6, 7].map(g => `<button class="chip" data-g="${g}" aria-pressed="${grade === g}">Grade ${g}</button>`).join('')}</div></div><br>
<div class="card"><h2>2. What do you love?</h2><p class="muted">Pick as many as you like. Your lessons, examples and quiz questions will be built around them.</p><div class="chips" id="in">${INTERESTS.map(([n, i]) => `<button class="chip" data-i="${n}" aria-pressed="${ints.has(n)}">${ic(i)} ${n}</button>`).join('')}</div></div><br>
<div class="card"><h2>3. How do you like to learn?</h2>${a11yHTML()}</div><p class="err" id="er" role="alert"></p><button class="btn" id="go">Start exploring ${ic('right')}</button></main>`;
  fixImgs(); bindA11y(app);
  $$('#gr .chip').forEach(b => b.onclick = () => { grade = +b.dataset.g; $$('#gr .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $$('#in .chip').forEach(b => b.onclick = () => { const n = b.dataset.i; ints.has(n) ? ints.delete(n) : ints.add(n); b.setAttribute('aria-pressed', ints.has(n)); });
  $('#go').onclick = async () => { if (!grade) return ($('#er').textContent = 'Please choose your grade'); try { me = await api('PUT', '/me/profile', { grade, interests: [...ints], prefs }); go('#/app'); } catch (x) { $('#er').textContent = x.message; } };
}

// ---------- shell + router ----------
const NAV = {
  learner: [['app', 'Dashboard', 'home'], ['app/subjects', 'Subjects', 'grid'], ['app/classroom', 'Classroom', 'users'], ['app/badges', 'Badges', 'medal'], ['app/board', 'Leaderboard', 'trophy'], ['app/report', 'Report', 'file'], ['app/plan', 'Study plan', 'calendar'], ['app/settings', 'Settings', 'sliders']],
  parent: [['app', 'Overview', 'users'], ['app/classroom', 'Classroom', 'grid'], ['app/report', 'Report card', 'file'], ['app/plan', 'Study plan', 'calendar']],
  teacher: [['app', 'Dashboard', 'home'], ['app/classrooms', 'Classrooms', 'grid'], ['app/analytics', 'Analytics', 'chart'], ['app/plans', 'Lesson plans', 'file'], ['app/resources', 'Resources', 'book'], ['app/ai', 'AI Assistant', 'sparkles']],
  admin: [['app', 'Overview', 'chart'], ['app/users', 'Users', 'users'], ['app/curriculum', 'Curriculum', 'book'], ['app/enquiries', 'Enquiries', 'mail']],
};
function shell(inner, active) {
  app.innerHTML = `<header class="top"><a class="brand" href="#/app"><img src="assets/logo-mark.png" alt="">Learniverse</a><nav aria-label="Main">${NAV[me.role].map(([h, l, i]) => `<a href="#/${h}" ${active === h ? 'aria-current="page"' : ''}>${ic(i, 17)} ${l}</a>`).join('')}</nav><div class="who">${langHTML()}${me.role === 'learner' && me.buddy ? buddyImg(me.buddy, 'xs') : ''}<span>${esc(me.name.split(' ')[0])}</span><button class="btn ghost sm" id="out">${ic('logout', 16)} Log out</button></div></header><main id="main" class="wrap">${inner}</main>`;
  $('#out').onclick = async () => { await api('POST', '/auth/logout'); me = null; go('#/'); };
  fixImgs(); reveal();
}
const errBox = e => `<div class="card"><h2>Oops</h2><p class="err">${esc(e.message)}</p><a class="btn" href="#/app">Back home</a></div>`;
const bar = p => `<div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><b style="width:${p}%"></b></div>`;
const ago = s => s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('en-ZA') : 'never';

async function route() {
  if ('speechSynthesis' in window) speechSynthesis.cancel(); stopIdle(); $('#idle')?.remove();
  const [a, b, c, d] = location.hash.replace(/^#\/?/, '').split('/');
  try {
    if (!a) return landing();
    if (a === 'forgot') return me ? go('#/app') : forgot();
    if (a === 'reset') return resetView(b || '');
    if (a === 'login' || a === 'register') return me ? go('#/app') : auth(a);
    if (!me) return go('#/login');
    if (a === 'buddy') return me.role === 'learner' ? buddyPicker(() => go('#/app/settings')) : go('#/app');
    if (a === 'onboard') return me.role === 'learner' && !(me.onboarded && me.buddy) ? onboard() : go('#/app');
    if (me.role === 'learner' && (!me.onboarded || !me.buddy)) return go('#/onboard');
    if (me.role === 'learner') await loadBuddies();
    const L = me.role === 'learner', Pa = me.role === 'parent', A = me.role === 'admin', Tc = me.role === 'teacher';
    if (!b) return L ? learnerHome() : Pa ? parentHome() : Tc ? teacherHome() : adminHome();
    if (L && b === 'classroom') return classroomView();
    if (L && b === 'assignment') return assignmentView(c);
    if (Pa && b === 'classroom') return parentClassroom();
    if (Tc && b === 'classrooms') return tClassrooms();
    if (Tc && b === 'classroom') return tClassroom(c);
    if (Tc && b === 'edit') return tEditor(c, d);
    if (Tc && b === 'results') return tResults(c, d);
    if (Tc && b === 'learner') return tLearner(c);
    if (Tc && b === 'analytics') return tAnalytics();
    if (Tc && b === 'plans') return tPlans();
    if (Tc && b === 'resources') return tResources();
    if (Tc && b === 'ai') return tAI();
    if (L && b === 'subjects') return subjects();
    if (L && b === 'subject') return subject(c);
    if (L && b === 'lesson') return lesson(c);
    if (L && b === 'quiz') return quiz(c);
    if (L && b === 'badges') return badgesView();
    if (L && b === 'board') return board();
    if (L && b === 'settings') return settings();
    if ((L || Pa) && b === 'report') return reportView();
    if ((L || Pa) && b === 'plan') return planView();
    if (A && b === 'users') return users();
    if (A && b === 'curriculum') return curriculum();
    if (A && b === 'enquiries') return enquiries();
    go('#/app');
  } catch (e) { if (e.status === 401) { me = null; return go('#/login'); } me ? shell(errBox(e), '') : (app.innerHTML = errBox(e)); }
}
addEventListener('hashchange', () => { route(); scrollTo(0, 0); });
(async () => {
  applyPrefs(); a11yPanel(); initTranslate();
  try { me = await api('GET', '/me'); if (me.prefs) { prefs = { ...DEF, ...me.prefs }; applyPrefs(); a11yPanel(); } } catch { me = null; }
  route();
})();
