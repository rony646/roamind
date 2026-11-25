import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const USERS_EMAIL_LOWERCASE = 'users_email_lowercase';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    defaultSystemPrompt: text('default_system_prompt'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check(USERS_EMAIL_LOWERCASE, sql`${table.email} = lower(${table.email})`)],
);
