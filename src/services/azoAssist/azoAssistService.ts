import { requireSupabaseClient } from '../supabase';
import { isAccessDeniedFunctionError } from '../photoCleanup/photoCleanupAccessError';
import {
  parseSuggestedTodos,
  type SuggestedTodo,
} from '../../features/azoAssist/domain/suggestedTodo';

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

export async function askAzo(input: {
  messages: AzoChatTurn[];
  todos: string[];
}): Promise<{ reply: string; todos: SuggestedTodo[]; freeMessagesLeft: number | null }> {
  const data = await invokeAzoAssist({ mode: 'chat', ...input });
  if (typeof data.reply !== 'string' || data.reply.trim().length === 0) {
    throw new Error('Azo couldn’t answer right now. Try again.');
  }
  return {
    reply: data.reply.trim(),
    todos: parseSuggestedTodos(data.todos),
    freeMessagesLeft: freeMessagesLeft(data),
  };
}
