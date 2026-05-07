# Supabase Auth & Role-based Permissions Implementation

## Plan

### 1. Environment Configuration
- Create `.env.local.example` with Supabase keys.
- User needs to set these in their local `.env.local`.

### 2. Database Schema (SQL)
- Define `profiles` table.
- Define `user_role` enum (`student`, `admin`).
- Set up RLS:
  - Users can read their own profile.
  - Public can read public profile info (username) if needed (optional for now).
  - Only service_role or manual SQL can update roles.
- Create a trigger to auto-create a profile on user signup.

### 3. Supabase Client Integration
- Create `lib/supabase/client.ts` (Browser client).
- Create `lib/supabase/server.ts` (Server client for Server Components/Actions).
- Create `lib/supabase/middleware.ts` (Auth session management).

### 4. App Shell Connection
- Modify `components/app-shell.tsx` to use `user` and `profile` from Supabase instead of local state.
- Add a simple Login/Logout UI placeholder (or a dedicated page).

### 5. Verification
- `backend-permission-review` for RLS and secret checks.
- `npm run lint` & `npm run build`.

## Status: Starting implementation...
