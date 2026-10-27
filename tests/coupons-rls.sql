-- TEST FIXTURE ONLY: empty disposable local PostgreSQL, never a hosted project.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims', true)::jsonb$$;
grant usage on schema auth to anon, authenticated;
\ir ../supabase/004_member_coupons.sql
insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set request.jwt.claims = '{"is_anonymous":true}';
do $$begin
  begin perform public.mall_collect_coupon('2-0-1--10'); raise exception 'Guest collected a coupon';
  exception when insufficient_privilege then null; end;
end$$;
set request.jwt.claims = '{"is_anonymous":false}';
do $$begin
  if not public.mall_collect_coupon('2-0-1--10') then raise exception 'Member collection failed'; end if;
  if public.mall_collect_coupon('2-0-1--10') then raise exception 'Duplicate collection accepted'; end if;
  if (select count(*) from public.mall_coupon_collections) <> 1 then raise exception 'Member cannot read own collection'; end if;
  begin perform public.mall_collect_coupon('forged'); raise exception 'Invalid coupon accepted';
  exception when invalid_parameter_value then null; end;
  begin insert into public.mall_coupon_collections(user_id,coupon_id) values(auth.uid(),'forged'); raise exception 'Direct write accepted';
  exception when insufficient_privilege then null; end;
end$$;
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
do $$begin
  if (select count(*) from public.mall_coupon_collections) <> 0 then raise exception 'Other member collection leaked'; end if;
  if not public.mall_collect_coupon('2-0-1--10') then raise exception 'Second member blocked by first member collection'; end if;
end$$;
set request.jwt.claims = '{"is_anonymous":true}';
do $$begin
  if (select count(*) from public.mall_coupon_collections) <> 0 then raise exception 'Anonymous collection access allowed'; end if;
end$$;
\echo 'PASS: guest denial, account isolation, valid collection, duplicate rejection, invalid IDs, direct-write denial'
