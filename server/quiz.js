// Interest-themed question engine. Every quiz is rebuilt from scratch, so questions change each time, by grade, and by the learner's interests.
export const THEMES = {
  Football: { name: 'Football', thing: 'football', things: 'footballs', place: 'stadium', group: 'team', action: 'kick', hero: 'striker', actor: 'team', does: 'scores', unit: 'goal', units: 'goals', event: 'match', events: 'matches', field: 'football pitch', domain: 'in football' },
  Netball: { name: 'Netball', thing: 'netball', things: 'netballs', place: 'court', group: 'squad', action: 'shoot', hero: 'goal shooter', actor: 'netball squad', does: 'scores', unit: 'goal', units: 'goals', event: 'game', events: 'games', field: 'netball court', domain: 'in netball' },
  Music: { name: 'Music', thing: 'song', things: 'songs', place: 'stage', group: 'band', action: 'sing', hero: 'singer', actor: 'band', does: 'plays', unit: 'song', units: 'songs', event: 'show', events: 'shows', field: 'stage', domain: 'in music' },
  Animals: { name: 'Animals', thing: 'puppy', things: 'puppies', place: 'zoo', group: 'herd', action: 'feed', hero: 'zookeeper', actor: 'zookeeper', does: 'feeds', unit: 'animal', units: 'animals', event: 'zoo visit', events: 'zoo visits', field: 'zoo enclosure', domain: 'about animals' },
  Art: { name: 'Art', thing: 'paintbrush', things: 'paintbrushes', place: 'art studio', group: 'art class', action: 'paint', hero: 'artist', actor: 'artist', does: 'paints', unit: 'painting', units: 'paintings', event: 'class', events: 'classes', field: 'mural wall', domain: 'in art' },
  Gaming: { name: 'Gaming', thing: 'game coin', things: 'game coins', place: 'arcade', group: 'guild', action: 'collect', hero: 'gamer', actor: 'gamer', does: 'collects', unit: 'coin', units: 'coins', event: 'level', events: 'levels', field: 'game map', domain: 'in gaming' },
  Space: { name: 'Space', thing: 'star', things: 'stars', place: 'space station', group: 'crew', action: 'explore', hero: 'astronaut', actor: 'crew', does: 'discovers', unit: 'planet', units: 'planets', event: 'mission', events: 'missions', field: 'space station deck', domain: 'in space' },
  Dinosaurs: { name: 'Dinosaurs', thing: 'dinosaur', things: 'dinosaurs', place: 'fossil site', group: 'herd', action: 'dig up', hero: 'palaeontologist', actor: 'fossil hunter', does: 'digs up', unit: 'fossil', units: 'fossils', event: 'dig', events: 'digs', field: 'dig site', domain: 'about dinosaurs' },
  Cars: { name: 'Cars', thing: 'toy car', things: 'toy cars', place: 'race track', group: 'pit crew', action: 'race', hero: 'driver', actor: 'driver', does: 'completes', unit: 'lap', units: 'laps', event: 'race', events: 'races', field: 'race track', domain: 'in motor racing' },
};
export const DEFAULT_THEME = THEMES.Space;
export const themesFor = interests => { const t = (interests || []).map(i => THEMES[i]).filter(Boolean); return t.length ? t : [DEFAULT_THEME]; };
export const fillTokens = (t, th) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => th[k] ?? m);
export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[ri(0, a.length - 1)];
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const k = ri(0, i); [a[i], a[k]] = [a[k], a[i]]; } return a; };
export const keywords = step => [...String(step).matchAll(/\*(.+?)\*/g)].map(m => m[1]);
export const plain = s => String(s).replace(/\*/g, '');
const cap = s => s[0].toUpperCase() + s.slice(1);

