import type { Message } from '@roamind/shared';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export type LLMMessage = {
  role: Message['role'];
  content: string;
};

export interface LLMProvider {
  stream(messages: LLMMessage[], signal: AbortSignal): AsyncIterable<string>;
}
