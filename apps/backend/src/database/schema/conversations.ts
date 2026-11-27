import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

const CONVERSATIONS_USER_ID_INDEX = 'conversations_user_id_idx';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    model: text('model').notNull(),
    systemPrompt: text('system_prompt'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index(CONVERSATIONS_USER_ID_INDEX).on(table.userId)],
);