// ---- vocabulary banks: tier|term|meaning (tier 1 = Grades 1-3, 2 = Grades 4-6, 3 = Grade 7) ----
const RAW = {
Football: `1|goalkeeper|the player who protects the goal and may use their hands
1|striker|a player whose main job is to score goals
1|referee|the official who makes sure the rules are followed
2|defend|to protect your goal from the other team's attacks
2|dribble|to move the ball along with small touches of your feet
2|penalty|a free shot at goal after a foul inside the box
3|offside|when an attacker is closer to the goal than both the ball and the second-last defender
3|tactics|the plan a team uses to try to win a match
3|possession|having control of the ball for your team`,
Netball: `1|court|the area where a netball game is played
1|pass|to throw the ball to a teammate
1|shooter|a player who scores by putting the ball through the hoop
2|intercept|to catch a pass that was meant for the other team
2|footwork|the rule about how you may move your feet while holding the ball
2|defend|to guard an opponent and try to stop their pass or shot
3|obstruction|standing too close to the player with the ball
3|centre pass|the pass that restarts play in the middle after each goal
3|strategy|a clever plan for how the team will play`,
Music: `1|rhythm|a pattern of long and short sounds
1|melody|the tune of a song
1|instrument|something you play to make music
2|tempo|how fast or slow music is played
2|chorus|the part of a song that repeats
2|harmony|different notes that sound good together
3|crescendo|music that gradually gets louder
3|composer|a person who writes music
3|pitch|how high or low a note sounds`,
Animals: `1|habitat|the natural home of an animal
1|herd|a group of animals that live together
1|predator|an animal that hunts other animals
2|prey|an animal that is hunted by other animals
2|herbivore|an animal that eats only plants
2|nocturnal|active at night and asleep during the day
3|camouflage|colours or patterns that help an animal hide
3|migration|a long journey animals make each year to find food or warmth
3|endangered|at risk of disappearing forever`,
Art: `1|canvas|strong cloth that artists paint on
1|sketch|a quick, simple drawing
1|palette|a board or tray for mixing paint
2|portrait|a picture of a person
2|landscape|a picture of nature and scenery
2|shade|a colour made darker by adding black
3|perspective|a way to make flat drawings look deep and real
3|abstract|art that uses shapes and colours instead of real-looking things
3|sculpture|art made by shaping materials in three dimensions`,
Gaming: `1|level|a stage of a game that you must finish
1|player|a person who takes part in a game
1|avatar|the character that represents you in a game
2|strategy|a plan to help you win
2|objective|the goal you must achieve in a game or level
2|multiplayer|a game that many people can play together
3|algorithm|a set of steps a computer follows to solve a problem
3|respawn|to come back into a game after being defeated
3|latency|the delay between pressing a button and seeing the result`,
Space: `1|planet|a large round object that orbits a star
1|rocket|a vehicle that blasts off into space
1|astronaut|a person trained to travel in space
2|orbit|the curved path of one object around another
2|gravity|the force that pulls objects towards each other
2|galaxy|a huge group of stars, gas and dust
3|telescope|an instrument that makes faraway objects look closer
3|satellite|an object that orbits a planet
3|asteroid|a small rocky body that orbits the Sun`,
Dinosaurs: `1|fossil|the preserved remains or print of a living thing from long ago
1|extinct|no longer alive anywhere on Earth
1|skeleton|all the bones in a body
2|carnivore|an animal that eats meat
2|palaeontologist|a scientist who studies fossils
2|reptile|a cold-blooded animal with scales
3|Jurassic|a time period when many famous dinosaurs lived
3|excavation|carefully digging to uncover buried fossils
3|adaptation|a feature that helps a living thing survive`,
Cars: `1|engine|the part that makes a car go
1|wheel|a round part that turns to move a car
1|driver|the person who controls a car
2|speedometer|a dial that shows how fast you are travelling
2|pit stop|a quick stop in a race to change tyres or refuel
2|brake|the part that slows or stops a car
3|aerodynamics|how air flows around something that is moving
3|acceleration|how quickly your speed increases
3|fuel efficiency|how far a car can travel using only a little fuel`,
};
const VOC = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, v.split('\n').map(l => { const [t, term, def] = l.split('|'); return { tier: +t, term, def }; })]));
const bank = th => VOC[th.name] || VOC.Space;
function vocPool(th, g, used) {
  const tier = g <= 3 ? 1 : g <= 6 ? 2 : 3, all = bank(th);
  let p = all.filter(t => t.tier <= tier && t.tier >= Math.max(1, tier - 1) && !used.has(t.term));
  if (p.length < 1) p = all.filter(t => !used.has(t.term)); if (p.length < 1) p = all;
  return p;
}
const others = (th, t, n) => shuffle(bank(th).filter(x => x.term !== t.term)).slice(0, n);

