import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Env } from '../config/env.js';
import type { LLMMessage, LLMProvider } from './llm-provider.js';

const OPEN_UNCENSORED_BASE_URL = 'https://api.openuncensored.com/v1';

type CompletionChunk = {
  choices: Array<{ delta?: { content?: string | null } | null } | undefined>;
};

type CompletionStream = AsyncIterable<CompletionChunk>;

export type ChatClient = {
  chat: {
    completions: {
      create: (
        body: {
          model: string;
          messages: LLMMessage[];
          stream: true;
        },
        options: { signal: AbortSignal },
      ) => Promise<CompletionStream>;
    };
  };
};

@Injectable()
export class OpenUncensoredProvider implements LLMProvider {
  private readonly client: ChatClient;
  private readonly model: string;

  constructor(config: ConfigService<Env, true>, client?: ChatClient) {
    const apiKey = config.get('OPEN_UNCENSORED_API_KEY', { infer: true });
    this.model = config.get('OPEN_UNCENSORED_MODEL', { infer: true });
    this.client =
      client ??
      (new OpenAI({
        apiKey,
        baseURL: OPEN_UNCENSORED_BASE_URL,
      }) as unknown as ChatClient);
  }

  async *stream(messages: LLMMessage[], signal: AbortSignal): AsyncIterable<string> {
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        messages,
        stream: true,
      },
      { signal },
    );

    for await (const chunk of completion) {
      if (signal.aborted) {
        return;
      }

      const content = chunk.choices[0]?.delta?.content;
      if (!content) {
        continue;
      }

      yield content;
    }
  }
}
