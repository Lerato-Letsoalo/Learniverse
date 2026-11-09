'use strict';
// ---------- learner ----------
const LVN = ['Guided', 'Standard', 'Challenge'];
let pending = null;
const SUBJECT_IMAGES = { hl: 'HL.jpg', fal: 'FAL.jpg', maths: 'Maths.jpg', life: 'Life.jpg', nst: 'NST.jpg', social: 'Social.jpg', natsci: 'NatSci.jpg', tech: 'Tech.jpg', ems: 'EMS.jpg', lo: 'LO.jpg', arts: 'Arts.jpg' };
const subjImg = (slug, cls = '') => `<div class="sc-img ${cls}"><img src="assets/subjects/${SUBJECT_IMAGES[slug] || 'HL.jpg'}" data-fb="assets/logo-mark.png" alt="" loading="lazy"></div>`;
const subjCard = (s, full) => `<a class="card scard rv" href="#/app/subject/${s.id}">${subjImg(s.slug)}<span class="sc-ico">${ic(SUBJ_ICON[s.icon], 24)}</span><div class="sc-body"><h3>${esc(s.name)}</h3>${full ? `<p class="muted">${esc(s.blurb)}</p><p><span class="tag">${ic('book', 14)} ${s.total} lessons</span> <span class="tag">${ic('sparkles', 14)} +${s.xp} XP</span> <span class="tag">${LVN[s.level - 1]} level</span></p>` : ''}${bar(Math.round(100 * s.done / s.total))}<span class="muted">${s.done}/${s.total} lessons${s.avg != null ? ' · average ' + s.avg + '%' : ''}</span></div></a>`;
const stageIcons = ['activity', 'star', 'planet', 'globe', 'rocket'];
const journeyHTML = j => `<div class="journey">${j.stages.map((s, i) => `<div class="${i <= j.index ? 'on' : ''}"><span>${ic(stageIcons[i], 22)}</span>${s}</div>`).join('')}</div>`;
async function learnerHome() {
  const d = await api('GET', '/dashboard'), j = d.journey;
  const bd = buddyOf(me.buddy), met = sessionStorage.getItem('lv_met'); sessionStorage.setItem('lv_met', '1');
  shell(`<h1>Hello, ${esc(me.name.split(' ')[0])}!</h1>${bd ? buddySay(me.buddy, met ? `${bd.catch} ${pick(BOOST)}` : bd.intro, 'lg') + '<br>' : ''}<div class="boost">${ic('sparkles', 28)}<div><b>${pick(PRAISE)}</b><br><span class="muted">${pick(BOOST)}</span></div></div><br>
<div class="grid"><div class="card stat">${ic('sparkles', 26)}<b data-count="${d.xp}">0</b>XP earned</div><div class="card stat">${ic('flame', 26)}<b data-count="${d.streak}">0</b>day streak</div><div class="card stat">${ic('check', 26)}<b data-count="${d.stats.lessons}">0</b>lessons completed</div><div class="card stat">${ic('rocket', 26)}<b>${j.name}</b>current stage</div></div><br>
${d.next ? `<div class="card lift"><h2>Your next mission</h2><p>${esc(d.next.subject)}: <b>${esc(d.next.title)}</b></p><a class="btn alt" href="#/app/lesson/${d.next.id}">${d.next.status === 'progress' ? 'Continue' : 'Start'} ${ic('right')}</a></div><br>` : ''}
<div class="card rv"><h2>Cosmic Growth Journey</h2><p class="muted">Watch your knowledge grow as you travel through the Learniverse.</p>${journeyHTML(j)}${j.next ? `<p class="muted">${j.next - d.xp} XP until the next stage</p>` : '<p class="good">You reached Galaxy!</p>'}</div><br>
<h2>Your subjects</h2><div class="grid">${d.subjects.map(s => subjCard(s, false)).join('')}</div><br>
<h2>Recent quizzes</h2><div class="card scroll">${d.recent.length ? `<table><tr><th>Topic</th><th>Score</th><th>Date</th></tr>${d.recent.map(r => `<tr><td>${esc(r.title || r.subject + ' review')}</td><td>${r.pct}%</td><td>${ago(r.at)}</td></tr>`).join('')}</table>` : '<p class="muted">No quizzes yet. Open a subject to begin.</p>'}</div>`, 'app');
}
async function subjects() {
  const d = await api('GET', '/dashboard');
  shell(`<h1>Subjects</h1><p class="muted">Grade ${d.grade} · CAPS-aligned</p><div class="grid">${d.subjects.map(s => subjCard(s, true)).join('')}</div>`, 'app/subjects');
}
async function subject(id) {
  const d = await api('GET', '/subjects/' + id), p = d.progress;
  const msg = p.pct === 100 ? 'Incredible! You completed every module.' : p.pct >= 60 ? 'Keep up the excellent work!' : p.pct >= 25 ? 'You are making great progress!' : 'Great start, explorer! Every lesson counts.';
  shell(`<p><a href="#/app/subjects">${ic('left', 16)} Subjects</a></p>${subjImg(d.subject.slug, 'banner')}<h1>${ic(SUBJ_ICON[d.subject.icon], 34)} ${esc(d.subject.name)}</h1><p class="muted">Grade ${d.grade} · Your level: <b>${LVN[d.level - 1]}</b></p>
<div class="card"><h2>Your Progress</h2><div class="big" style="color:var(--gold)">${p.pct}%</div>${bar(p.pct)}<p class="muted" style="margin:0">${p.done} of ${p.total} lessons completed · ${msg}</p></div><br>
<h2>Course Modules</h2>${d.modules.map(m => `<div class="mod"><h3>${ic('book2', 22)} Module ${m.pos}: ${esc(m.title)}</h3>${m.lessons.map(l => `<div class="lrow ${l.status}"><div><b>Lesson ${l.num}: ${esc(l.title)}</b><br><span class="muted">${ic('clock', 14)} ${l.mins} mins · +${l.xp} XP</span></div>
<div class="row" style="margin:0">${l.status === 'done' ? `<span class="st done">${ic('check', 14)} Completed${l.best ? ' · ' + l.best + '%' : ''}</span><a class="btn ghost sm" href="#/app/lesson/${l.id}">Review</a>` : l.status === 'progress' ? `<span class="st progress">In Progress · ${l.pct}%</span><a class="btn alt sm" href="#/app/lesson/${l.id}">Continue</a>` : l.status === 'current' ? `<a class="btn sm" href="#/app/lesson/${l.id}">${ic('play', 14)} Start</a>` : `<span class="st locked">${ic('lock', 14)} ${esc(l.lock)}</span>`}</div></div>`).join('')}</div>`).join('')}
<div class="card"><h2>Earn These Rewards</h2><div class="grid">${d.rewards.map(r => `<div class="card badge ${r.earned ? 'got' : ''}"><div class="ibox">${ic(r.icon, 26)}</div><h3>${esc(r.name)}</h3><p class="muted">${esc(r.desc)}</p><span class="tag">${r.earned ? 'Earned' : 'Locked'}</span></div>`).join('')}<div class="card stat">${ic('sparkles', 26)}<b>${d.totalXp}</b>XP available in this course</div></div></div>
<div class="row"><button class="btn alt" id="sq">${ic('target')} Take the review quiz</button></div><p class="err" id="er"></p>`, 'app/subjects');
  $('#sq').onclick = () => startQuiz({ subjectId: d.subject.id }, '#er');
}
async function startQuiz(body, errSel) {
  try { pending = await api('POST', '/quiz', body); pending.meta = body; go('#/app/quiz/' + pending.id); } catch (e) { $(errSel) ? $(errSel).textContent = e.message : toast(e.message); }
}
async function lesson(id) {
  const d = await api('GET', '/lessons/' + id); let i = Math.min(d.steps.length - 1, Math.floor(d.pct / 100 * d.steps.length)), cheer = '';
  const N = d.steps.length;
  const draw = () => {
    const notes = i === N, th = d.notes.interest;
    shell(`<section class="card lesson"><p class="crumb"><a href="#/app/subject/${d.subject_id}">${ic(SUBJ_ICON[d.icon], 16)} ${esc(d.subject)}</a> · Grade ${d.grade} · <span class="tag">${d.mode} mode</span></p><h1 style="font-size:2rem">${esc(d.title)}</h1>
${bar(Math.round(100 * (i + (notes ? 0 : 1)) / (N + 1)))}${cheer ? buddySay(me.buddy, cheer, 'sm') : ''}
${notes ? `<h2>Summary notes</h2><div class="note"><h3>${ic('target', 18)} Key points</h3>${d.steps.map(s => `<p style="margin:6px 0">${hl(s)}</p>`).join('')}</div>
<div class="note"><h3>${ic('bulb', 18)} Memory trick (mnemonic)</h3><p style="margin:0;font-size:1.15rem">${esc(d.notes.mnemonic)}</p></div>
<div class="note"><h3>${ic(th ? (INTERESTS.find(x => x[0] === th)?.[1] || 'star') : 'star', 18)} ${th ? 'Your ' + esc(th) + ' example' : 'Example'}</h3><p style="margin:0">${esc(d.notes.example)}</p></div>
<div class="row nofocus"><button class="btn ghost" id="say">${ic('volume')} Read notes aloud</button><button class="btn ghost" id="pv">${ic('left')} Back</button><button class="btn alt" id="qz">${ic('target')} Take the quiz (pass with 50%)</button></div><p class="muted">${d.mode === 'challenge' ? 'Challenge: try to explain this lesson to a friend before you start.' : 'Ready when you are. Hints are available during the quiz.'}</p>`
: `${i === 0 && d.notes.interest ? `<p class="hook">${ic(INTERESTS.find(x => x[0] === th)?.[1] || 'star', 22)} Today's mission is linked to your love of ${esc(th)}.</p>` : ''}<p class="step">${hl(d.steps[i])}</p>${d.mode === 'guided' ? '<p class="muted">Take your time. There is no rush.</p>' : ''}
<div class="row"><button class="btn ghost" id="say">${ic('volume')} Read aloud</button><button class="btn ghost" id="pv" ${i ? '' : 'disabled'}>${ic('left')} Back</button><button class="btn" id="nx">Next ${ic('right')}</button></div><p class="muted">Step ${i + 1} of ${N}</p>`}
<p class="err" id="er"></p></section>`, 'app/subjects');
    const text = notes ? `${d.notes.mnemonic}. ${d.notes.example}` : plain(d.steps[i]);
    $('#say').onclick = () => speak(text); $('#pv').onclick = () => { i--; cheer = ''; draw(); };
    if ($('#nx')) $('#nx').onclick = () => { i++; cheer = i === N ? 'You finished the steps! Here are your notes.' : `${pick(PRAISE)} ${N - i} step${N - i > 1 ? 's' : ''} to go.`; api('POST', `/lessons/${id}/step`, { pct: Math.round(100 * i / (N + 1)) }).catch(() => {}); draw(); };
    if ($('#qz')) $('#qz').onclick = () => startQuiz({ lessonId: id }, '#er');
    if (prefs.tts) speak(text);
  };
  watchIdle(); draw();
}

