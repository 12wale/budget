# Supabase and Firebase authentication setup

## 1. Apply the database policies first

Open the Supabase project SQL Editor and run the complete contents of [`schema.sql`](./schema.sql). It creates or upgrades the budget, expense, and preference tables, RLS policies, timestamp triggers, and a default preferences row for every new account. The policies now require the server-managed `app_metadata.email_verified` claim before allowing access to plans, expenses, or preferences. Run this before changing the Auth email-confirmation setting.

Existing password accounts without this claim will be asked to verify their email through Firebase the next time they sign in. Google sign-ins are marked verified by the OAuth callback.

## 2. Configure Supabase Auth

1. Under **Authentication → URL Configuration**, set the Site URL for local development to `http://localhost:3000` and add `http://localhost:3000/auth/callback` and the production URL `https://budget-three-bay.vercel.app/auth/callback` to Redirect URLs.
2. Under **Authentication → Sign In / Providers → Email**, keep Email enabled and turn **Confirm email** off. The app sends Firebase verification email instead; Supabase must return a session so the server can securely bind the Firebase verification to the correct Supabase user.
3. Keep Google enabled if you want to retain the existing Google sign-in button.
4. In **Project Settings → API Keys**, copy the `service_role` key for local/server use only. Never use a `NEXT_PUBLIC_` prefix for this key.

## 3. Configure Firebase Authentication

In Firebase project `budget-1a2bb`:

1. Open **Build → Authentication → Sign-in method** (or **Sign-in providers**) and enable **Email/Password**, then save. This setup uses password accounts plus address verification; do not enable Email link passwordless sign-in.
2. Open **Authentication → Settings → Authorized domains** and add `localhost` and `budget-three-bay.vercel.app`. Enter hostnames only, without `https://` or a path.
3. Open **Authentication → Templates → Email address verification**. Customize the text if desired. Leave Firebase's default action handler in place; it applies the verification link and returns the user to the app.
4. Firebase's current Spark limit for address-verification emails is 1,000 per day. Email-link sign-in has a separate 5-per-day limit, which is why this project uses the address-verification template instead.

## 4. Configure environment variables

The app calls Firebase from a Next.js server route, so the Firebase config variables do not need a `NEXT_PUBLIC_` prefix. Add these names in `.env.local` and Vercel **Project → Settings → Environment Variables**:

```env
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_AUTH_DOMAIN=budget-1a2bb.firebaseapp.com
FIREBASE_PROJECT_ID=budget-1a2bb
FIREBASE_STORAGE_BUCKET=budget-1a2bb.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=572507365191
FIREBASE_APP_ID=1:572507365191:web:9b62591debea7c1434f662
FIREBASE_MEASUREMENT_ID=G-2WK3H79FQR
```

Also set these Supabase values (without a `NEXT_PUBLIC_` prefix), plus:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Set `FIREBASE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in local `.env.local` and Vercel. Mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive/secret. The Supabase URL and publishable/anon key are public values that Next.js embeds in the browser bundle through `next.config.ts`; never put the service-role key there. The other Firebase web app values above are informational and are not currently read by the verification flow; `FIREBASE_API_KEY` is the only Firebase variable required by the code.

## 5. Configure Vercel and test the flow

1. In Vercel, add the variables to **Production**, **Preview**, and **Development** environments as needed, then redeploy.
2. Restart the local Next.js server after changing `.env.local`.
3. Create a fresh test account with email and password. The app creates its Supabase account, then Firebase sends an address-verification link.
4. Open the link in the same browser, return to the app, and sign in with the same email/password. The server verifies Firebase's `emailVerified` state, sets the Supabase claim, and refreshes the session.
5. Confirm that an unverified password account cannot read or write Supabase data, and that a verified account can. Test Google sign-in separately if enabled.

Account plans, expenses, preferences, and savings remain stored in Supabase and scoped by the existing RLS policies.

The app supports one active plan per account; ending a plan saves its remaining balance as savings, separate from later plans. Guest plans stay on the current device and move to a new account after sign-in when the account has no active plan or saved plan history. The local copy is removed only after a successful import. JSON backup export/import remains available in Settings.
