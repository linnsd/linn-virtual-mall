-- Run once in Supabase Dashboard > SQL Editor.
begin;
create table public.mall_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff'))
);
alter table public.mall_roles enable row level security;
create policy own_role on public.mall_roles for select to authenticated using (user_id = auth.uid());
grant select on public.mall_roles to authenticated;
revoke all on public.mall_roles from anon;
revoke insert, update, delete on public.mall_roles from authenticated;

create function public.mall_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.mall_roles where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function public.mall_is_admin() from public;
grant execute on function public.mall_is_admin() to anon, authenticated;

create table public.mall_documents (
  id text primary key check (id in ('config/contact','catalog/products') or id ~ '^repairStatus/[A-Z0-9-]{1,40}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 300000)
);
alter table public.mall_documents enable row level security;
create policy public_catalog on public.mall_documents for select to anon, authenticated
  using (id in ('config/contact', 'catalog/products') or public.mall_is_admin());
create policy admin_insert on public.mall_documents for insert to authenticated with check (public.mall_is_admin());
create policy admin_update on public.mall_documents for update to authenticated using (public.mall_is_admin()) with check (public.mall_is_admin());
grant select on public.mall_documents to anon, authenticated;
grant insert, update on public.mall_documents to authenticated;
revoke delete on public.mall_documents from anon, authenticated;

-- Exact job lookup only; the public cannot download the repair list.
-- Job numbers are not passwords. Keep customer names, phone numbers and private notes out.
create function public.mall_repair_lookup(job_id text) returns jsonb language sql stable security definer set search_path = '' as $$
  select data from public.mall_documents where id = 'repairStatus/' || job_id and job_id ~ '^[A-Z0-9-]{1,40}$';
$$;
revoke all on function public.mall_repair_lookup(text) from public;
grant execute on function public.mall_repair_lookup(text) to anon, authenticated;

create table public.mall_visits (
  id text primary key check (length(id) <= 100),
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 32000),
  day text generated always as (data ->> 'day') stored
);
create index mall_visits_day_idx on public.mall_visits(day);
alter table public.mall_visits enable row level security;
create policy visits_read on public.mall_visits for select to authenticated using (owner_id = auth.uid() or public.mall_is_admin());
create policy visits_insert on public.mall_visits for insert to authenticated with check (owner_id = auth.uid());
create policy visits_update on public.mall_visits for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
grant select, insert, update on public.mall_visits to authenticated;
revoke all on public.mall_visits from anon;
commit;
