import { requireSupabaseClient } from '../supabase';
import { isAccessDeniedFunctionError } from '../photoCleanup/photoCleanupAccessError';
import {
  parseSuggestedTodos,
  type SuggestedTodo,
} from '../../features/azoAssist/domain/suggestedTodo';
import {
  parseTodoChanges,
  todoRefsFor,
  type TodoChange,
} from '../../features/azoAssist/domain/todoChange';
import type { SelfCareGoal } from '../../features/selfCare/domain/selfCareGoal';

export interface AzoChatTurn {
  role: 'user' | 'azo';
  text: string;
}

export class AzoAssistAccessError extends Error {
  constructor() {
    super('Azo is available with Azora Pro.');
    this.name = 'AzoAssistAccessError';
  }
}

async function invokeAzoAssist(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await requireSupabaseClient().functions.invoke('azo-assist', { body });
  if (isAccessDeniedFunctionError(error)) throw new AzoAssistAccessError();
  if (error != null || data == null || typeof data !== 'object') {
    throw new Error('Azo couldn’t answer right now. Try again.');
  }
  return data as Record<string, unknown>;
}

/** Null for Pro, who have no count. */
function freeMessagesLeft(data: Record<string, unknown>): number | null {
  return typeof data.freeMessagesLeft === 'number' ? data.freeMessagesLeft : null;
}

/**
 * `todos` stays the plain titles an older server reads; `todoRefs` and `today`
 * are what let a newer one propose changes and plan days, and an older one
 * ignores them.
 */
export async function askAzo(input: {
  messages: AzoChatTurn[];
  /** today's list, then the one-offs planned for later days */
  goals: readonly SelfCareGoal[];
  todayLocalDate: string;
}): Promise<{ reply: string; todos: SuggestedTodo[]; changes: TodoChange[]; freeMessagesLeft: number | null }> {
  const { refs, goalsByRef } = todoRefsFor(input.goals, input.todayLocalDate);
  const data = await invokeAzoAssist({
    mode: 'chat',
    messages: input.messages,
    todos: refs.map((todo) => todo.title),
    todoRefs: refs,
    today: input.todayLocalDate,
  });
  if (typeof data.reply !== 'string' || data.reply.trim().length === 0) {
    throw new Error('Azo couldn’t answer right now. Try again.');
  }
  return {
    reply: data.reply.trim(),
    todos: parseSuggestedTodos(data.todos, input.todayLocalDate),
    changes: parseTodoChanges(data.changes, goalsByRef, input.todayLocalDate),
    freeMessagesLeft: freeMessagesLeft(data),
  };
}
