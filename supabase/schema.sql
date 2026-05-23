-- Sabores del Mundo — schema Supabase
-- Correr en el SQL editor del proyecto: https://supabase.com/dashboard/project/irryksaoygdklwtsjsru/sql

-- ── Sesiones ──────────────────────────────────────────────────────────────────
create table if not exists sdm_sessions (
  session_id   uuid        primary key,
  player_country text,
  start_level  text,
  created_at   timestamptz default now()
);

-- ── Respuestas (incluye comodines) ────────────────────────────────────────────
create table if not exists sdm_answers (
  id               uuid    default gen_random_uuid() primary key,
  session_id       uuid    not null references sdm_sessions(session_id),
  round_number     integer not null,
  level            text    not null,
  food_name        text    not null,
  correct_country  text    not null,
  selected_country text    not null,
  is_correct       boolean not null,
  is_wildcard      boolean default false,
  -- 'food_from_description' | 'country_from_flag' | null
  wildcard_type    text,
  reaction_time_ms integer not null,
  lives_after      integer not null,
  created_at       timestamptz default now()
);

-- ── Textos creativos finales ──────────────────────────────────────────────────
create table if not exists sdm_final_writeups (
  session_id   uuid    primary key references sdm_sessions(session_id),
  text         text    not null,
  hits         integer,
  rounds       integer,
  out_of_lives boolean,
  created_at   timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table sdm_sessions     enable row level security;
alter table sdm_answers      enable row level security;
alter table sdm_final_writeups enable row level security;

create policy anon_insert_sessions
  on sdm_sessions for insert to anon with check (true);

create policy anon_insert_answers
  on sdm_answers for insert to anon with check (true);

create policy anon_insert_writeups
  on sdm_final_writeups for insert to anon with check (true);

-- Para leer datos desde un admin futuro, agregar policies de select para service_role.
