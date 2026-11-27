import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.js';
import type { LLMMessage } from './llm-provider.js';
import { OpenUncensoredProvider, type ChatClient } from './open-uncensored.provider.js';

const API_KEY = 'test-key';
const MODEL = 'test-model';
const FIRST_CHUNK = 'Hello';
const SECOND_CHUNK = ' world';
const EMPTY_CHUNK = '';

const MESSAGES: LLMMessage[] = [{ role: 'user', content: 'Say hello' }];

function createConfig(): ConfigService<Env, true> {
  const values = {
    OPEN_UNCENSORED_API_KEY: API_KEY,
    OPEN_UNCENSORED_MODEL: MODEL,
  };

  return {
    get: (key: keyof typeof values) => values[key],
  } as unknown as ConfigService<Env, true>;
}

function createClient(stream: AsyncIterable<unknown>): {
  client: ChatClient;
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn().mockResolvedValue(stream);
  return {
    create,
    client: {
      chat: { completions: { create } },
    },
  };
}

async function* chunks(
  parts: Array<string | null>,
  onEach?: () => void,
): AsyncIterable<{ choices: Array<{ delta: { content: string | null } }> }> {
  for (const content of parts) {
    onEach?.();
    yield { choices: [{ delta: { content } }] };
  }
}

async function collect(stream: AsyncIterable<string>): Promise<string[]> {
  const result: string[] = [];
  for await (const part of stream) {
    result.push(part);
  }
  return result;
}

describe('OpenUncensoredProvider', () => {
  it('yields chunks in order and skips an empty delta', async () => {
    const { client, create } = createClient(chunks([FIRST_CHUNK, EMPTY_CHUNK, null, SECOND_CHUNK]));
    const provider = new OpenUncensoredProvider(createConfig(), client);
    const signal = new AbortController().signal;

    await expect(collect(provider.stream(MESSAGES, signal))).resolves.toEqual([
      FIRST_CHUNK,
      SECOND_CHUNK,
    ]);
    expect(create).toHaveBeenCalledWith(
      { model: MODEL, messages: MESSAGES, stream: true },
      { signal },
    );
  });

  it('stops when the signal is aborted', async () => {
    const controller = new AbortController();
    const { client } = createClient(
      chunks([FIRST_CHUNK, SECOND_CHUNK], () => {
        controller.abort();
      }),
    );
    const provider = new OpenUncensoredProvider(createConfig(), client);

    await expect(collect(provider.stream(MESSAGES, controller.signal))).resolves.toEqual([]);
  });
});
