-- Workout App — initial schema
-- Run this whole file in Supabase → SQL Editor.
--
-- Roles:      every user is either a 'trainer' (PT) or a 'client'.
-- Relation:   trainer_clients links a PT to their clients (many-to-many: a client
--             can train with more than one PT). Clients join with the PT's invite code.
-- Booking:    PTs publish gym sessions (date, time, place, capacity); their clients book a spot.
-- Recorded:   PTs publish videos (link or uploaded file); their clients watch and mark them done.
--
-- Security is enforced by Row Level Security: the browser talks to Supabase with the
-- user's own session, and every policy below decides what that user can see or change.

-- ─────────────────────────────────────────────────────────────── types & tables

create type public.user_role as enum ('trainer', 'client');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null check (char_length(full_name) between 1 and 80),
  bio         text check (char_length(bio) <= 500),
  invite_code text unique, -- trainers only
  created_at  timestamptz not null default now()
);

create table public.trainer_clients (
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trainer_id, client_id)
);
create index trainer_clients_client_idx on public.trainer_clients (client_id);

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  location   text check (char_length(location) <= 120),
  capacity   int not null default 1 check (capacity between 1 and 100),
  notes      text check (char_length(notes) <= 500),
  cancelled  boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index sessions_trainer_start_idx on public.sessions (trainer_id, starts_at);

create table public.bookings (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, client_id)
);
create index bookings_client_idx on public.bookings (client_id);

create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 100),
  description  text check (char_length(description) <= 2000),
  category     text check (char_length(category) <= 40),
  level        text check (level in ('beginner', 'intermediate', 'advanced')),
  duration_min int check (duration_min between 1 and 600),
  video_url    text check (char_length(video_url) <= 500),  -- YouTube / Vimeo / direct link
  storage_path text check (char_length(storage_path) <= 300), -- or a file in the "videos" bucket
  created_at   timestamptz not null default now(),
  check (video_url is not null or storage_path is not null)
);
create index videos_trainer_idx on public.videos (trainer_id, created_at desc);

create table public.video_completions (
  client_id    uuid not null references public.profiles (id) on delete cascade,
  video_id     uuid not null references public.videos (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (client_id, video_id)
);

-- ─────────────────────────────────────────────────────────────── helpers
-- SECURITY DEFINER so policies can use them without recursing into RLS.

create or replace function public.is_trainer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'trainer');
$$;

create or replace function public.is_my_trainer(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trainer_clients where trainer_id = t and client_id = auth.uid());
$$;

create or replace function public.is_my_client(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trainer_clients where trainer_id = auth.uid() and client_id = c);
$$;

create or replace function public.owns_session(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from sessions where id = s and trainer_id = auth.uid());
$$;

-- Computed column: lets clients see how many spots are taken without
-- seeing who booked them. Usage: sessions?select=*,booked_count
create or replace function public.booked_count(s public.sessions)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from bookings where session_id = s.id;
$$;

create or replace function public.new_invite_code()
returns text language sql volatile as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- ─────────────────────────────────────────────────────────────── signup trigger
-- Creates the profile from the metadata sent by the signup form
-- (role, full_name and, optionally, a trainer invite code to join straight away).

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.user_role;
  t uuid;
begin
  r := case when new.raw_user_meta_data ->> 'role' = 'trainer' then 'trainer' else 'client' end;

  insert into profiles (id, role, full_name, invite_code)
  values (
    new.id,
    r,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    case when r = 'trainer' then new_invite_code() end
  );

  if r = 'client' and nullif(new.raw_user_meta_data ->> 'invite_code', '') is not null then
    select id into t from profiles
     where role = 'trainer' and invite_code = upper(trim(new.raw_user_meta_data ->> 'invite_code'));
    if t is not null then
      insert into trainer_clients (trainer_id, client_id) values (t, new.id) on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────── RPCs

-- A client joins a PT with the PT's invite code. Returns the trainer id.
create or replace function public.join_trainer(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  t uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'client') then
    raise exception 'Only clients can join a trainer.';
  end if;
  select id into t from profiles where role = 'trainer' and invite_code = upper(trim(code));
  if t is null then
    raise exception 'No trainer found with that code.';
  end if;
  insert into trainer_clients (trainer_id, client_id) values (t, auth.uid()) on conflict do nothing;
  return t;
end;
$$;

-- A trainer gets a fresh invite code (old links stop working; current clients stay).
create or replace function public.regenerate_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  c text := new_invite_code();
begin
  update profiles set invite_code = c where id = auth.uid() and role = 'trainer';
  if not found then raise exception 'Only trainers have an invite code.'; end if;
  return c;
