# Flow Ops Starter

This project is the first pass of an internal operations application built with Next.js 16, shadcn-style UI primitives, and Supabase for both authentication and data storage.

## Included so far

- A custom login flow that signs in by user name, department, and PIN
- Recent-user ordering via a workstation cookie
- A persistent bottom toolbar on every page
- Light and dark mode toggle
- Session-aware user and department display
- Global scan field with `Ctrl/Cmd + Shift + O`
- Department-aware placeholder routing for scanned orders and work orders
- Supabase migration plus local seed data for `users`, `departments`, and `user_departments`
- A `proxy.ts` session refresher for Next.js 16

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ORDER_CODE_SECRET=...
PRINTNODE_API_KEY=...
PRINTNODE_PRINTER_ID=...
ORDER_LABEL_TEST_MODE=false
```

3. For local Supabase development, run:

```bash
supabase db reset
```

This applies [`supabase/migrations/20260321150500_init_flow_ops.sql`](./supabase/migrations/20260321150500_init_flow_ops.sql)
and then loads [`supabase/seed.sql`](./supabase/seed.sql).

4. For a hosted Supabase project, apply the migration and then either run the seed SQL manually or create user accounts plus matching public rows yourself.

The seed uses six-digit PINs because the local Supabase auth config defaults to a minimum password length of 6.

5. Start the app:

```bash
npm run dev
```

## Notes

- `public.users.id` should match the UUID in `auth.users.id`
- The login screen uses safe server-side lookups for the user directory
- The selected department is stored in a secure cookie so the toolbar and scanner know the active department immediately after sign-in
- `supabase start` starts services; `supabase db reset` is what reapplies migrations and the seed