function vocMcq(th, g, used, ctx) {
  const t = pick(vocPool(th, g, used)); used.add(t.term); const o = shuffle([t, ...others(th, t, 3)]);
  return { type: 'mcq', ctx, q: `What does the word "${t.term}" mean ${th.domain}?`, options: o.map(x => cap(x.def)), answer: o.indexOf(t),
    hints: [`Think about how "${t.term}" is used ${th.domain}.`, `The meaning starts with the letter "${t.def[0].toUpperCase()}".`], explain: `"${t.term}" means ${t.def}. Link the word to what you see ${th.domain} to remember it.`, show: cap(t.def) };
}
function vocTF(th, g, used, ctx) {
  const t = pick(vocPool(th, g, used)); used.add(t.term); const yes = Math.random() < .5, wrong = others(th, t, 1)[0];
  return { type: 'mcq', ctx, q: `True or false: "${t.term}" means ${(yes ? t : wrong).def}.`, options: ['True', 'False'], answer: yes ? 0 : 1,
    hints: ['Say the word and its meaning together. Do they fit?', yes ? 'This meaning has not been changed.' : 'This meaning belongs to a different word.'], explain: yes ? `True. "${t.term}" means ${t.def}.` : `False. "${t.term}" means ${t.def}, not ${wrong.def}.`, show: yes ? 'True' : 'False' };
}
function vocBlank(th, g, used, ctx) {
  const t = pick(vocPool(th, g, used)); used.add(t.term); const b = shuffle([t.term, ...others(th, t, 2).map(x => x.term)]);
  return { type: 'blank', ctx, q: 'Drag the missing word into the sentence.', sentence: `"_____" means ${t.def}.`, bank: b, answer: t.term, hints: [`Think about which word is used ${th.domain}.`, `The word starts with "${t.term[0]}".`], explain: `"${t.term}" means ${t.def}.`, show: t.term };
}
function vocMatch(th, g, used, ctx) {
  const ts = shuffle([...vocPool(th, g, new Set())]).slice(0, 3), ex = others(th, ts[0], 6).find(x => !ts.includes(x));
  const b = shuffle([...ts.map(t => t.term), ...(ex ? [ex.term] : [])]);
  return { type: 'match', ctx, q: 'Drag each word to the meaning that fits.', sentences: ts.map(t => `_____ means ${t.def}.`), bank: b, answer: ts.map(t => t.term), hints: ['Start with the meaning you know best.', `One of the words is "${ts[0].term}".`], explain: ts.map(t => `"${t.term}" means ${t.def}.`).join(' '), show: ts.map(t => t.term).join(', ') };
}