end;
$$;

-- A client books a spot. Locks the session row so two people can't take the last spot.
create or replace function public.book_session(p_session uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s sessions%rowtype;
  taken int;
  b uuid;
begin
  select * into s from sessions where id = p_session for update;
  if not found or not is_my_trainer(s.trainer_id) then
    raise exception 'Session not found.';
  end if;
  if s.cancelled then raise exception 'This session was cancelled.'; end if;
  if s.starts_at <= now() then raise exception 'This session has already started.'; end if;
  if exists (select 1 from bookings where session_id = s.id and client_id = auth.uid()) then
    raise exception 'You already booked this session.';
  end if;
  select count(*) into taken from bookings where session_id = s.id;
  if taken >= s.capacity then raise exception 'This session is full.'; end if;

  insert into bookings (session_id, client_id) values (s.id, auth.uid()) returning id into b;
  return b;
end;
$$;

revoke execute on function public.join_trainer(text) from public, anon;
revoke execute on function public.regenerate_invite_code() from public, anon;
revoke execute on function public.book_session(uuid) from public, anon;
grant execute on function public.join_trainer(text) to authenticated;
grant execute on function public.regenerate_invite_code() to authenticated;
grant execute on function public.book_session(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────── row level security

alter table public.profiles          enable row level security;
alter table public.trainer_clients   enable row level security;
alter table public.sessions          enable row level security;
alter table public.bookings          enable row level security;
alter table public.videos            enable row level security;
alter table public.video_completions enable row level security;

-- profiles: see yourself, your trainers and your clients; edit only name and bio.
create policy "profiles: read related" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_my_trainer(id) or public.is_my_client(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, bio) on public.profiles to authenticated;

-- trainer_clients: both sides see the link and either side can end it.
-- Creating a link only happens through join_trainer() / signup.
create policy "links: read own" on public.trainer_clients for select to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "links: delete own" on public.trainer_clients for delete to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid());

-- sessions: trainers manage their own; clients see their trainers' sessions.
create policy "sessions: read" on public.sessions for select to authenticated
  using (trainer_id = auth.uid() or public.is_my_trainer(trainer_id));
create policy "sessions: insert own" on public.sessions for insert to authenticated
  with check (trainer_id = auth.uid() and public.is_trainer());
create policy "sessions: update own" on public.sessions for update to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
create policy "sessions: delete own" on public.sessions for delete to authenticated
  using (trainer_id = auth.uid());

-- bookings: clients see/cancel their own; trainers see/remove bookings on their sessions.
-- Creating a booking only happens through book_session().
create policy "bookings: read" on public.bookings for select to authenticated
  using (client_id = auth.uid() or public.owns_session(session_id));
create policy "bookings: delete" on public.bookings for delete to authenticated
  using (client_id = auth.uid() or public.owns_session(session_id));

-- videos: trainers manage their own; clients see their trainers' videos.
create policy "videos: read" on public.videos for select to authenticated
  using (trainer_id = auth.uid() or public.is_my_trainer(trainer_id));
create policy "videos: insert own" on public.videos for insert to authenticated
  with check (trainer_id = auth.uid() and public.is_trainer());
create policy "videos: update own" on public.videos for update to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
create policy "videos: delete own" on public.videos for delete to authenticated
  using (trainer_id = auth.uid());

-- video_completions: each client manages their own progress on videos they can see.
create policy "completions: read" on public.video_completions for select to authenticated
  using (
    client_id = auth.uid()
    or exists (select 1 from public.videos v where v.id = video_id and v.trainer_id = auth.uid())
  );
create policy "completions: insert own" on public.video_completions for insert to authenticated
  with check (
    client_id = auth.uid()
    and exists (select 1 from public.videos v where v.id = video_id and public.is_my_trainer(v.trainer_id))
  );
create policy "completions: delete own" on public.video_completions for delete to authenticated
  using (client_id = auth.uid());

-- ─────────────────────────────────────────────────────────────── video storage
-- Private bucket. Files live at "<trainer_id>/<file>". Trainers upload into their own
-- folder; their clients can read (the app hands out short-lived signed URLs).

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy "videos bucket: trainer upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_trainer()
  );
create policy "videos bucket: trainer delete" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "videos bucket: read" on storage.objects for select to authenticated
  using (
    bucket_id = 'videos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_my_trainer(((storage.foldername(name))[1])::uuid)
    )
  );
