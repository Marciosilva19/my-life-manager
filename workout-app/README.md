# PT Studio — workout app

A mobile-first web app that connects **personal trainers** with their **clients**:

- **PT ↔ client relationship** — every account is a *trainer* or a *client*. Trainers get an invite
  code / link; clients join with it (at sign-up or later). A client can train with several PTs, and
  either side can end the relationship.
- **In-person booking** — the PT publishes the days and times they'll be at the gym (title, place,
  number of spots, optional weekly repeat). Their clients see the open sessions and book a spot in
  one tap. Capacity is enforced in the database, so two people can't grab the last spot.
- **Recorded trainings** — the PT publishes workout videos (YouTube / Vimeo / `.mp4` link, or an
  uploaded file). Clients browse by category, watch, and mark workouts as done; the PT sees progress.

Stack: **Next.js 15** (App Router, Server Actions) · **TypeScript** · **Tailwind CSS** ·
**Supabase** (Postgres, Auth, Storage, Row Level Security).

---

## Screens

| Role | Screen | What it does |
| --- | --- | --- |
| Both | **Home** | Trainer: stats for the week, invite link, upcoming sessions. Client: next bookings, open spots, new workouts (or the "join your trainer" box if not connected yet). |
| Trainer | **Schedule** (`/sessions`) | Add availability (with weekly repeat up to 12 weeks), see who booked, cancel / reopen / delete sessions, remove an attendee, browse past sessions. |
| Client | **Book** (`/sessions`) | My bookings (cancel) and available sessions grouped by day, filter by trainer. |
| Trainer | **Clients** (`/clients`) | Invite code + link, regenerate code, client list with upcoming bookings and videos done, remove a client. |
| Client | **Trainers** (`/trainers`) | Join a trainer by code, leave a trainer. |
| Both | **Videos** (`/videos`, `/videos/[id]`) | Trainer: add / edit / delete videos, see how many clients completed each. Client: library with category and "not done yet" filters, player, mark as done. |
| Both | **Profile** | Name and bio (PTs see their clients' bio — goals, injuries…). |
| Public | `/join/<code>` | Shareable invite link. |

---

## Running locally

Requires Node.js 18.18+ (20+ recommended).

```bash
cd workout-app
npm install
cp .env.example .env.local   # fill in with your Supabase details (below)
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run typecheck
npm run build
```

## Setting up Supabase

Use a **separate** Supabase project from My Life Manager.

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query**: paste the whole of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and **Run**. This creates
   the tables, the signup trigger, the booking/join functions, all RLS policies and the private
   `videos` storage bucket.
3. **Authentication → URL Configuration**: set **Site URL** to your app URL
   (`http://localhost:3000` locally, your Vercel URL in production) and add
   `<your-url>/auth/callback` to **Redirect URLs**.
4. **Authentication → Sign In / Providers → Email**: keep "Confirm email" on for production
   (users get a link that lands on `/auth/callback`). Turn it off while testing to sign in straight away.
5. **Project Settings → API Keys**: copy the URL and the publishable (or legacy `anon`) key into
   `.env.local`.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) or legacy `anon` key |
| `NEXT_PUBLIC_APP_TIME_ZONE` | Gym time zone, default `Europe/Lisbon`. Session times are entered and shown in this zone. |

No secret / service-role key is needed: the app always acts **as the signed-in user** and the
database decides what each user can do.

## Deploying to Vercel

Import the repository, set **Root Directory** to `workout-app`, add the three environment
variables, and deploy. Then add the production URL to Supabase (step 3 above).

---

## Data model and security

```
profiles (id = auth user, role trainer|client, full_name, bio, invite_code)
   │
   ├── trainer_clients (trainer_id, client_id)        ← the PT ↔ client relationship
   │
   ├── sessions (trainer_id, title, starts_at, ends_at, location, capacity, cancelled)
   │      └── bookings (session_id, client_id)
   │
   └── videos (trainer_id, title, category, level, duration, video_url | storage_path)
          └── video_completions (client_id, video_id)
```

All rules live in Postgres Row Level Security, so they hold even if someone calls the Supabase API directly:

- People only see profiles of themselves, their trainers and their clients.
- `role` and `invite_code` can't be edited by users (column-level grants).
- A client only sees sessions and videos from trainers they're connected to; removing the
  relationship removes that access immediately.
- Clients see how many spots are taken (`booked_count`) but not who booked.
- Bookings can only be created through `book_session()`, which checks the relationship, that the
  session isn't cancelled or already started, that the client isn't already in it, and the capacity —
  with a row lock against race conditions.
- Links can only be created with an invite code (`join_trainer()` or at sign-up).
- Uploaded videos are in a private bucket under `<trainer_id>/…`; only that trainer can write, only
  they and their clients can read, and the app plays them through short-lived signed URLs.

Video uploads are limited to 50 MB (Supabase free plan limit). For longer recordings, upload to
YouTube (as *unlisted*) or Vimeo and paste the link.

## Ideas for next steps

- E-mail / push reminders before a booked session, and notifying clients when a PT cancels.
- Cancellation cut-off (e.g. no cancelling less than 12 h before).
- Waiting list for full sessions.
- Assigning specific videos or training plans to specific clients.
- Session packs / payments (e.g. Stripe).
