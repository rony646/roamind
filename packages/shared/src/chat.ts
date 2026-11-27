import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 32000;

const MESSAGE_CONTENT_REQUIRED_MESSAGE = 'Message content is required';
const MESSAGE_CONTENT_TOO_LONG_MESSAGE = `Message content must be at most ${MAX_MESSAGE_LENGTH} characters`;
const MESSAGE_ROLE_USER = 'user';
const MESSAGE_ROLE_ASSISTANT = 'assistant';
const MESSAGE_ROLE_SYSTEM = 'system';
const STREAM_EVENT_TOKEN = 'token';
const STREAM_EVENT_DONE = 'done';
const STREAM_EVENT_ERROR = 'error';

const messageContentSchema = z
  .string()
  .trim()
  .min(1, { error: MESSAGE_CONTENT_REQUIRED_MESSAGE })
  .max(MAX_MESSAGE_LENGTH, { error: MESSAGE_CONTENT_TOO_LONG_MESSAGE });

const messageRoleSchema = z.enum([MESSAGE_ROLE_USER, MESSAGE_ROLE_ASSISTANT, MESSAGE_ROLE_SYSTEM]);
const timestampSchema = z.iso.datetime();

export const messageSchema = z.object({
  id: z.uuid(),
  role: messageRoleSchema,
  content: messageContentSchema,
  model: z.string().nullable(),
  tokens: z.number().int().nullable(),
  createdAt: timestampSchema,
});

export const conversationListItemSchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  model: z.string(),
  updatedAt: timestampSchema,
});

export const conversationDetailSchema = conversationListItemSchema.extend({
  messages: z.array(messageSchema),
});

export const messageBodySchema = z.object({
  content: messageContentSchema,
});

const streamTokenEventSchema = z.object({
  type: z.literal(STREAM_EVENT_TOKEN),
  content: z.string(),
});

const streamDoneEventSchema = z.object({
  type: z.literal(STREAM_EVENT_DONE),
  conversationId: z.uuid(),
  messageId: z.uuid(),
});

const streamErrorEventSchema = z.object({
  type: z.literal(STREAM_EVENT_ERROR),
  message: z.string(),
});

export const streamEventSchema = z.discriminatedUnion('type', [
  streamTokenEventSchema,
  streamDoneEventSchema,
  streamErrorEventSchema,
]);

export type Message = z.infer<typeof messageSchema>;
export type ConversationListItem = z.infer<typeof conversationListItemSchema>;
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;
export type MessageBody = z.infer<typeof messageBodySchema>;
export type StreamEvent = z.infer<typeof streamEventSchema>;
