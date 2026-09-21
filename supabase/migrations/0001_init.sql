-- ===========================================================================
--  My Life Manager — esquema inicial
--  Executar no Supabase: SQL Editor > New query > colar > Run
-- ===========================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------- workspaces --
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,                 -- identificador secreto do URL
  name        text not null default 'A minha vida',
  settings    jsonb not null default '{}'::jsonb,   -- tema, cartões, início da semana
  created_at  timestamptz not null default now()
);

-- Preparado para o futuro (autenticação/convites). Não usado nesta fase.
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid,
  email         text,
  role          text not null default 'owner' check (role in ('owner','editor','viewer')),
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz
);
create index if not exists workspace_members_ws_idx on public.workspace_members(workspace_id);

-- ----------------------------------------------------------------- tarefas --
create table if not exists public.tasks (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  title            text not null check (char_length(trim(title)) > 0),
  description      text,
  due_date         date,
  due_time         time,
  priority         text not null default 'media' check (priority in ('baixa','media','alta')),
  category         text not null default 'pessoal',
  recurrence       text not null default 'none'
                    check (recurrence in ('none','daily','weekly','monthly','weekdays')),
  recurrence_days  smallint[] not null default '{}',  -- 0=domingo ... 6=sábado
  show_in_calendar boolean not null default true,
  completed_dates  date[] not null default '{}',      -- datas em que foi concluída
  is_demo          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists tasks_ws_idx on public.tasks(workspace_id);

-- ------------------------------------------- horário semanal e compromissos --
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  title          text not null check (char_length(trim(title)) > 0),
  kind           text not null default 'outro'
                  check (kind in ('aula','trabalho','estudo','ginasio','outro')),
  start_time     time not null,
  end_time       time not null,
  weekday        smallint check (weekday between 0 and 6), -- blocos semanais
  date           date,                                      -- compromisso pontual
  repeats_weekly boolean not null default true,
  color          text not null default 'rosa',
  location       text,
  notes          text,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint events_time_order check (end_time > start_time),
  constraint events_when check (
    (repeats_weekly and weekday is not null) or (not repeats_weekly and date is not null)
  )
);
create index if not exists events_ws_idx on public.events(workspace_id);

-- --------------------------------------------------------------- finanças --
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  type          text not null check (type in ('income','expense')),
  category      text not null default 'outros',
  date          date not null,
  description   text,
  recurrence    text not null default 'none'
                 check (recurrence in ('none','weekly','monthly','yearly')),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists transactions_ws_date_idx on public.transactions(workspace_id, date);

create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  category      text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  is_demo       boolean not null default false,
  unique (workspace_id, category)
);

create table if not exists public.bills (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null check (char_length(trim(name)) > 0),
  amount        numeric(12,2) not null check (amount >= 0),
  due_date      date not null,
  recurrence    text not null default 'monthly'
                 check (recurrence in ('none','weekly','monthly','yearly')),
  paid_dates    date[] not null default '{}',  -- vencimentos já pagos
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists bills_ws_idx on public.bills(workspace_id);

-- ---------------------------------------------------------------- compras --
create table if not exists public.shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null check (char_length(trim(name)) > 0),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists shopping_lists_ws_idx on public.shopping_lists(workspace_id);

-- Partilha por link. Modelo já preparado para vários links/permissões e,
-- no futuro, para partilhas associadas a utilizadores autenticados.
create table if not exists public.list_shares (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.shopping_lists(id) on delete cascade,
  token       text not null unique,
  role        text not null default 'editor' check (role in ('editor','viewer')),
  user_id     uuid,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index if not exists list_shares_list_idx on public.list_shares(list_id);

create table if not exists public.shopping_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.shopping_lists(id) on delete cascade,
  name        text not null check (char_length(trim(name)) > 0),
  quantity    text,
  category    text not null default 'outros',
  notes       text,
  bought      boolean not null default false,
  position    integer not null default 0,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists shopping_items_list_idx on public.shopping_items(list_id);

-- -------------------------------------------------------- notas temporárias --
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  title         text not null check (char_length(trim(title)) > 0),
  body          text,
  expires_at    timestamptz not null,
  task_id       uuid references public.tasks(id) on delete set null,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notes_expiry_idx on public.notes(expires_at);

-- As notas expiradas são apagadas pela app sempre que a workspace é aberta.
-- Esta função permite também agendar a limpeza no servidor (pg_cron).
create or replace function public.purge_expired_notes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare removed integer;
begin
  delete from public.notes where expires_at < now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- Opcional (Database > Extensions > ativar "pg_cron"):
--   select cron.schedule('purge-expired-notes', '*/15 * * * *',
--                        $$select public.purge_expired_notes();$$);

-- ------------------------------------------------------------------- RLS --
-- Nesta fase não há autenticação: todo o acesso é feito no servidor da app
-- com a chave service_role. O RLS fica ativo SEM políticas, pelo que as
-- chaves públicas (anon) não conseguem ler nem escrever nada.
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.tasks             enable row level security;
alter table public.events            enable row level security;
alter table public.transactions      enable row level security;
alter table public.budgets           enable row level security;
alter table public.bills             enable row level security;
alter table public.shopping_lists    enable row level security;
alter table public.list_shares       enable row level security;
alter table public.shopping_items    enable row level security;
alter table public.notes             enable row level security;
