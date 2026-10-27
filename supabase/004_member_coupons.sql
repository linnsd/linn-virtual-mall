-- Apply after 001_initial.sql. Collections belong to registered accounts only.
create table if not exists public.mall_coupon_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'UTC')::date),
  coupon_id text not null,
  collected_at timestamptz not null default now(),
  primary key (user_id, day, coupon_id)
);
alter table public.mall_coupon_collections enable row level security;
create policy member_coupons_read on public.mall_coupon_collections
  for select to authenticated using (
    user_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') = 'false'
  );
grant select on public.mall_coupon_collections to authenticated;
revoke insert, update, delete on public.mall_coupon_collections from anon, authenticated;

create or replace function public.mall_collect_coupon(coupon text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous', 'true') <> 'false' then
    raise exception 'Registered account required' using errcode = '42501';
  end if;
  if coupon is null or coupon <> all(array[
    '2-0--12--11','2-0-1--10','2-0-13--12','4-0--1.5--10','4-0-1--13',
    '4-0--0.8--18','4-0-2.7--18','5-0--4--4','5-0--4--13','5-0-4--10',
    '5-0--12--20','5-0-10--19','3-0--1--8','3-0-12--12','3-0--12--9',
    '3-1-4--12','3-1--14--16','3-2-12.45--18.2'
  ]::text[]) then
    raise exception 'Unknown coupon' using errcode = '22023';
  end if;
  insert into public.mall_coupon_collections(user_id, coupon_id) values(auth.uid(), coupon)
    on conflict do nothing;
  return found;
end;
$$;
revoke all on function public.mall_collect_coupon(text) from public, anon;
grant execute on function public.mall_collect_coupon(text) to authenticated;
