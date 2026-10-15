# Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run the complete contents of [`schema.sql`](./schema.sql). It creates or upgrades the budget, expense, and preference tables, Row Level Security policies, timestamp triggers, and a default preferences row for every new account. The upgrade allows multiple ended plans and one active plan per account; existing plans remain active.
3. In **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect allow list. Add the production callback URL after deployment.
4. In **Authentication → Providers**, enable Google and follow Supabase's Google provider instructions. Email/password authentication is enabled by default unless you disable it in the project settings. Configure email confirmation templates/settings as desired.
5. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon/publishable key from **Project Settings → API**. Never put a service-role key in a `NEXT_PUBLIC_` variable or browser code.
6. Restart `npm run dev`, then sign up or continue with Google. Guest plans are stored on the current device and move to a new account automatically after sign-in. Account plans, expenses, preferences, and savings are stored in Supabase and scoped to the authenticated user by RLS.

The SQL can be rerun to refresh policies and triggers. The app supports one active plan per account; ending a plan saves its remaining balance as savings, and the savings total is kept separate from later plans.

Existing guest browser data moves only when the account has no active plan or saved plan history. The local copy is removed only after a successful import. JSON backup export/import remains available in Settings.
