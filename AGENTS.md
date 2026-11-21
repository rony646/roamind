# AGENTS.md

Rules for any coding agent working in this monorepo. Follow them on every change.

## Project

Roamind is a personal AI chat app meant to replace ChatGPT in daily use.

- Monorepo: pnpm workspaces + Turborepo
- `apps/backend`: NestJS, Drizzle ORM, Neon Postgres
- `apps/mobile`: Expo Router, NativeWind, Reanimated, `expo/fetch` for streaming
- `packages/shared`: Zod schemas and types shared by backend and mobile
- `packages/api-client`: typed client for the backend API
- `design/`: visual reference only, never imported by code

## Code style

- Do not write code comments. Code must be clean, simple and self-explanatory.
- Prefer clear names and small functions over explanations.
- One responsibility per function, class and module.
- No magic numbers or strings: use named constants or config.
- Keep it simple. Do not add abstractions, layers or options without a current need.
- Use TypeScript strict mode. Do not use `any`.

## Reuse before creating

- Search the codebase before writing new code. Reuse existing functions, components, schemas and constants.
- Request and response shapes live in `packages/shared`. Do not redefine them in apps.
- Backend calls from apps go through `packages/api-client`. Do not call `fetch` directly from screens.

## Package boundaries

- `packages/*` must stay platform-neutral: never import `react-native` or `expo-*` there.
- Token storage and `fetch` are injected into `packages/api-client` by the app.
- Drizzle schemas stay in `apps/backend`. Never expose database types to apps.

## Lint and format

- ESLint and Prettier configs at the root are the source of truth.
- Code must pass lint, typecheck and tests before commit.
- Never disable a lint rule to make code pass. Fix the code instead.

## Tests

- Write unit tests for services and business logic.
- No e2e tests for now.

## Commits

- Use Conventional Commits for every commit: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Use a scope when the change belongs to one app or package, e.g. `feat(backend): add login route`.
- Never add an agent or AI tool as commit co-author.
