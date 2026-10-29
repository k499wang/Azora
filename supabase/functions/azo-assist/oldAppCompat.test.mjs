import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadCurrentAzoAssist } from './azoAssistHarness.mjs';

// Builds already on people's phones never update; these pin what each shape of request gets back.
const ask = loadCurrentAzoAssist();
const plain = (value) => JSON.parse(JSON.stringify(value));
const messages = [{ role: 'user', text: 'Clean the bathroom on Saturday, call mom, and drop the gym' }];
const todo = (title, extra = {}) => ({ source: title, title, icon: 'todo-tidy', daypart: 'start', minutes: 15, ...extra });
const greedyModel = {
  feelingOnly: false,
  kind: 'add',
  reply: 'Done.',
  todos: [todo('Clean the bathroom', { day: '2026-10-31' }), todo('call mom')],
  changes: [{ source: 'drop the gym', action: 'remove', ref: 't1' }],
};
const refs = [{ ref: 't1', title: 'Go to the gym', daypart: 'evening', minutes: 45, repeats: true, done: false }];

test('an app that only sends titles gets the add-only schema, prompt and reply it was built for', async () => {
  const { status, reply, gemini } = await ask({ mode: 'chat', messages, todos: ['Go to the gym'] }, greedyModel);
  assert.equal(status, 200);
  const schema = plain(gemini.generationConfig.responseSchema);
  assert.deepEqual(Object.keys(schema.properties).sort(), ['feelingOnly', 'kind', 'reply', 'todos']);
  assert.deepEqual(schema.properties.kind.enum, ['talk', 'offer', 'add']);
  assert.equal('day' in schema.properties.todos.items.properties, false);
  const prompt = gemini.systemInstruction.parts[0].text;
  assert.doesNotMatch(prompt, /Changing their list|Planning ahead|t1:/);
  assert.match(prompt, /of the to-do cards you suggested/);
  assert.deepEqual(Object.keys(reply).sort(), ['reply', 'todos']);
  assert.deepEqual(plain(reply.todos).map((item) => Object.keys(item).sort()), [
    ['daypart', 'icon', 'minutes', 'title'],
    ['daypart', 'icon', 'minutes', 'title'],
  ]);
});

test('an app that sends refs but no today can change its list but never plan a day', async () => {
  const { reply, gemini } = await ask({ mode: 'chat', messages, todos: ['Go to the gym'], todoRefs: refs }, greedyModel);
  const schema = plain(gemini.generationConfig.responseSchema);
  assert.equal('day' in schema.properties.todos.items.properties, false);
  assert.equal('day' in schema.properties.changes.items.properties, false);
  assert.doesNotMatch(gemini.systemInstruction.parts[0].text, /Planning ahead/);
  assert.equal(plain(reply.todos).some((item) => 'day' in item), false);
  assert.deepEqual(plain(reply.changes), [{ ref: 't1', action: 'remove' }]);
});

test('an app that sends its today can plan the day it was told', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const saturday = new Date(Date.parse(today) + 2 * 86_400_000).toISOString().slice(0, 10);
  const model = { ...greedyModel, todos: [todo('Clean the bathroom', { day: saturday })] };
  const { reply, gemini } = await ask({ mode: 'chat', messages, todos: ['Go to the gym'], todoRefs: refs, today }, model);
  assert.equal('day' in plain(gemini.generationConfig.responseSchema).properties.todos.items.properties, true);
  assert.match(gemini.systemInstruction.parts[0].text, /Planning ahead/);
  assert.equal(plain(reply.todos)[0].day, saturday);
});

test('voice notes are unchanged', async () => {
  const { status, reply } = await ask({ mode: 'transcribe', audioBase64: 'AAAA' }, { text: 'hello' });
  assert.equal(status, 200);
  assert.deepEqual(plain(reply), { text: 'hello' });
});