// ---- maths: themed word problems, scaled to grade and adaptive level ----
const scale = (g, lv) => Math.max(6, Math.round([10, 20, 99, 500, 5000, 50000, 500000][g - 1] * (lv === 1 ? 0.5 : lv === 3 ? 1.6 : 1)));
export function mathItem(kind, g, lv, th) {
  const max = scale(g, lv), U = th.units, E = th.events, A = th.actor, D = th.does; let q, a, hint, explain;
  if (kind === 'word') kind = g <= 3 ? 'add' : pick(['mul', 'sub', 'div']);
  if (kind === 'add') { const x = ri(1, max), y = ri(1, max); q = pick([`The ${A} ${D} ${x} ${U} in the first ${th.event} and ${y} ${U} in the second. How many ${U} in total?`, `The ${A} ${D} ${x} ${U} on Monday and ${y} more on Tuesday. How many ${U} altogether?`]); a = x + y; hint = 'Putting amounts together means add.'; explain = `Add the two amounts: ${x} + ${y} = ${a}. Add the ones first, then the tens and hundreds.`; }
  else if (kind === 'sub') { const x = ri(2, max), y = ri(1, x); q = `Last season the ${A} had ${x} ${U}. This season it has ${y} fewer. How many ${U} this season?`; a = x - y; hint = 'Fewer means take away.'; explain = `Take away: ${x} - ${y} = ${a}. Check by adding back: ${a} + ${y} = ${x}.`; }
  else if (kind === 'mul') { const m = g <= 2 ? 5 : g === 3 ? 10 : 12; const x = ri(2, m + (lv > 2 ? 3 : 0)), y = ri(2, m); q = pick([`If the ${A} ${D} ${y} ${U} in each of ${x} ${E}, how many ${U} in total?`, `The ${A} ${D} ${y} ${U} every ${th.event} for ${x} ${E}. How many ${U} in total?`]); a = x * y; hint = 'The same amount again and again means multiply.'; explain = `${x} groups of ${y} is ${x} x ${y} = ${a}. You can also add ${y} a total of ${x} times.`; }
  else if (kind === 'div') { const lim = g <= 3 ? 5 : 12; const y = ri(2, lim), x = ri(2, lim + lv * 2); q = `The ${A} ${D} ${x * y} ${U} over ${y} ${E}, the same number each ${th.event}. How many ${U} each ${th.event}?`; a = x; hint = 'Sharing equally means divide.'; explain = `${x * y} divided by ${y} = ${a}, because ${a} x ${y} = ${x * y}.`; }
  else if (kind === 'frac') { const d = [2, 3, 4, 5, 10][ri(0, g < 4 ? 2 : 4)]; const n = ri(2, lv * 4 + 2) * d; q = `The ${A} has ${n} ${U}. What is 1/${d} of them?`; a = n / d; hint = `Share ${n} equally into ${d} groups.`; explain = `1/${d} of ${n} means ${n} divided by ${d}. ${n} / ${d} = ${a}.`; }
  else if (kind === 'geo') {
    const w = ri(2, 6 + lv * 4), l = ri(w + 1, w + 8);
    if (g >= 6 && ri(0, 1)) { q = `A ${th.field} is ${l} m long and ${w} m wide. What is its area in square metres?`; a = l * w; hint = 'Area = length x width.'; explain = `Area = length x width = ${l} x ${w} = ${a} square metres.`; }
    else { q = `A ${th.field} is ${l} m long and ${w} m wide. What is its perimeter (the distance all the way round) in metres?`; a = 2 * (l + w); hint = 'Add all four sides.'; explain = `Perimeter = ${l} + ${w} + ${l} + ${w} = ${a} metres, or 2 x (${l} + ${w}) = ${a}.`; }
  }
  else { const s = ri(1, 10), d = [2, 5, 10, 3, 4][ri(0, g < 3 ? 2 : 4)]; const seq = [0, 1, 2, 3].map(i => s + i * d); q = `The ${A} ${D} ${seq.join(', ')} ${U} in four ${E} in a row. How many ${U} in the next ${th.event}?`; a = s + 4 * d; hint = 'Look at how much it goes up each time.'; explain = `The rule is add ${d} each time: ${seq[3]} + ${d} = ${a}.`; }
  return { a, q, hint, explain };
}
function numOptions(a) {
  const set = new Set([a]); const spread = Math.max(3, Math.round(a * 0.2)); let t = 0;
  while (set.size < 4 && t++ < 80) { const v = a + ri(-spread, spread); if (v >= 0 && v !== a) set.add(v); }
  const o = shuffle([...set]); return { options: o.map(String), answer: o.indexOf(a) };
}
function mathMcq(kind, g, lv, th, ctx) { const m = mathItem(kind, g, lv, th), o = numOptions(m.a); return { type: 'mcq', ctx, q: m.q, options: o.options, answer: o.answer, hints: [m.hint, 'Work it out on paper, then pick the option that matches.'], explain: m.explain, show: o.options[o.answer] }; }
function mathNum(kind, g, lv, th, ctx) { const m = mathItem(kind, g, lv, th), len = String(m.a).length; return { type: 'num', ctx, q: m.q, answer: m.a, hints: [m.hint, `The answer has ${len} digit${len > 1 ? 's' : ''}.`], explain: m.explain, show: String(m.a) }; }
function mathTF(kind, g, lv, th, ctx) {
  const yes = Math.random() < .5; let z, shown, q, why;
  if (['mul', 'div', 'frac', 'geo'].includes(kind)) { const m = g <= 2 ? 5 : g === 3 ? 10 : 12, x = ri(2, m), y = ri(2, m); z = x * y; shown = yes ? z : z + pick([-y, y, -x, x, 10]); q = `${x} ${th.events} with ${y} ${th.units} in each is ${shown} ${th.units} altogether.`; why = `${x} x ${y} = ${z}`; }
  else if (kind === 'sub') { const mx = scale(g, lv), x = ri(2, mx), y = ri(1, x); z = x - y; shown = yes ? z : Math.max(0, z + pick([-2, -1, 1, 2, 10])); q = `The ${th.actor} had ${x} ${th.units} and ${y} were used. That leaves ${shown} ${th.units}.`; why = `${x} - ${y} = ${z}`; }
  else { const mx = scale(g, lv), x = ri(1, mx), y = ri(1, mx); z = x + y; shown = yes ? z : z + pick([-2, -1, 1, 2, 10]); q = `The ${th.actor} ${th.does} ${x} ${th.units} in one ${th.event} and ${y} in the next. That is ${shown} ${th.units} in total.`; why = `${x} + ${y} = ${z}`; }
  const real = shown === z;
  return { type: 'mcq', ctx, q: `True or false: ${q}`, options: ['True', 'False'], answer: real ? 0 : 1, hints: ['Work out the answer yourself first, then compare.', 'Check each number in the sentence carefully.'], explain: real ? `True. ${why}.` : `False. The correct amount is ${z}, because ${why}.`, show: real ? 'True' : 'False' };
}
function mathOrder(g, lv, ctx) {
  const max = [10, 20, 99, 500, 5000, 50000, 500000][g - 1] * (lv === 3 ? 2 : 1); const s = new Set(); while (s.size < 4) s.add(ri(1, max));
  const items = shuffle([...s].map(String)), sorted = [...s].sort((a, b) => a - b).map(String);
  return { type: 'order', ctx, q: 'Drag the numbers into order from smallest to biggest.', items, answer: sorted.map(v => items.indexOf(v)), hints: ['Compare the digits on the left first: more digits means a bigger number.', `The smallest number is ${sorted[0]}.`], explain: `Compare place values from the left. The correct order is ${sorted.join(', ')}.`, show: sorted.join(' < ') };
}