// ---------- quiz with mixed activities, hints and corrections ----------
const bankHTML = (bank, used) => `<div class="bank" aria-label="Word bank">${bank.filter(w => !used.includes(w)).map(w => `<button class="word" draggable="true" data-w="${esc(w)}">${esc(w)}</button>`).join('') || '<span class="muted">All words used. Tap a filled box to take a word back.</span>'}</div>`;
function quiz(sid) {
  if (!pending || pending.id !== sid) return go('#/app/subjects');
  watchIdle(); const Q = pending.questions, n = Q.length, t0 = Date.now();
  const fmtT = () => { const s = Math.floor((Date.now() - t0) / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  qTimer = setInterval(() => { const e = $('#tm'); if (e) e.textContent = fmtT(); }, 1000);
  const A = Q.map(q => q.type === 'order' ? q.items.map((_, k) => k) : q.type === 'match' ? q.sentences.map(() => '') : q.type === 'mcq' ? null : ''), H = Q.map(q => q.showHint ? 1 : 0); let i = 0, nudge = null;
  const ready = () => { const q = Q[i], a = A[i]; return q.type === 'mcq' ? a !== null : q.type === 'blank' ? !!a : q.type === 'match' ? a.every(Boolean) : q.type === 'num' ? String(a).trim() !== '' : true; };
  const put = (k, w) => { q = Q[i]; if (q.type === 'match') { A[i] = A[i].map(x => x === w ? '' : x); A[i][k] = w; } else A[i] = w; draw(); };
  let q;
  const draw = () => {
    clearTimeout(nudge); q = Q[i]; const a = A[i], h = H[i]; let body = '';
    if (q.type === 'mcq') body = q.options.map((o, k) => `<button class="opt" data-k="${k}" aria-pressed="${a === k}" ${h >= 2 && q.eliminate.includes(k) ? 'disabled' : ''}>${'ABCD'[k]}. ${esc(o)}</button>`).join('');
    const slot = (k, v) => `<button class="slot ${v ? 'full' : ''}" data-slot="${k}" aria-label="Answer box ${k + 1}">${v ? esc(v) : 'drop word here'}</button>`;
    if (q.type === 'blank') body = `<p class="sent">${esc(q.sentence).replace('_____', slot(0, a))}</p>${bankHTML(q.bank, [a])}`;
    if (q.type === 'match') body = q.sentences.map((s, k) => `<p class="sent">${esc(s).replace('_____', slot(k, a[k]))}</p>`).join('') + bankHTML(q.bank, a);
    if (q.type === 'num') body = `<input class="num" id="nv" type="text" inputmode="numeric" autocomplete="off" value="${esc(a)}" aria-label="Type your answer">`;
    if (q.type === 'order') body = `<ul class="olist">${a.map((idx, pos) => `<li draggable="true" data-pos="${pos}">${ic('grip')}<span>${esc(q.items[idx])}</span><button class="btn ghost sm" data-up="${pos}" aria-label="Move up" ${pos ? '' : 'disabled'}>${ic('up', 16)}</button><button class="btn ghost sm" data-dn="${pos}" aria-label="Move down" ${pos < a.length - 1 ? '' : 'disabled'}>${ic('down', 16)}</button></li>`).join('')}</ul>`;
    const hints = q.hints.slice(0, h).map(t => `<div class="hintbox">${ic('bulb', 20)}<span>${esc(t)}</span></div>`).join('');
    shell(`<section class="card"><div class="row between" style="margin-top:0"><div><span class="tag">${esc(pending.title)}</span> ${pending.xp ? `<span class="tag">${ic('sparkles', 14)} +${pending.xp} XP</span>` : ''}</div><div class="muted">Question ${i + 1} of ${n}${prefs.calm ? '' : ` · <span id="tm">${fmtT()}</span>`}</div></div>${bar(Math.round(100 * i / n))}<p class="ctx">${ic('target', 16)} ${esc(q.ctx)}</p><h2>${esc(q.q)}</h2>${body}${hints}
<div class="row"><button class="btn ghost" id="pvq" ${i ? '' : 'disabled'}>${ic('left')} Previous</button><button class="btn ghost" id="say">${ic('volume')} Read aloud</button>${h < 2 ? `<button class="btn ghost" id="hint">${ic('bulb')} Need a hint? (${h}/2 used)</button>` : ''}<button class="btn" id="nx" ${ready() ? '' : 'disabled'}>${i === n - 1 ? 'Finish quiz' : 'Next'} ${ic('right')}</button></div><p class="muted">Hints never cost XP. Asking for help is a smart move.</p><p class="err" id="er"></p></section>`, 'app/subjects');
    $$('.opt').forEach(b => b.onclick = () => { A[i] = +b.dataset.k; draw(); });
    $$('.word').forEach(w => { w.onclick = () => { const k = q.type === 'match' ? A[i].findIndex(x => !x) : 0; if (k >= 0) put(k, w.dataset.w); }; w.ondragstart = e => e.dataTransfer.setData('text/plain', w.dataset.w); });
    $$('.slot').forEach(s => { const k = +s.dataset.slot; s.onclick = () => { if (q.type === 'match') A[i][k] = ''; else A[i] = ''; draw(); }; s.ondragover = e => { e.preventDefault(); s.classList.add('over'); }; s.ondragleave = () => s.classList.remove('over'); s.ondrop = e => { e.preventDefault(); put(k, e.dataTransfer.getData('text/plain')); }; });
    if ($('#nv')) { $('#nv').oninput = e => { A[i] = e.target.value; $('#nx').disabled = !ready(); }; $('#nv').focus(); }
    const mv = (p, d) => { const o = A[i], t = p + d; [o[p], o[t]] = [o[t], o[p]]; draw(); };
    $$('[data-up]').forEach(b => b.onclick = () => mv(+b.dataset.up, -1)); $$('[data-dn]').forEach(b => b.onclick = () => mv(+b.dataset.dn, 1));
    $$('.olist li').forEach(li => { li.ondragstart = e => e.dataTransfer.setData('text/plain', li.dataset.pos); li.ondragover = e => e.preventDefault(); li.ondrop = e => { e.preventDefault(); const f = +e.dataTransfer.getData('text/plain'), t = +li.dataset.pos, o = A[i], [m] = o.splice(f, 1); o.splice(t, 0, m); draw(); }; });
    $('#say').onclick = () => speak(q.q + ' ' + (q.options ? q.options.map((o, k) => 'Option ' + 'ABCD'[k] + ': ' + o).join('. ') : q.sentence || ''));
    $('#pvq').onclick = () => { i--; draw(); };
    if ($('#hint')) $('#hint').onclick = () => { H[i]++; draw(); };
    nudge = setTimeout(() => { if (H[i] < 2 && !ready()) toast('Feeling stuck? Tap the hint button. There is no penalty.'); }, 30000);
    $('#nx').onclick = async () => { if (i < n - 1) { i++; toast(pick(PRAISE)); return draw(); } try { results(await api('POST', `/quiz/${sid}/submit`, { answers: A })); } catch (x) { $('#er').textContent = x.message; } };
  };
  draw();
}
function results(r) {
  stopIdle(); const Q = pending.questions, meta = pending.meta, bd = buddyOf(me.buddy) || { catch: '' };
  const qText = q => q.type === 'blank' ? q.sentence.replace('_____', '_____') : q.type === 'match' ? q.sentences.join(' / ') : q.q;
  shell(`<section class="card"><h1><span class="big" style="color:var(--gold)" data-count="${r.pct}">0</span><span class="big" style="color:var(--gold)">%</span></h1>
<p><span class="tag">${ic('medal', 14)} Level ${r.achievement.code}: ${r.achievement.name}</span> <span class="tag">${r.passed ? ic('check', 14) + ' Passed' : 'Not passed yet'}</span></p>
<p>You scored <b>${r.right}</b> of ${r.total} fully correct and earned <b>+${r.xpGained} XP</b>.</p>${buddySay(me.buddy, `${r.passed ? bd.catch + ' ' : ''}${r.advice}`, 'lg') || `<p class="hook">${esc(r.advice)}</p>`}
${r.unlockedNext ? `<p class="good">${ic('lock', 16)} New lesson unlocked: ${esc(r.unlockedNext.title)}</p>` : ''}${r.newBadges.map(b => `<p class="good">${ic(b.icon, 18)} New badge: ${esc(b.name)}</p>`).join('')}
<h2>Corrections: how to get each answer</h2>${Q.map((q, i) => { const x = r.results[i]; return `<div class="card" style="margin:12px 0"><b>${i + 1}. ${esc(qText(q))}</b><p style="margin:8px 0">${x.ok ? `<span class="good">${ic('check', 16)} Correct</span>` : `<span class="wrong">${ic('x', 16)} ${x.score > 0 ? 'Partly correct' : 'Not quite'}</span> · The answer is <b>${esc(x.shown)}</b>`}</p><div class="note" style="margin:0"><h3>${ic('bulb', 16)} How to get it</h3>${esc(x.explain)}</div></div>`; }).join('')}
<div class="row">${r.passed ? (r.unlockedNext ? `<a class="btn alt" href="#/app/lesson/${r.unlockedNext.id}">Next lesson ${ic('right')}</a>` : '') : `<button class="btn alt" id="rt">${ic('rocket')} Try again</button>`}<a class="btn ghost" href="#/app">Dashboard</a></div></section>`, 'app/subjects');
  if (r.passed) confetti(); if (r.newBadges.length || r.levelChange > 0) setTimeout(confetti, 700);
  if ($('#rt')) $('#rt').onclick = () => startQuiz(meta, '#er');
}
async function badgesView() {
  const d = await api('GET', '/badges');
  shell(`<h1>Your Badges</h1><div class="grid">${d.badges.map(b => `<div class="card badge rv ${b.earned ? 'got' : ''}"><div class="ibox lg">${ic(b.icon, 30)}</div><h3>${esc(b.name)}</h3><p class="muted">${esc(b.desc)}</p><span class="tag">${b.earned ? 'Earned' : 'Locked'}</span></div>`).join('')}</div><br>
<div class="card"><h2>Cosmic Growth Journey</h2>${journeyHTML(d.journey)}</div>`, 'app/badges');
}
async function board() {
  const d = await api('GET', '/leaderboard');
  shell(`<h1>Leaderboard</h1><p class="muted">Top explorers in Grade ${d.grade}. Only first names are shown.</p><div class="card scroll"><table><tr><th>#</th><th>Explorer</th><th>Stage</th><th>XP</th></tr>${d.rows.map(r => `<tr class="${r.me ? 'me' : ''}"><td>${r.rank <= 3 ? ic('trophy', 18) + ' ' : ''}${r.rank}</td><td>${r.buddy ? buddyImg(r.buddy, 'xs') : ''} ${esc(r.name)}${r.me ? ' (you)' : ''}</td><td>${r.stage}</td><td>${r.xp}</td></tr>`).join('')}</table></div>`, 'app/board');
}
function settings() {
  let grade = me.grade, ints = new Set(me.interests);
  shell(`<h1>Settings</h1><div class="grid"><div class="card"><h2>My learning</h2><div class="field"><label for="g">Grade</label><select id="g">${[1, 2, 3, 4, 5, 6, 7].map(g => `<option ${g === grade ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="chips">${INTERESTS.map(([n, i]) => `<button class="chip" data-i="${n}" aria-pressed="${ints.has(n)}">${ic(i)} ${n}</button>`).join('')}</div><br><button class="btn" id="sv">Save</button></div>
<div class="card"><h2>Accessibility</h2>${a11yHTML()}</div><div class="card"><h2>Your buddy</h2>${buddyImg(me.buddy, 'lg')}<p class="muted">${esc(buddyOf(me.buddy)?.name || '')}</p><a class="btn ghost" href="#/buddy">Change buddy</a></div><div class="card"><h2>Teacher/Tutor code</h2><p class="muted">Give this code to your teacher or tutor. They send a request, and you or your parent or guardian approve it. It is different from your Family Code.</p><p style="font-size:2rem;letter-spacing:.15em;font-weight:800">${esc(me.teacherCode)}</p></div><div class="card"><h2>Family code</h2><p class="muted">Give this code to a parent or guardian so they can follow your progress.</p><p style="font-size:2rem;letter-spacing:.2em;font-weight:800">${esc(me.code)}</p></div></div>`, 'app/settings');
  bindA11y(app);
  $$('.chip').forEach(b => b.onclick = () => { const n = b.dataset.i; ints.has(n) ? ints.delete(n) : ints.add(n); b.setAttribute('aria-pressed', ints.has(n)); });
  $('#sv').onclick = async () => { me = await api('PUT', '/me/profile', { grade: +$('#g').value, interests: [...ints], prefs }); toast('Saved'); };
}

// ---------- report card ----------
const STATUS = { met: ['check', 'Requirement met'], not_met: ['x', 'Not yet met'], pending: ['clock', 'Not assessed'] };
const VERDICT = { meets: 'Meets the promotion requirements', on_track: 'On track so far. Some subjects are still to be assessed', at_risk: 'Not yet meeting the promotion requirements', not_started: 'No marks yet. Complete a lesson quiz to start your report' };
function reportHTML(r, name) {
  return `<div class="card"><div class="row between"><div><h2 style="margin:0">Learniverse Progress Report</h2><p class="muted" style="margin:4px 0 0">${esc(name)} · Grade ${r.grade} · ${r.phase} · ${new Date().toLocaleDateString('en-ZA')}</p></div><button class="btn ghost sm nofocus" onclick="print()">${ic('printer', 16)} Print</button></div>
<div class="verdict ${r.verdict}">${ic(r.verdict === 'at_risk' ? 'x' : r.verdict === 'meets' ? 'shield' : 'clock', 26)}<div><b>${VERDICT[r.verdict]}</b>${r.average != null ? `<br><span class="muted">Overall average ${r.average}% · Level ${r.overall.code} (${r.overall.name})</span>` : ''}${r.notes.map(n => `<br><span class="wrong">${esc(n)}</span>`).join('')}</div></div>
<div class="scroll"><table><tr><th>Subject</th><th>Mark</th><th>Level</th><th>Achievement</th><th>Needs</th><th>Status</th></tr>${r.rows.map(x => `<tr><td><b>${esc(x.name)}</b><br><span class="muted">${x.done}/${x.total} lessons</span></td><td>${x.mark == null ? '-' : x.mark + '%'}</td><td>${x.code ?? '-'}</td><td>${esc(x.descriptor)}</td><td>Level ${x.required}${r.grade === 7 && !['hl', 'fal', 'maths'].includes(x.slug) ? '*' : ''}</td><td>${ic(STATUS[x.status][0], 15)} ${STATUS[x.status][1]}</td></tr>`).join('')}</table></div>
${r.grade === 7 ? '<p class="muted">* In Grade 7, any three of these subjects need Level 3 or higher.</p>' : ''}
<h3>Comments</h3>${r.rows.filter(x => x.mark != null).map(x => `<p style="margin:6px 0"><b>${esc(x.name)}:</b> ${esc(x.comment)}</p>`).join('') || '<p class="muted">Comments appear after the first quiz.</p>'}
<h3>Achievement levels</h3><div class="scroll"><table><tr><th>Level</th><th>Descriptor</th><th>Percentage</th></tr>${r.scale.map(s => `<tr><td>${s.code}</td><td>${s.name}</td><td>${s.range}</td></tr>`).join('')}</table></div>
<p class="muted">Promotion rules (CAPS NPPPR): Home Language Level 4, First Additional Language Level 3, Mathematics Level 3, other subjects Level 2. This is a practice report from Learniverse quizzes. The official promotion decision is made by the school.</p></div>`;
}
let kidIdx = 0;
const kidPick = kids => kids.length > 1 ? `<div class="field nofocus" style="max-width:300px"><label for="kp">Learner</label><select id="kp">${kids.map((k, i) => `<option value="${i}" ${i === kidIdx ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select></div>` : '';
const bindKid = fn => { if ($('#kp')) $('#kp').onchange = e => { kidIdx = +e.target.value; fn(); }; };
async function reportView() {
  if (me.role === 'learner') { const r = await api('GET', '/report'); return shell(`<h1>Report card</h1>${reportHTML(r, me.name)}`, 'app/report'); }
  const kids = await api('GET', '/parent/children'); if (!kids.length) return shell(`<h1>Report card</h1><p class="muted">Link a child on the Overview page to see their report card.</p>`, 'app/report');
  const k = kids[Math.min(kidIdx, kids.length - 1)];
  shell(`<h1>Report card</h1>${kidPick(kids)}${reportHTML(k.report, k.name)}`, 'app/report'); bindKid(reportView);
}

// ---------- study plan (parent controlled) ----------
const fmt = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
function timetable(p) {
  const subs = [...p.subjects].sort((a, b) => a.priority - b.priority), n = subs.length; if (!n) return null;
  const per = Math.max(1, Math.round(p.hours * 60 / 45)), w = subs.map((s, i) => n - i), W = w.reduce((a, b) => a + b, 0), cr = w.map(() => 0);
  const next = () => { cr.forEach((c, i) => cr[i] += w[i]); let k = 0; cr.forEach((c, i) => { if (c > cr[k]) k = i; }); cr[k] -= W; return k; };
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, di) => {
    const cnt = di < 5 ? per : di === 5 ? Math.max(1, Math.ceil(per / 2)) : 1; let t = di < 5 ? 15 * 60 + 30 : 9 * 60;
    const idx = Array.from({ length: cnt }, next).sort((a, b) => a - b); // higher priority subjects sit earlier in the day
    return { day, note: di === 6 ? 'Light revision and rest' : '', blocks: idx.map((k, bi) => { const s = t; t += 55; return { from: fmt(s), to: fmt(s + 45), subject: subs[k].name, brk: bi < idx.length - 1 }; }) };
  });
}
function ttHTML(p) {
  const wk = timetable(p); if (!wk) return '';
  if (p.view === 'monthly') {
    const counts = {}; wk.forEach(d => d.blocks.forEach(b => { counts[b.subject] = (counts[b.subject] || 0) + 1; }));
    const left = p.exam ? Math.ceil((new Date(p.exam) - new Date()) / 864e5) : null, total = Object.values(counts).reduce((a, b) => a + b, 0);
    const focus = ['Learn new content and complete lessons', 'Practise and apply with quizzes', 'Consolidate weak areas and re-do corrections', 'Revise and self-test'];
    return `<div class="card scroll"><h2>Monthly plan</h2>${left != null ? `<p class="muted">${left > 0 ? left + ' days until the first exam. Weeks closest to the exam switch to past papers and revision.' : 'The exam date has passed.'}</p>` : ''}<table><tr><th>Week</th><th>Focus</th>${Object.keys(counts).map(s => `<th>${esc(s)}</th>`).join('')}<th>Hours</th></tr>
${[0, 1, 2, 3].map(i => `<tr><td>Week ${i + 1}</td><td>${left != null && left <= (4 - i) * 7 && left > 0 ? 'Exam preparation: past papers and revision' : focus[i]}</td>${Object.values(counts).map(c => `<td>${c} x 45 min</td>`).join('')}<td>${(total * 45 / 60).toFixed(1)}</td></tr>`).join('')}</table></div>`;
  }
  return `<div class="card scroll tt"><h2>Weekly timetable</h2><table><tr><th>Day</th><th>Study sessions (45 minutes each, 10-minute breaks)</th></tr>${wk.map(d => `<tr><td><b>${d.day}</b></td><td>${d.blocks.map(b => `<span class="blk">${ic('clock', 14)} ${b.from} - ${b.to} · ${esc(b.subject)}</span>${b.brk ? '<span class="brk">10 min break</span>' : ''}`).join('')}${d.note ? `<span class="muted">${d.note}</span>` : ''}</td></tr>`).join('')}</table></div>`;
}
const TIPS = `<div class="card"><h3>${ic('bulb', 20)} Study tips</h3><ul><li>Study in 45-minute blocks and take 10-minute breaks.</li><li>Prioritise the subjects you find hardest earlier in the day.</li><li>Read the lesson notes, then test yourself with the quiz corrections.</li><li>Sleep, water and movement help your brain remember.</li></ul></div>`;
async function planView() {
  if (me.role === 'learner') { const p = await api('GET', '/plan'); return shell(`<h1>Study plan</h1><p class="muted">${p.saved ? 'Set by your parent or guardian.' : 'A suggested plan. Your parent or guardian can personalise it.'}</p>${ttHTML(p)}<br>${TIPS}`, 'app/plan'); }
  const kids = await api('GET', '/parent/children'); if (!kids.length) return shell(`<h1>Study plan</h1><p class="muted">Link a child on the Overview page to create a study plan.</p>`, 'app/plan');
  const k = kids[Math.min(kidIdx, kids.length - 1)], p = JSON.parse(JSON.stringify(k.plan)); let shown = false;
  const draw = () => {
    shell(`<h1>Study plan</h1>${kidPick(kids)}<div class="grid"><div class="card"><h2>Your subjects</h2>${[...p.subjects].sort((a, b) => a.priority - b.priority).map(s => `<div class="row between" style="margin:6px 0"><span>${esc(s.name)} <span class="tag">priority ${s.priority}</span></span><button class="btn ghost sm" data-rm="${esc(s.name)}" aria-label="Remove ${esc(s.name)}">${ic('x', 14)}</button></div>`).join('') || '<p class="muted">No subjects yet.</p>'}
<div class="field"><label for="sn">Subject name</label><input id="sn" maxlength="60"></div><div class="field"><label for="sp">Priority (1 = highest priority)</label><input id="sp" type="number" min="1" max="20" value="${p.subjects.length + 1}"></div><button class="btn ghost sm" id="ad">${ic('plus', 16)} Add subject</button></div>
<div class="card"><h2>Settings</h2><div class="field"><label for="ex">${ic('calendar', 16)} First exam date (optional)</label><input id="ex" type="date" value="${esc(p.exam)}"></div><div class="field"><label for="hr">${ic('clock', 16)} Daily study hours target</label><input id="hr" type="number" min="0.5" max="8" step="0.5" value="${p.hours}"></div>
<div class="chips" role="group" aria-label="Plan view"><button class="chip" data-v="weekly" aria-pressed="${p.view === 'weekly'}">Weekly</button><button class="chip" data-v="monthly" aria-pressed="${p.view === 'monthly'}">Monthly</button></div><br><button class="btn" id="gn">${ic('sparkles')} Generate timetable</button><p class="err" id="er"></p></div></div><br>${shown ? ttHTML(p) + '<br>' : ''}${TIPS}`, 'app/plan');
    bindKid(planView);
    $$('[data-rm]').forEach(b => b.onclick = () => { p.subjects = p.subjects.filter(s => s.name !== b.dataset.rm); draw(); });
    $('#ad').onclick = () => { const nm = $('#sn').value.trim(); if (nm) { p.subjects.push({ name: nm, priority: +$('#sp').value || p.subjects.length + 1 }); draw(); } };
    $$('[data-v]').forEach(b => b.onclick = () => { p.view = b.dataset.v; p.exam = $('#ex').value; p.hours = +$('#hr').value || 2; draw(); });
    $('#gn').onclick = async () => { p.exam = $('#ex').value; p.hours = +$('#hr').value || 2; try { await api('PUT', '/parent/plan/' + k.id, p); shown = true; draw(); toast('Study plan saved'); } catch (x) { $('#er').textContent = x.message; } };
  };
  draw();
}

// ---------- parent overview ----------
async function parentHome() {
  const kids = await api('GET', '/parent/children'), k = kids[Math.min(kidIdx, kids.length - 1)];
  shell(`<h1>Overview</h1><form class="card row" id="lf"><div class="field" style="margin:0"><label for="cd">Add a child with their family code</label><input id="cd" maxlength="6" placeholder="e.g. K7M2QX" required></div><button class="btn">Link learner</button><span class="err" id="er"></span></form><br>${kidPick(kids)}
${k ? `<div class="card"><div class="row between"><h2 style="margin:0">${esc(k.name)} <span class="tag">Grade ${k.grade ?? '?'}</span></h2><button class="btn ghost sm" data-un="${k.id}">Unlink</button></div>
<p class="muted">Last active: ${ago(k.last_seen)}</p><div class="grid"><div class="stat card"><b>${k.xp}</b>XP</div><div class="stat card"><b>${k.stats.lessons}</b>lessons done</div><div class="stat card"><b>${k.streak}</b>day streak</div><div class="stat card"><b>${esc(k.journey.name)}</b>stage</div></div>
<h3>Subject progress</h3>${k.subjects.map(s => `<div>${ic(SUBJ_ICON[s.icon], 16)} ${esc(s.name)} · ${s.done}/${s.total} lessons${s.avg != null ? ' · average quiz ' + s.avg + '%' : ''} · ${LVN[s.level - 1]}${bar(Math.round(100 * s.done / s.total))}</div>`).join('') || '<p class="muted">Grade not chosen yet.</p>'}
<div class="row"><a class="btn" href="#/app/report">${ic('file')} View report card</a><a class="btn ghost" href="#/app/classroom">${ic('grid')} Classroom</a><a class="btn ghost" href="#/app/plan">${ic('calendar')} Study plan</a></div>
<h3>Completed lessons</h3><div class="scroll">${k.lessons.length ? `<table><tr><th>Lesson</th><th>Subject</th><th>Best quiz</th><th>Attempts</th></tr>${k.lessons.map(l => `<tr><td>${esc(l.title)}</td><td>${esc(l.subject)}</td><td>${l.best ? l.best + '%' : '-'}</td><td>${l.attempts}</td></tr>`).join('')}</table>` : '<p class="muted">Nothing completed yet.</p>'}</div></div>` : '<p class="muted">No children linked yet. Ask your child for the family code in their Settings page.</p>'}`, 'app');
  bindKid(parentHome);
  $('#lf').onsubmit = async e => { e.preventDefault(); try { await api('POST', '/parent/link', { code: $('#cd').value }); parentHome(); } catch (x) { $('#er').textContent = x.message; } };
  $$('[data-un]').forEach(b => b.onclick = async () => { if (confirm('Unlink this learner?')) { await api('DELETE', '/parent/link/' + b.dataset.un); kidIdx = 0; parentHome(); } });
}

// ---------- admin ----------
async function adminHome() {
  const s = await api('GET', '/admin/stats'), mx = Math.max(1, ...s.grades.map(g => g.n));
  shell(`<h1>Platform overview</h1><div class="grid">${[['learners', 'Registered learners', 'users'], ['parents', 'Parents and guardians', 'user'], ['teachers', 'Teachers and tutors', 'user'], ['classrooms', 'Classrooms', 'grid'], ['active7', 'Active (7 days)', 'activity'], ['lessonsDone', 'Lessons completed', 'check'], ['quizzes', 'Quizzes taken', 'target'], ['avgScore', 'Average quiz score %', 'chart'], ['lessons', 'Lessons in curriculum', 'book'], ['newEnquiries', 'New enquiries', 'mail']].map(([k, l, i]) => `<div class="card stat">${ic(i, 24)}<b data-count="${s[k]}">0</b>${l}</div>`).join('')}</div><br>
<div class="grid"><div class="card"><h2>Grade distribution</h2>${s.grades.map(g => `<div>Grade ${g.grade}: ${g.n}${bar(Math.round(100 * g.n / mx))}</div>`).join('') || '<p class="muted">No learners have chosen a grade yet.</p>'}</div>
<div class="card scroll"><h2>Learning progress by subject</h2><table><tr><th>Subject</th><th>Lessons</th><th>Completions</th><th>Avg %</th></tr>${s.subjects.map(r => `<tr><td>${esc(r.name)}</td><td>${r.lessons}</td><td>${r.completions}</td><td>${r.avg ?? '-'}</td></tr>`).join('')}</table></div></div>`, 'app');
}
async function users() {
  shell(`<h1>Users</h1><div class="row"><input id="q" placeholder="Search name or email" style="max-width:300px" aria-label="Search users"><select id="rf" style="max-width:180px" aria-label="Filter role"><option value="">All roles</option><option>learner</option><option>parent</option><option>teacher</option><option>admin</option></select></div><div class="card scroll" id="ut"></div>`, 'app/users');
  const load = async () => {
    const u = await api('GET', `/admin/users?q=${encodeURIComponent($('#q').value)}&role=${$('#rf').value}`);
    $('#ut').innerHTML = `<table><tr><th>Name</th><th>Email</th><th>Role</th><th>Grade</th><th>XP</th><th>Last seen</th><th>Actions</th></tr>${u.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${x.role}</td><td>${x.grade ?? '-'}</td><td>${x.xp ?? '-'}</td><td>${ago(x.last_seen)}</td><td class="row" style="margin:0"><button class="btn ghost sm" data-t="${x.id}" data-a="${x.active}">${x.active ? 'Deactivate' : 'Activate'}</button><button class="btn ghost sm" data-pw="${x.id}">Reset password</button>${['parent', 'admin'].includes(x.role) ? `<button class="btn ghost sm" data-r="${x.id}" data-ro="${x.role === 'admin' ? 'parent' : 'admin'}">Make ${x.role === 'admin' ? 'parent' : 'admin'}</button>` : ''}${x.role === 'teacher' ? `<button class="btn ghost sm" data-vf="${x.id}" data-v="${x.verified ? 1 : 0}">${x.verified ? 'Remove verification' : 'Verify teacher'}</button>` : ''}<button class="btn red sm" data-d="${x.id}">Delete</button></td></tr>`).join('')}</table>`;
    const act = (sel, fn) => $$(sel, $('#ut')).forEach(b => b.onclick = async () => { try { await fn(b); load(); } catch (e) { toast(e.message); } });
    act('[data-t]', b => api('PATCH', '/admin/users/' + b.dataset.t, { active: b.dataset.a !== '1' }));
    act('[data-vf]', b => api('PATCH', '/admin/users/' + b.dataset.vf, { verified: b.dataset.v !== '1' }));
    act('[data-r]', b => api('PATCH', '/admin/users/' + b.dataset.r, { role: b.dataset.ro }));
    act('[data-pw]', async b => { const p = prompt('New password (8+ characters):'); if (p) { await api('PATCH', '/admin/users/' + b.dataset.pw, { password: p }); toast('Password updated'); } });
    act('[data-d]', async b => { if (confirm('Delete this user and all their data?')) await api('DELETE', '/admin/users/' + b.dataset.d); });
  };
  let t; $('#q').oninput = () => { clearTimeout(t); t = setTimeout(load, 250); }; $('#rf').onchange = load; load();
}
async function curriculum() {
  const subs = await api('GET', '/admin/subjects'); let sub = subs[0].id, grade = 1, edit = null;
  const draw = async () => {
    const ls = await api('GET', `/admin/lessons?subject=${sub}&grade=${grade}`), e = edit === 'new' ? { title: '', module: '', steps: [], kind: 'static', xp: 15, mins: 12, mnemonic: '', example: '' } : ls.find(l => l.id === edit);
    let lastMod = '';
    shell(`<h1>Curriculum</h1><div class="row"><select id="s" aria-label="Subject" style="max-width:340px">${subs.map(x => `<option value="${x.id}" ${x.id === sub ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><select id="g" aria-label="Grade" style="max-width:140px">${[1, 2, 3, 4, 5, 6, 7].map(g => `<option value="${g}" ${g === grade ? 'selected' : ''}>Grade ${g}</option>`).join('')}</select><button class="btn sm" id="nw">${ic('plus', 16)} New lesson</button></div>
<div class="grid"><div class="card"><h2>Lessons</h2>${ls.map(l => { const h = l.module !== lastMod ? `<h3 style="margin-top:14px">${esc(l.module)}</h3>` : ''; lastMod = l.module; return `${h}<div class="row"><b>${l.pos}. ${esc(l.title)}</b><span class="tag">${l.kind === 'static' ? 'key-word quiz' : 'auto maths: ' + l.kind}</span><button class="btn ghost sm" data-e="${l.id}">Edit</button><button class="btn red sm" data-x="${l.id}">Delete</button></div>`; }).join('') || '<p class="muted">No lessons for this grade yet.</p>'}</div>
${e ? `<form class="card" id="lf"><h2>${edit === 'new' ? 'New lesson' : 'Edit lesson'}</h2><div class="field"><label for="md">Module</label><input id="md" required value="${esc(e.module)}"></div><div class="field"><label for="t">Title</label><input id="t" required value="${esc(e.title)}"></div>
<div class="field"><label for="st">Steps, one per line. Mark key words with *asterisks* (quizzes are built from them)</label><textarea id="st" required>${esc(e.steps.join('\n'))}</textarea></div>
<div class="field"><label for="mn">Mnemonic</label><input id="mn" value="${esc(e.mnemonic)}"></div><div class="field"><label for="ex">Interest example. Use {thing} {things} {place} {group} {hero} {action}</label><textarea id="ex">${esc(e.example)}</textarea></div>
<div class="field"><label for="k">Quiz type</label><select id="k">${['static', 'add', 'sub', 'mul', 'div', 'frac', 'geo', 'pattern', 'word'].map(k => `<option value="${k}" ${e.kind === k ? 'selected' : ''}>${k === 'static' ? 'Key-word activities' : 'Auto-generated maths: ' + k}</option>`).join('')}</select></div>
<div class="row"><div class="field" style="margin:0"><label for="xp">XP</label><input id="xp" type="number" min="5" max="200" value="${e.xp}"></div><div class="field" style="margin:0"><label for="mi">Minutes</label><input id="mi" type="number" min="3" max="90" value="${e.mins}"></div></div><p class="err" id="er"></p><button class="btn">Save lesson</button></form>` : ''}</div>`, 'app/curriculum');
    $('#s').onchange = ev => { sub = +ev.target.value; edit = null; draw(); }; $('#g').onchange = ev => { grade = +ev.target.value; edit = null; draw(); }; $('#nw').onclick = () => { edit = 'new'; draw(); };
    $$('[data-e]').forEach(b => b.onclick = () => { edit = +b.dataset.e; draw(); });
    $$('[data-x]').forEach(b => b.onclick = async () => { if (confirm('Delete this lesson?')) { await api('DELETE', '/admin/lessons/' + b.dataset.x); edit = null; draw(); } });
    if ($('#lf')) $('#lf').onsubmit = async ev => { ev.preventDefault(); try { await api(edit === 'new' ? 'POST' : 'PUT', '/admin/lessons' + (edit === 'new' ? '' : '/' + edit), { subject_id: sub, grade, module: $('#md').value, title: $('#t').value, steps: $('#st').value.split('\n'), mnemonic: $('#mn').value, example: $('#ex').value, kind: $('#k').value, xp: +$('#xp').value, mins: +$('#mi').value }); edit = null; toast('Lesson saved'); draw(); } catch (x) { $('#er').textContent = x.message; } };
  };
  draw();
}
async function enquiries() {
  let f = '';
  const draw = async () => {
    const rows = await api('GET', '/admin/enquiries?status=' + f), opts = v => ['new', 'in_progress', 'resolved'].map(s => `<option value="${s}" ${v === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('');
    shell(`<h1>Enquiries</h1><div class="row"><label for="sf">Show</label><select id="sf" style="max-width:200px"><option value="">All</option>${opts(f)}</select></div>
${rows.map(r => `<div class="card" style="margin-bottom:14px"><div class="row between"><b>${esc(r.name)}</b><span class="tag">${r.status.replace('_', ' ')}</span></div><p class="muted"><a href="mailto:${esc(r.email)}">${esc(r.email)}</a> · ${ago(r.created)}</p><p>${esc(r.message)}</p>
<div class="row"><select data-s="${r.id}" aria-label="Status">${opts(r.status)}</select></div><textarea data-n="${r.id}" aria-label="Internal note" placeholder="Internal note">${esc(r.note)}</textarea><div class="row"><button class="btn sm" data-sv="${r.id}">Save</button><button class="btn red sm" data-dl="${r.id}">Delete</button></div></div>`).join('') || '<p class="muted">No enquiries.</p>'}`, 'app/enquiries');
    $('#sf').onchange = e => { f = e.target.value; draw(); };
    $$('[data-sv]').forEach(b => b.onclick = async () => { const id = b.dataset.sv; await api('PATCH', '/admin/enquiries/' + id, { status: $(`[data-s="${id}"]`).value, note: $(`[data-n="${id}"]`).value }); toast('Updated'); draw(); });
    $$('[data-dl]').forEach(b => b.onclick = async () => { if (confirm('Delete this enquiry?')) { await api('DELETE', '/admin/enquiries/' + b.dataset.dl); draw(); } });
  };
  draw();
}
