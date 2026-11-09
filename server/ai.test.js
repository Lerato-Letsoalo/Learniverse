import assert from 'node:assert/strict';
import { ai } from './ai.js';

const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const response = content => new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

try {
  process.env.GROQ_API_KEY = 'test-key';
  delete process.env.GROQ_MODEL;
  const models = [];
  globalThis.fetch = async (_, options) => {
    const { model } = JSON.parse(options.body);
    models.push(model);
    if (models.length === 1) return new Response('', { status: 503 });
    return response('A complete AI draft.');
  };
  assert.equal(await ai.chat([]), 'A complete AI draft.');
  assert.deepEqual(models, ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
  console.log('PASS AI falls back to the backup model after a provider error');

  models.length = 0;
  globalThis.fetch = async (_, options) => {
    const { model } = JSON.parse(options.body);
    models.push(model);
    return response(models.length === 1 ? '' : 'Fallback draft.');
  };
  assert.equal(await ai.chat([]), 'Fallback draft.');
  assert.equal(models.length, 2);
  console.log('PASS AI retries empty responses instead of returning a blank draft');

  models.length = 0;
  globalThis.fetch = async (_, options) => {
    const { model } = JSON.parse(options.body);
    models.push(model);
    if (models.length === 1) throw new TypeError('Network unavailable');
    return response('Recovered after a network error.');
  };
  assert.equal(await ai.chat([]), 'Recovered after a network error.');
  assert.equal(models.length, 2);
  console.log('PASS AI falls back after a network error');
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalModel;
}
