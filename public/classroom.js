'use strict';
// ---------- shared helpers for classroom screens ----------
const STAT = { not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted', graded: 'Marked' };
const TYPE = { lesson: 'Learniverse lesson', homework: 'Homework', worksheet: 'Worksheet', quiz: 'Quiz', assessment: 'Assessment' };
const fdt = s => s ? new Date(s).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline';
const fd = s => s ? new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleDateString('en-ZA') : '-';
const stBadge = st => `<span class="st ${st === 'graded' || st === 'submitted' ? 'done' : st === 'in_progress' ? 'progress' : 'locked'}">${STAT[st] || st}</span>`;
const teacherTag = t => `${esc(t.name)} <span class="tag">${t.kind === 'tutor' ? 'Tutor' : 'Teacher'}</span>${t.organisation ? ` <span class="muted">${esc(t.organisation)}</span>` : ''} ${t.verified ? `<span class="tag ok">${ic('shield', 12)} Verified</span>` : '<span class="tag">Not yet verified</span>'}`;
const assignRow = (a, open) => `<div class="lrow ${a.overdue ? 'locked' : ''}"><div><b>${esc(a.title)}</b> <span class="tag">${TYPE[a.type]}</span><br><span class="muted">${ic('clock', 14)} ${a.due ? 'Due ' + fdt(a.due) : 'No deadline'}${a.overdue ? ' · <b class="wrong">Overdue</b>' : ''}</span>${a.feedback ? `<br><span class="muted">${ic('chat', 14)} ${esc(a.feedback)}</span>` : ''}</div>
<div class="row" style="margin:0">${stBadge(a.status)}${a.status === 'graded' && a.max ? `<span class="tag">${a.score}/${a.max} · ${a.percent}%</span>` : ''}${open ? `<a class="btn sm ${a.status === 'not_started' ? '' : 'ghost'}" href="#/app/assignment/${a.id}">${a.status === 'not_started' ? 'Start' : 'Open'}</a>` : ''}</div></div>`;
const upcoming = list => list.filter(a => a.due && !a.overdue && a.status !== 'graded' && a.status !== 'submitted').sort((x, y) => x.due.localeCompare(y.due)).slice(0, 4);
const dueBox = list => { const u = upcoming(list); return u.length ? `<div class="note"><h3>${ic('calendar', 18)} Coming up</h3>${u.map(a => `<p style="margin:4px 0">${esc(a.title)} <span class="muted">· ${fdt(a.due)}</span></p>`).join('')}</div>` : ''; };
const annBox = list => list.length ? `<h3>Announcements</h3>${list.map(a => `<div class="note"><h3>${ic('bell', 18)} ${esc(a.title)}</h3><p style="margin:0">${esc(a.body)}</p><span class="muted">${fd(a.created)}</span></div>`).join('')}` : '';
const reqCard = (r, who, path, after) => `<div class="card" style="border-color:var(--gold);margin-bottom:14px"><h3>${ic('users', 20)} Classroom request</h3><p>${teacherTag(r.teacher)} would like to add ${who} to <b>${esc(r.classroom)}</b>${r.subject ? ' (' + esc(r.subject) + ')' : ''}${r.grade ? ', Grade ' + r.grade : ''}.</p>
<p class="muted">If you approve, this ${r.teacher.kind === 'tutor' ? 'tutor' : 'teacher'} can see ${who === 'you' ? 'your' : 'their'} name, grade, lesson progress and classroom marks. Never ${who === 'you' ? 'your' : 'their'} email or family code. You can leave at any time.</p>
<label class="check"><input type="checkbox" data-pu="${r.id}" ${who === 'you' ? '' : 'checked'}> Allow this ${r.teacher.kind === 'tutor' ? 'tutor' : 'teacher'} to send learning updates to ${who === 'you' ? 'my parent or guardian' : 'me as the parent or guardian'}</label>
<div class="row"><button class="btn" data-ap="${r.id}">${ic('check')} Approve</button><button class="btn ghost" data-dc="${r.id}">Decline</button></div></div>`;
function bindReq(path, after) {
  $$('[data-ap]').forEach(b => b.onclick = async () => { await api('POST', `${path}/${b.dataset.ap}/respond`, { approve: true, parentUpdates: $(`[data-pu="${b.dataset.ap}"]`).checked }); toast('Linked. The classroom is now connected.'); after(); });
  $$('[data-dc]').forEach(b => b.onclick = async () => { await api('POST', `${path}/${b.dataset.dc}/respond`, { approve: false }); toast('Request declined'); after(); });
}
const resList = list => list.length ? `<h3>Learning resources</h3><div class="grid">${list.map(r => `<div class="card"><div class="row between" style="margin:0"><b>${esc(r.title)}</b><span class="tag">${r.kind === 'file' ? 'File' : r.kind === 'link' ? 'Link' : 'Note'}</span></div>${r.folder ? `<span class="muted">${esc(r.folder)}</span>` : ''}
${r.kind === 'link' ? `<p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open link</a></p>` : r.kind === 'file' ? `<p><a class="btn sm" href="/api/files/${r.id}" download>${ic('down', 14)} Download ${esc(r.filename)}</a></p>` : `<p style="white-space:pre-wrap">${esc(r.content)}</p>`}</div>`).join('')}</div>` : '';

// ---------- learner: Classroom tab (always present) ----------
async function classroomView() {
  const d = await api('GET', '/classroom');
  shell(`<h1>Classroom</h1>${d.requests.map(r => reqCard(r, 'you')).join('')}
${d.classrooms.length ? d.classrooms.map(c => `<section class="card" style="margin-bottom:20px"><div class="row between" style="margin-top:0"><div><h2 style="margin:0">${esc(c.name)}</h2><p class="muted" style="margin:4px 0 0">${teacherTag(c.teacher)}${c.subject ? ` · ${esc(c.subject)}` : ''}${c.grade ? ` · Grade ${c.grade}` : ''}</p></div>
<div class="stat"><b>${c.stats.completion ?? 0}%</b>work done${c.stats.average != null ? ` · average ${c.stats.average}%` : ''}</div></div>
${c.instructions ? `<div class="note"><h3>${ic('file', 18)} Instructions from your ${c.teacher.kind === 'tutor' ? 'tutor' : 'teacher'}</h3><p style="margin:0;white-space:pre-wrap">${esc(c.instructions)}</p></div>` : ''}${dueBox(c.assignments)}${annBox(c.announcements)}
<h3>Homework, worksheets, quizzes and marks</h3>${c.assignments.map(a => assignRow(a, true)).join('') || '<p class="muted">Nothing has been assigned yet.</p>'}${resList(c.resources)}
<div class="row"><label class="check"><input type="checkbox" data-pt="${c.id}" ${c.parentUpdates ? 'checked' : ''}> My ${c.teacher.kind === 'tutor' ? 'tutor' : 'teacher'} may send updates to my parent or guardian</label><button class="btn ghost sm" data-lv="${c.id}">Leave this classroom</button></div></section>`).join('')
 : `<div class="card"><div class="ibox lg">${ic('users', 30)}</div><h2>You're not part of a classroom yet</h2><p class="muted">Once your teacher or tutor links your account, your classroom activities will appear here. Until then, keep learning on your own. Your lessons, quizzes and buddy are all ready for you.</p>
<p><a class="btn" href="#/app/subjects">${ic('rocket')} Continue my lessons</a></p></div>`}
<div class="card" style="margin-top:20px"><h3>${ic('shield', 20)} Your Teacher/Tutor code</h3><p style="font-size:1.8rem;letter-spacing:.15em;font-weight:800;margin:6px 0">${esc(me.teacherCode)}</p><p class="muted">Share this code with your teacher or tutor so they can ask to add you to their classroom. You (or your parent or guardian) will always be asked to approve first. This is different from your Family Code, which is for your parent or guardian.</p></div>`, 'app/classroom');
  bindReq('/classroom/requests', classroomView);
  $$('[data-pt]').forEach(c => c.onchange = async () => { await api('POST', `/classroom/${c.dataset.pt}/parent-updates`, { on: c.checked }); toast('Saved'); });
  $$('[data-lv]').forEach(b => b.onclick = async () => { if (confirm('Leave this classroom? Your teacher will no longer see your progress. You can keep learning on your own.')) { await api('POST', `/classroom/${b.dataset.lv}/leave`); classroomView(); } });
}
async function assignmentView(id) {
  const a = await api('GET', '/classroom/assignments/' + id); let answers = (a.questions || []).map(q => q.type === 'mcq' ? null : '');
  const done = a.status === 'graded' || a.status === 'submitted';
  const body = () => {
    if (a.type === 'lesson') return `<p>Complete the lesson and its quiz in Learniverse to finish this task.</p><a class="btn alt" href="#/app/lesson/${a.lesson_id}">${ic('play')} Open the lesson</a>`;
    if (a.questions) return done ? `<div class="hook">${ic('check', 22)} You scored <b>${a.score}/${a.max}</b> (${a.percent}%).</div>${a.review ? a.questions.map((q, i) => `<div class="card" style="margin:10px 0"><b>${i + 1}. ${esc(q.q)}</b><p>${a.review[i].ok ? `<span class="good">${ic('check', 16)} Correct</span>` : `<span class="wrong">${ic('x', 16)} Not quite</span> · Answer: <b>${esc(a.review[i].shown)}</b>`}</p>${a.review[i].explain ? `<div class="note" style="margin:0"><h3>${ic('bulb', 16)} How to get it</h3>${esc(a.review[i].explain)}</div>` : ''}</div>`).join('') : '<p class="muted">Your teacher will share the answers when ready.</p>'}`
      : `<form id="af">${a.questions.map((q, i) => `<div class="card" style="margin:12px 0"><b>${i + 1}. ${esc(q.q)}</b> <span class="tag">${q.marks} mark${q.marks > 1 ? 's' : ''}</span>${q.type === 'mcq' ? q.options.map((o, k) => `<button type="button" class="opt" data-q="${i}" data-k="${k}" aria-pressed="false">${'ABCDEF'[k]}. ${esc(o)}</button>`).join('') : `<input data-s="${i}" placeholder="Type your answer" autocomplete="off" aria-label="Answer ${i + 1}">`}</div>`).join('')}<p class="err" id="er" role="alert"></p><button class="btn">Submit answers</button></form>`;
    return done ? `<div class="hook">${ic('check', 22)} ${a.status === 'graded' ? `Marked: <b>${a.score}/${a.max}</b> (${a.percent}%)` : 'Submitted. Your teacher will mark it soon.'}</div>${a.feedback ? `<div class="note"><h3>${ic('chat', 18)} Feedback</h3>${esc(a.feedback)}</div>` : ''}<h3>Your answer</h3><p style="white-space:pre-wrap">${esc(a.text)}</p>`
      : `<form id="af"><div class="field"><label for="tx">Your answer</label><textarea id="tx" maxlength="4000" required></textarea></div><p class="err" id="er" role="alert"></p><button class="btn">Hand in</button></form>`;
  };
  shell(`<p><a href="#/app/classroom">${ic('left', 16)} Classroom</a></p><section class="card"><span class="tag">${TYPE[a.type]}</span> ${stBadge(a.status)}<h1 style="font-size:2rem">${esc(a.title)}</h1><p class="muted">${ic('clock', 14)} ${a.due ? 'Due ' + fdt(a.due) : 'No deadline'}</p>${a.instructions ? `<div class="note"><h3>${ic('file', 18)} Instructions</h3><p style="margin:0;white-space:pre-wrap">${esc(a.instructions)}</p></div>` : ''}${resList(a.files)}${body()}</section>`, 'app/classroom');
  $$('.opt').forEach(b => b.onclick = () => { answers[+b.dataset.q] = +b.dataset.k; $$(`[data-q="${b.dataset.q}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $$('[data-s]').forEach(i => i.oninput = () => { answers[+i.dataset.s] = i.value; });
  if ($('#af')) $('#af').onsubmit = async e => { e.preventDefault(); try { const r = await api('POST', `/classroom/assignments/${id}/submit`, a.questions ? { answers } : { text: $('#tx').value }); if (r.score != null) confetti(); toast(r.score != null ? `You scored ${r.score}/${r.max}` : 'Handed in. Well done!'); assignmentView(id); } catch (x) { $('#er').textContent = x.message; } };
}

// ---------- parent: Classroom section ----------
async function parentClassroom() {
  const kids = await api('GET', '/parent/classroom'); if (!kids.length) return shell(`<h1>Classroom</h1><div class="card"><p class="muted">Link your child on the Overview page with their Family Code to see their classroom.</p></div>`, 'app/classroom');
  const k = kids[Math.min(kidIdx, kids.length - 1)];
  shell(`<h1>Classroom</h1>${kidPick(kids)}${k.requests.map(r => reqCard(r, esc(k.name.split(' ')[0]))).join('')}
${k.classrooms.length ? k.classrooms.map(c => { const doneN = c.assignments.filter(a => a.status === 'graded' || a.status === 'submitted'); return `<section class="card" style="margin-bottom:20px"><div class="row between" style="margin-top:0"><div><h2 style="margin:0">${esc(c.name)}</h2><p class="muted" style="margin:4px 0 0">${teacherTag(c.teacher)}${c.subject ? ` · ${esc(c.subject)}` : ''}</p></div></div>
<div class="grid"><div class="card stat"><b>${doneN.length}/${c.assignments.length}</b>assignments completed</div><div class="card stat"><b>${c.stats.average ?? '-'}${c.stats.average != null ? '%' : ''}</b>average mark</div><div class="card stat"><b>${upcoming(c.assignments).length}</b>deadlines coming up</div></div>
${c.instructions ? `<div class="note"><h3>${ic('file', 18)} Instructions</h3><p style="margin:0;white-space:pre-wrap">${esc(c.instructions)}</p></div>` : ''}${dueBox(c.assignments)}${annBox(c.announcements)}
${c.updates.length ? `<h3>Updates from the ${c.teacher.kind === 'tutor' ? 'tutor' : 'teacher'}</h3>${c.updates.map(u => `<div class="note"><h3>${ic('mail', 18)} ${esc(u.title)}</h3><p style="margin:0;white-space:pre-wrap">${esc(u.body)}</p><span class="muted">${fd(u.created)}</span></div>`).join('')}` : ''}
<h3>Homework, quizzes and marks</h3>${c.assignments.map(a => assignRow(a, false)).join('') || '<p class="muted">Nothing assigned yet.</p>'}
<div class="row"><label class="check"><input type="checkbox" data-pp="${c.id}" ${c.parentUpdates ? 'checked' : ''}> Allow this ${c.teacher.kind === 'tutor' ? 'tutor' : 'teacher'} to send me learning updates</label><button class="btn red sm" data-rv="${c.id}">Disconnect this classroom</button></div></section>`; }).join('')
 : `<div class="card"><div class="ibox lg">${ic('users', 30)}</div><h2>No classroom is connected</h2><p class="muted">${esc(k.name.split(' ')[0])} is not linked to a teacher or tutor right now. Learning on Learniverse carries on as normal. If a teacher or tutor sends a linking request using ${esc(k.name.split(' ')[0])}'s Teacher/Tutor code, it will appear here for your approval.</p></div>`}`, 'app/classroom');
  bindKid(parentClassroom); bindReq('/parent/classroom/requests', parentClassroom);
  $$('[data-pp]').forEach(c => c.onchange = async () => { await api('POST', `/parent/classroom/${c.dataset.pp}/learners/${k.id}/parent-updates`, { on: c.checked }); toast('Saved'); });
  $$('[data-rv]').forEach(b => b.onclick = async () => { if (confirm('Disconnect this classroom? The teacher will immediately lose access to your child\'s information.')) { await api('POST', `/parent/classroom/${b.dataset.rv}/learners/${k.id}/revoke`); parentClassroom(); } });
}