// ---- lesson key-word activities (used for every subject, themed by scene) ----
const GENERIC = ['planet', 'river', 'rhythm', 'garden', 'window', 'bridge', 'season', 'market'];
const distractors = (ans, pool, n) => shuffle([...new Set([...pool, ...GENERIC].map(w => w.trim()).filter(w => w && w.toLowerCase() !== String(ans).toLowerCase()))]).slice(0, n);
const blankOf = step => plain(step.replace(/\*(.+?)\*/, '_____'));
const scene = (th, i) => [`Warm-up for the ${th.group} at the ${th.place}`, `Next play at the ${th.place}`, `Power move for a ${th.hero}`, `Bonus round at the ${th.place}`, `Final challenge for the ${th.hero}`][i % 5];
function lessonQs(title, steps, pool, th, i) {
  const S = steps.filter(s => keywords(s).length), k = j => keywords(S[j % S.length])[0];
  return {
    mcq(j) { const a = k(j), o = shuffle([a, ...distractors(a, pool, 3)]); return { type: 'mcq', ctx: scene(th, i), q: `Which key word belongs to the lesson "${title}"?`, options: o, answer: o.indexOf(a), hints: ['Think back to the lesson steps. It is the word that was highlighted.', `It starts with the letter "${a[0].toUpperCase()}".`], explain: `"${a}" is a key word in this lesson: ${plain(S[j % S.length])}`, show: a }; },
    cloze(j) { const a = k(j), o = shuffle([a, ...distractors(a, pool, 3)]); return { type: 'mcq', ctx: scene(th, i), q: `Complete the sentence: ${blankOf(S[j % S.length])}`, options: o, answer: o.indexOf(a), hints: ['Say the sentence in your head with each option.', `The answer has ${a.length} letters.`], explain: `The answer is "${a}": ${plain(S[j % S.length])}`, show: a }; },
    blank(j) { const a = k(j), o = shuffle([a, ...distractors(a, pool, 2)]); return { type: 'blank', ctx: scene(th, i), q: 'Drag the missing word into the sentence.', sentence: blankOf(S[j % S.length]), bank: o, answer: a, hints: ['Re-read the step in the lesson. Which word is highlighted?', `The word starts with "${a[0]}".`], explain: `The missing word is "${a}". Full sentence: ${plain(S[j % S.length])}`, show: a }; },
    tf(j) { const a = k(j), yes = Math.random() < .5, w = distractors(a, pool, 1)[0], s = S[j % S.length]; return { type: 'mcq', ctx: scene(th, i), q: `True or false: ${yes ? plain(s) : plain(s.replace(/\*(.+?)\*/, w))}`, options: ['True', 'False'], answer: yes ? 0 : 1, hints: ['Check whether every word matches what you learned.', yes ? 'Nothing in this sentence has been changed.' : 'One word has been swapped.'], explain: yes ? `True. The lesson says: ${plain(s)}` : `False. The correct sentence is: ${plain(s)}`, show: yes ? 'True' : 'False' }; },
    match() { const sent = S.slice(0, 3), ans = sent.map(s => keywords(s)[0]), b = shuffle([...ans, ...distractors(ans[0], pool, 1)]); return { type: 'match', ctx: scene(th, i), q: 'Drag each word into the sentence where it belongs.', sentences: sent.map(blankOf), bank: b, answer: ans, hints: ['Do the sentence you are most sure of first.', `One of the words is "${ans[0]}".`], explain: sent.map(plain).join(' '), show: ans.join(', ') }; },
  };
}
export const quizName = (slug, kind, title) => ['hl', 'fal'].includes(slug) ? 'Vocabulary Builder' : slug === 'maths' ? ({ add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division', frac: 'Fractions', geo: 'Geometry', pattern: 'Patterns', word: 'Problem Solving' }[kind] || 'Mathematics') + ' Mastery' : `${title} Challenge`;

/** Builds a 5-question mixed-activity quiz. Each question picks one of the learner's interests at random. */
export function buildLessonQuiz({ title, steps, kind, grade, level, themes, pool = [], slug }) {
  const T = () => pick(themes), used = new Set(), sc = i => scene(T(), i);
  if (kind !== 'static') return [mathMcq(kind, grade, level, T(), sc(0)), mathNum(kind, grade, level, T(), sc(1)), mathTF(kind, grade, level, T(), sc(2)), mathOrder(grade, level, sc(3)), mathMcq(kind, grade, level, T(), sc(4))];
  const L = i => lessonQs(title, steps, pool, T(), i);
  if (['hl', 'fal'].includes(slug)) return [vocMcq(T(), grade, used, sc(0)), L(1).blank(1), vocTF(T(), grade, used, sc(2)), vocMatch(T(), grade, used, sc(3)), L(4).cloze(0)];
  return [L(0).mcq(0), L(1).blank(1), L(2).tf(2), L(3).match(), L(4).cloze(0)];
}

/** What the learner is allowed to see before submitting. */
export function publicQuestion(q, hintFirst) {
  const o = { type: q.type, ctx: q.ctx, q: q.q, hints: q.hints };
  if (q.type === 'mcq') { o.options = q.options; o.eliminate = q.options.map((_, i) => i).filter(i => i !== q.answer).slice(0, 2); }
  if (q.type === 'blank') { o.sentence = q.sentence; o.bank = q.bank; }
  if (q.type === 'match') { o.sentences = q.sentences; o.bank = q.bank; }
  if (q.type === 'order') o.items = q.items;
  o.showHint = !!hintFirst; return o;
}
const norm = v => String(v ?? '').trim().toLowerCase();
/** Returns a score between 0 and 1. */
export function gradeQ(q, a) {
  if (q.type === 'mcq') return a === q.answer ? 1 : 0;
  if (q.type === 'blank') return norm(a) === norm(q.answer) ? 1 : 0;
  if (q.type === 'num') return Number(a) === q.answer && String(a).trim() !== '' ? 1 : 0;
  if (q.type === 'match') return Array.isArray(a) ? q.answer.filter((w, i) => norm(a[i]) === norm(w)).length / q.answer.length : 0;
  if (q.type === 'order') return Array.isArray(a) ? q.answer.filter((v, i) => a[i] === v).length / q.answer.length : 0;
  return 0;
}
