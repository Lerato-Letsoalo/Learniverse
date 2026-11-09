// AI Teaching Assistant, powered by the Groq API (free-tier open models). Set GROQ_API_KEY; optionally GROQ_MODEL.
// Default model: llama-3.3-70b-versatile, with automatic fallback to llama-3.1-8b-instant.
export const SYSTEM = `You are the Learniverse Teaching Assistant, helping South African teachers and private tutors. Write age-appropriate content aligned to the CAPS curriculum for the grade and subject given (Grades 1 to 7). Use clear, simple language, South African context (rand, local places and names), and inclusive examples that suit learners with ADHD, autism and dyslexia: short steps, concrete examples, no clutter. Never request or include personal information about children. Everything you write is a DRAFT that the teacher will review and edit before it reaches learners. Use plain text with simple headings and numbered or dashed lists. Do not use markdown tables.`;
export const ai = {
  configured: () => !!process.env.GROQ_API_KEY,
  async chat(messages, { json = false, max = 3000, temperature = 0.4 } = {}) {
    if (!process.env.GROQ_API_KEY) throw Object.assign(new Error('The AI Teaching Assistant is not set up yet. An administrator needs to add a GROQ_API_KEY.'), { status: 503 });
    const models = [...new Set([process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'])]; let last;
    for (const model of models) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature, max_tokens: max, ...(json ? { response_format: { type: 'json_object' } } : {}) }), signal: AbortSignal.timeout(45000) }).catch(e => ({ ok: false, status: 504, text: async () => e.message }));
      if (r.ok) {
        const content = await r.json().then(data => data.choices?.[0]?.message?.content).catch(() => '');
        if (typeof content === 'string' && content.trim()) return content;
        last = 502;
        continue;
      }
      last = r.status; if (![400, 404, 429, 500, 502, 503, 504].includes(r.status)) break;
    }
    const status = [429, 503, 504].includes(last) ? last : 502;
    const message = status === 429 ? 'The AI service is busy right now. Please try again in a minute.'
      : status === 503 ? 'The AI service is temporarily unavailable. Please try again shortly.'
        : status === 504 ? 'The AI service took too long to respond. Please try again.'
          : 'The AI service could not complete that request. Please try again.';
    throw Object.assign(new Error(message), { status });
  },
};
const TASKS = {
  lesson_plan: n => `Create a complete lesson plan: CAPS-aligned learning objectives, prior knowledge, resources, an introduction, main activities with timings, assessment, differentiation (support and extension), homework and a short reflection prompt.`,
  worksheet: n => `Create a printable worksheet with a title, short instructions and ${n} questions that increase in difficulty. Finish with a separate answer memo.`,
  revision: n => `Create revision exercises: a short summary of key ideas, then ${n} practice questions with an answer memo.`,
  explanation: () => `Explain the topic simply for this age group using an analogy, a step-by-step breakdown and a quick check-for-understanding question.`,
  examples: n => `Give ${n} worked examples with South African contexts, showing every step and a one-line takeaway for each.`,
  differentiated: () => `Create three differentiated activities for the topic: Support (for learners who need more help), Core, and Extension. Give clear instructions and expected outcomes for each.`,
};
export const TASK_NAMES = [...Object.keys(TASKS), 'quiz'];
export function buildPrompt({ task, grade, subject, topic, notes, count }) {
  const ctx = `Grade ${grade}, ${subject}. Topic: ${topic}.${notes ? ` Teacher notes: ${notes}` : ''}`;
  if (task === 'quiz') return `${ctx}\nCreate a quiz of ${count} questions. Reply with JSON only in exactly this shape: {"title":"...","questions":[{"type":"mcq","q":"...","options":["...","...","...","..."],"answer":0,"explain":"..."},{"type":"short","q":"...","answers":["accepted answer","alternative"],"explain":"..."}]}. "answer" is the zero-based index of the correct option. Mix mostly multiple choice with a few short answers. Short answers must be one or two words or a number so they can be marked automatically.`;
  return `${ctx}\n${TASKS[task](count)}`;
}
export function parseQuiz(text) {
  let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); if (m) try { return JSON.parse(m[0]); } catch {} }
  return null;
}
