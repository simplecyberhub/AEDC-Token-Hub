# AEDC Pay

A full-stack mobile app for Abuja Electricity Distribution Company (AEDC) customers to buy prepaid electricity tokens, top up wallets, and automate recurring purchases.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path `/api`)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, JWT auth (bcrypt + jsonwebtoken), Pino logging
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Mobile: Expo (React Native), Expo Router, React Query
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema: users, meters, token_transactions, wallet_transactions, subscriptions
- `lib/api-spec/openapi.yaml` — OpenAPI 3.0 contract (source of truth for API shape)
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks + Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, meters, tokens, wallet, subscriptions, dashboard)
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/constants/colors.ts` — Navy theme (#003366 primary) with dark mode
- `artifacts/mobile/context/AuthContext.tsx` — JWT auth context (AsyncStorage, auto-redirect)
- `artifacts/mobile/lib/format.ts` — Naira currency + date formatting utilities

## Architecture decisions

- **Contract-first API**: OpenAPI spec defined in `lib/api-spec/openapi.yaml` → Orval generates typed hooks and Zod schemas. All server routes validate request/response bodies with these schemas.
- **JWT auth**: Tokens stored in AsyncStorage under `aedc_token`. `setAuthTokenGetter` wires them into every API request via the custom fetch in `lib/api-client-react`.
- **Monorepo routing**: API server on path `/api`, mobile on `/` — proxied via Replit's shared reverse proxy. Mobile uses `EXPO_PUBLIC_DOMAIN` env var for API base URL.
- **Orval barrel fix**: Codegen script patches `lib/api-zod/src/index.ts` after generation to remove the spurious `api.schemas` export that Orval incorrectly writes.
- **Token generation**: Server generates real 20-digit prepaid tokens during purchase, stored in DB and returned in the response for display/copy.

## Product

- **Buy tokens**: Select a saved meter, pick an amount (presets or custom), purchase with wallet balance → get a copyable 20-digit token code
- **Wallet**: Top up balance (multiple payment methods), view credit/debit history
- **Meters**: Save multiple electricity meters with nickname, address, tariff type; set a default
- **Auto-Buy (Subscriptions)**: Recurring purchases at daily/weekly/monthly frequency — pause/resume/cancel
- **Dashboard**: Wallet balance hero, quick action shortcuts, recent transaction list, stats
- **Token history**: Full purchase history with status, units, token code; filter by meter
- **Profile**: User info, quick links to all features, sign out

## User preferences

- Nigerian Naira formatting: ₦X,XXX.XX (use `formatNaira` from `lib/format.ts`)
- No emojis in the UI — use @expo/vector-icons (Feather set)
- AEDC branding: deep navy #003366 primary, white foreground

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`; the barrel file patch runs automatically as part of that script
- `expo-clipboard` must match SDK version: `~8.0.8` for current Expo SDK
- API server must be running for mobile auth and data to work — it serves `/api` routes

## Pointers

- See `.local/skills/pnpm-workspace/SKILL.md` for workspace structure details
- See `.local/skills/expo/SKILL.md` for Expo/React Native patterns
