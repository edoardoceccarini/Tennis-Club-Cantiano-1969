-- ============================================================
-- TENNIS CLUB — Supabase Schema + RLS
-- Applicare nel SQL Editor di Supabase in un colpo solo.
-- ============================================================


-- ────────────────────────────────────────────
-- 0. ESTENSIONI
-- ────────────────────────────────────────────

-- Necessaria per il vincolo EXCLUDE con tstzrange
-- (previene sovrapposizioni di prenotazioni sullo stesso campo)
create extension if not exists btree_gist;


-- ────────────────────────────────────────────
-- 1. ENUM
-- ────────────────────────────────────────────

create type booking_type as enum (
  'normal',       -- partita libera
  'tournament',   -- torneo
  'school',       -- scuola tennis
  'maintenance'   -- manutenzione campo
);


-- ────────────────────────────────────────────
-- 2. TABELLE
-- ────────────────────────────────────────────

-- Profili utente (estende auth.users)
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Campi da gioco
create table courts (
  id            serial primary key,
  name          text not null unique check (char_length(name) between 1 and 50),
  has_lighting  boolean not null default false,
  is_indoor     boolean not null default false,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Prenotazioni
create table bookings (
  id            uuid primary key default gen_random_uuid(),
  court_id      integer not null references courts(id) on delete restrict,
  user_id       uuid not null references profiles(id) on delete cascade,
  start_time    timestamptz not null,
  end_time      timestamptz not null,
  booking_type  booking_type not null default 'normal',
  created_at    timestamptz not null default now(),

  -- Ogni slot dura esattamente 1 ora
  constraint valid_duration check (
    end_time = start_time + interval '1 hour'
  ),

  -- Lo slot deve iniziare a un'ora esatta (:00)
  constraint valid_start_minute check (
    extract(minute from start_time) = 0
    and extract(second from start_time) = 0
  ),

  -- Orari consentiti: dalle 08:00 alle 21:00 (ultimo slot 21:00-22:00)
  constraint valid_hours check (
    extract(hour from start_time) >= 8
    and extract(hour from start_time) <= 21
  ),

  -- VINCOLO CHIAVE: nessuna sovrapposizione sullo stesso campo.
  -- Anche con richieste concorrenti, Postgres rifiuta il conflitto.
  constraint no_overlap exclude using gist (
    court_id with =,
    tstzrange(start_time, end_time) with &&
  )
);

-- Indici per le query più frequenti
create index idx_bookings_court_time on bookings (court_id, start_time);
create index idx_bookings_user       on bookings (user_id, start_time);
create index idx_bookings_date       on bookings (start_time);


-- ────────────────────────────────────────────
-- 3. FUNZIONI HELPER
-- ────────────────────────────────────────────

-- Controlla se l'utente corrente è admin
create or replace function is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- Calcola il limite della finestra di prenotazione.
-- Utente normale: prossimo martedì alle 23:59:59
-- Admin: prossimo martedì + 7 giorni alle 23:59:59
create or replace function booking_window_end(for_admin boolean default false)
returns timestamptz
language sql
stable
as $$
  select
    -- Trova il prossimo martedì (o oggi se è martedì)
    (date_trunc('day', now())
      + make_interval(days =>
          case
            when extract(dow from now()) <= 2
              then 2 - extract(dow from now())::int
            else 9 - extract(dow from now())::int
          end
        )
      -- Aggiungi 7 giorni extra per admin
      + case when for_admin then interval '7 days' else interval '0 days' end
      + interval '23 hours 59 minutes 59 seconds'
    )::timestamptz;
$$;


-- ────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ────────────────────────────────────────────

alter table profiles enable row level security;
alter table courts   enable row level security;
alter table bookings enable row level security;


-- ── PROFILES ──

-- Chiunque autenticato può leggere tutti i profili
-- (serve per vedere i nomi nelle prenotazioni)
create policy "profiles_select"
  on profiles for select
  to authenticated
  using (true);

-- Un utente può aggiornare solo il proprio display_name
create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- L'insert avviene via trigger (vedi sotto), non direttamente
-- Ma serve la policy per il trigger security definer
create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());


