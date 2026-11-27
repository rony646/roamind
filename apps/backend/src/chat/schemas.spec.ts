import {
  MAX_MESSAGE_LENGTH,
  conversationDetailSchema,
  messageBodySchema,
  messageSchema,
  streamEventSchema,
} from '@roamind/shared';
import { describe, expect, it } from 'vitest';

const MESSAGE_ID = '6f0b6c9a-1d2e-4f3a-8b7c-9d0e1f2a3b4c';
const CONVERSATION_ID = '7a1c7d0b-2e3f-4051-9c8d-0e1f2a3b4c5d';
const CREATED_AT = '2026-11-27T20:00:00.000Z';
const CONTENT = 'Hello';
const TOO_LONG_CONTENT = 'x'.repeat(MAX_MESSAGE_LENGTH + 1);
const WHITESPACE_CONTENT = ' \n\t ';

const message = {
  id: MESSAGE_ID,
  role: 'user',
  content: `  ${CONTENT}  `,
  model: null,
  tokens: null,
  createdAt: CREATED_AT,
};

describe('chat schemas', () => {
  it('parses a message and trims the content', () => {
    const result = messageSchema.safeParse(message);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe(CONTENT);
    }
  });

  it('rejects empty or whitespace-only content', () => {
    expect(messageBodySchema.safeParse({ content: '' }).success).toBe(false);
    expect(messageBodySchema.safeParse({ content: WHITESPACE_CONTENT }).success).toBe(false);
  });

  it('rejects content longer than the maximum', () => {
    expect(messageBodySchema.safeParse({ content: TOO_LONG_CONTENT }).success).toBe(false);
    expect(messageBodySchema.safeParse({ content: 'x'.repeat(MAX_MESSAGE_LENGTH) }).success).toBe(
      true,
    );
  });

  it('parses a conversation detail with its messages', () => {
    const result = conversationDetailSchema.safeParse({
      id: CONVERSATION_ID,
      title: null,
      model: 'deepseek',
      updatedAt: CREATED_AT,
      messages: [message],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(1);
    }
  });

  it('parses token, done and error events', () => {
    expect(streamEventSchema.safeParse({ type: 'token', content: 'Hi' }).success).toBe(true);
    expect(
      streamEventSchema.safeParse({
        type: 'done',
        conversationId: CONVERSATION_ID,
        messageId: MESSAGE_ID,
      }).success,
    ).toBe(true);
    expect(
      streamEventSchema.safeParse({ type: 'error', message: 'The model failed' }).success,
    ).toBe(true);
  });

  it('rejects an event with an unknown type', () => {
    expect(streamEventSchema.safeParse({ type: 'delta', content: CONTENT }).success).toBe(false);
  });
});
