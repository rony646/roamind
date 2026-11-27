import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.js';
import { OpenUncensoredProvider } from './open-uncensored.provider.js';

@Module({
  providers: [
    OpenUncensoredProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: OpenUncensoredProvider,
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
