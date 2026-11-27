import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { conversations } from './conversations.js';

const MESSAGES_CONVERSATION_ID_INDEX = 'messages_conversation_id_idx';
const MESSAGES_ROLE_ALLOWED = 'messages_role_allowed';
const MESSAGE_ROLE_USER = 'user';
const MESSAGE_ROLE_ASSISTANT = 'assistant';
const MESSAGE_ROLE_SYSTEM = 'system';
const MESSAGE_ROLE_LIST = `'${MESSAGE_ROLE_USER}', '${MESSAGE_ROLE_ASSISTANT}', '${MESSAGE_ROLE_SYSTEM}'`;

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    model: text('model'),
    tokens: integer('tokens'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index(MESSAGES_CONVERSATION_ID_INDEX).on(table.conversationId),
    check(MESSAGES_ROLE_ALLOWED, sql`${table.role} in (${sql.raw(MESSAGE_ROLE_LIST)})`),
  ],
);