-- ── COURTS ──

-- Tutti possono leggere i campi (anche gli anonimi/ospiti)
create policy "courts_select_all"
  on courts for select
  to anon, authenticated
  using (true);

-- Solo admin può creare campi
create policy "courts_insert_admin"
  on courts for insert
  to authenticated
  with check (is_admin());

-- Solo admin può modificare campi
create policy "courts_update_admin"
  on courts for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Solo admin può eliminare campi
create policy "courts_delete_admin"
  on courts for delete
  to authenticated
  using (is_admin());


-- ── BOOKINGS ──

-- Tutti possono leggere le prenotazioni (anche ospiti)
create policy "bookings_select_all"
  on bookings for select
  to anon, authenticated
  using (true);

-- INSERT: utente autenticato, con tutti i vincoli di business
create policy "bookings_insert"
  on bookings for insert
  to authenticated
  with check (
    -- La prenotazione è dell'utente corrente
    user_id = auth.uid()

    -- Il campo deve essere disponibile
    and exists (
      select 1 from courts
      where courts.id = court_id and courts.is_available = true
    )

    -- Lo slot deve essere nel futuro
    and start_time > now()

    -- Cutoff prenotazione:
    -- Admin: può prenotare fino all'inizio dello slot
    -- Utente: deve prenotare almeno 1 ora prima
    and (
      is_admin()
      or start_time >= now() + interval '1 hour'
    )

    -- Finestra di prenotazione:
    -- Admin: fino a 2 martedì in avanti
    -- Utente: fino al prossimo martedì
    and start_time <= booking_window_end(is_admin())

    -- Solo admin può creare prenotazioni non-normal
    and (
      booking_type = 'normal'
      or is_admin()
    )
  );

-- DELETE: utente cancella le proprie, admin cancella tutto
create policy "bookings_delete_own"
  on bookings for delete
  to authenticated
  using (
    user_id = auth.uid()
    or is_admin()
  );

-- Nessuna policy UPDATE su bookings:
-- le prenotazioni si creano o si cancellano, non si modificano.


-- ────────────────────────────────────────────
-- 5. TRIGGER: creazione profilo automatica al signup
-- ────────────────────────────────────────────

-- Quando un utente si registra via magic link, il profilo
-- NON viene creato automaticamente. Il display_name viene
-- impostato dal frontend al primo accesso.
-- Creiamo comunque un profilo vuoto con un nome temporaneo
-- che verrà aggiornato subito dopo.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Nuovo utente'),
    -- Controlla se l'email è nella lista admin
    new.email in ('admin@tennisclub.it', 'presidente@tennisclub.it')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ────────────────────────────────────────────
-- 6. DATI INIZIALI (opzionale)
-- ────────────────────────────────────────────

-- Inserisci i campi del club
insert into courts (name, has_lighting, is_indoor) values
  ('Campo 1', true,  false),
  ('Campo 2', true,  true),
  ('Campo 3', false, false);


-- ============================================================
-- NOTE PER IL DEPLOY
-- ============================================================
--
-- 1. Creare un progetto su https://supabase.com
--
-- 2. Nel SQL Editor, eseguire questo file intero.
--
-- 3. In Authentication > Providers, abilitare "Email"
--    e attivare "Enable Magic Link sign-in".
--    Disattivare "Enable email confirmations" per semplicità
--    (gli utenti cliccano il link e entrano subito).
--
-- 4. In Authentication > URL Configuration, impostare
--    il Site URL con l'indirizzo del frontend deployato
--    (es. https://tennis.tuodominio.it).
--
-- 5. Copiare la Project URL e la anon key da
--    Settings > API > Project URL / anon public.
--    Serviranno nel frontend come variabili d'ambiente:
--    VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
--
-- 6. Per modificare la lista degli admin, aggiornare:
--    - La funzione handle_new_user() (per i nuovi signup)
--    - Direttamente la colonna is_admin nella tabella profiles
--      per utenti già esistenti.
--
-- 7. Per le email di notifica cancellazione, creare una
--    Edge Function (fase 3 del progetto).
-- ============================================================
