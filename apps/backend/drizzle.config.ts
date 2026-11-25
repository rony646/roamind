import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  throw new Error('NEON_CONNECTION_STRING is required');
}

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
