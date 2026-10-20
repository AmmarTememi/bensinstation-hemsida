-- =====================================================================
-- Al-Wafaa Gas Station – databas för bränslepriser (Supabase)
-- Kör hela filen EN gång i Supabase: SQL Editor -> New query -> Run.
-- =====================================================================

-- 1. Tabell med bränslen och priser (alltid i IQD per liter, heltal)
create table if not exists public.fuel_prices (
  slug        text primary key,                 -- används av hemsidan: regular, premium, super, diesel
  name_ar     text not null,
  name_en     text not null,
  price_iqd   integer check (price_iqd is null or price_iqd >= 0),
  available   boolean not null default true,
  sort        smallint not null default 0,
  updated_at  timestamptz not null default now()
);

-- 2. Vilka inloggade användare som får ändra priser
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 3. Uppdatera tidsstämpeln automatiskt vid varje ändring
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists fuel_prices_touch on public.fuel_prices;
create trigger fuel_prices_touch
  before update on public.fuel_prices
  for each row execute function public.touch_updated_at();

-- 4. Säkerhet (Row Level Security)
alter table public.fuel_prices enable row level security;
alter table public.admins      enable row level security;

-- Alla (även besökare på hemsidan) får LÄSA priser
drop policy if exists "Alla kan läsa priser" on public.fuel_prices;
create policy "Alla kan läsa priser"
  on public.fuel_prices for select
  to anon, authenticated
  using (true);

-- Bara admins får ÄNDRA priser
drop policy if exists "Admins kan ändra priser" on public.fuel_prices;
create policy "Admins kan ändra priser"
  on public.fuel_prices for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- En inloggad användare får se om den själv är admin
drop policy if exists "Se egen admin-rad" on public.admins;
create policy "Se egen admin-rad"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Behörigheter: besökare får bara läsa, inloggade får bara ändra pris och tillgänglighet
revoke all on public.fuel_prices from anon, authenticated;
grant select on public.fuel_prices to anon, authenticated;
grant update (price_iqd, available) on public.fuel_prices to authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- 5. Startdata (priser lämnas tomma – fyll i dem i adminpanelen)
insert into public.fuel_prices (slug, name_ar, name_en, sort) values
  ('regular', 'بنزين عادي',  'Regular petrol', 1),
  ('premium', 'بنزين محسّن', 'Premium petrol', 2),
  ('super',   'بنزين سوبر',  'Super petrol',   3),
  ('diesel',  'كاز (ديزل)',  'Diesel',         4)
on conflict (slug) do nothing;

-- =====================================================================
-- 6. GÖR DIG SJÄLV TILL ADMIN (kör EFTER att du skapat din användare
--    under Authentication -> Users -> Add user). Byt ut e-postadressen.
-- =====================================================================
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'DIN-EPOST@example.com'
-- on conflict do nothing;
