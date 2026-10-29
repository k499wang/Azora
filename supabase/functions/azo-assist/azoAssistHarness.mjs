import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function run(source, requireModule, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(compile(source), {
    module,
    exports: module.exports,
    require: requireModule,
    console: { log() {}, error() {} },
    ...globals,
  });
  return module.exports;
}

/**
 * The real edge function, run with Supabase and Gemini faked: a Pro user, so
 * the free-message path stays out of it, and a model that answers `modelOutput`.
 * Returns what was sent to Gemini and what went back to the app.
 */
export function loadAzoAssist({ indexSource, todoChangesSource = null }) {
  let handler;
  const geminiRequests = [];
  let modelOutput = { feelingOnly: false, kind: 'talk', reply: 'Hi', todos: [] };
  const query = {
    select() { return this; },
    eq() { return this; },
    maybeSingle: async () => ({ data: { status: 'active', current_period_ends_at: null }, error: null }),
  };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) },
    from: () => query,
    rpc: async () => ({ data: true, error: null }),
  };
  const todoChanges = todoChangesSource == null ? null : run(todoChangesSource, () => ({}));
  run(indexSource, (name) => {
    if (name.startsWith('https://esm.sh/@supabase/supabase-js')) return { createClient: () => supabase };
    if (name === './todoChanges.ts' && todoChanges != null) return todoChanges;
    throw new Error(`Unexpected dependency: ${name}`);
  }, {
    Deno: {
      env: { get: (key) => `test-${key}` },
      serve: (next) => { handler = next; },
    },
    fetch: async (_url, init) => {
      geminiRequests.push(JSON.parse(init.body));
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(modelOutput) }] } }],
      }));
    },
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
  });

  return async (body, output) => {
    modelOutput = output;
    geminiRequests.length = 0;
    const response = await handler(new Request('https://example.test/azo-assist', {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: JSON.stringify(body),
    }));
    return {
      status: response.status,
      reply: await response.json(),
      gemini: geminiRequests[0] ?? null,
    };
  };
}

export function loadCurrentAzoAssist() {
  return loadAzoAssist({
    indexSource: readFileSync(new URL('./index.ts', import.meta.url), 'utf8'),
    todoChangesSource: readFileSync(new URL('./todoChanges.ts', import.meta.url), 'utf8'),
  });
}
