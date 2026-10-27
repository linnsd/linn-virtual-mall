-- TEST FIXTURE ONLY. Run against an EMPTY disposable database, never hosted Supabase.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
grant usage on schema auth to anon, authenticated, service_role;
\ir ../supabase/001_initial.sql
\ir ../supabase/004_member_coupons.sql
-- A legacy malformed row must not make the migration fail.
insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.mall_visits(id,owner_id,data) values('legacy','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"coupons":"<img src=x>"}');
\ir ../supabase/005_security_daily_quota.sql
\ir ../supabase/005_security_daily_quota.sql
create function pg_temp.assert_denied(query text) returns void language plpgsql as $$
begin
  begin execute query; exception when insufficient_privilege then return; end;
  raise exception 'Expected permission denied: %',query;
end;
$$;
set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set request.jwt.claims='{"is_anonymous":false}';
insert into public.mall_visits(id,owner_id,data) values('valid',auth.uid(),'{"day":"2026-10-27","coupons":1,"corners":{"Phones":2}}');
do $$begin
  begin insert into public.mall_visits(id,owner_id,data) values('invalid',auth.uid(),'{"coupons":"<img src=x>"}'); raise exception 'Invalid metric accepted'; exception when check_violation then null; end;
  begin insert into public.mall_visits(id,owner_id,data) values('invalid-dictionary',auth.uid(),'{"prizes":{"Case":"<img>"}}'); raise exception 'Invalid dictionary accepted'; exception when check_violation then null; end;
  if not public.mall_collect_coupon_for_day('2-0-1--10',(now() at time zone 'UTC')::date) then raise exception 'Current-day claim failed'; end if;
  begin perform public.mall_collect_coupon_for_day('2-0-1--10',(now() at time zone 'UTC')::date-1); raise exception 'Stale day accepted'; exception when invalid_parameter_value then null; end;
end$$;
select pg_temp.assert_denied('select public.mall_reserve_ai_request(repeat(''a'',64))');
select pg_temp.assert_denied('select * from public.mall_ai_quota_windows');
select pg_temp.assert_denied('update public.mall_ai_quota_config set global_per_day=999999');
set role anon;
select pg_temp.assert_denied('select public.mall_reserve_ai_request(repeat(''a'',64))');
reset role;
update public.mall_ai_quota_config set ip_per_minute=2,global_per_minute=3,global_per_day=4;
set role service_role;
do $$begin
  if not (public.mall_reserve_ai_request(repeat('a',64))->>'allowed')::boolean then raise exception 'First request denied'; end if;
  if not (public.mall_reserve_ai_request(repeat('a',64))->>'allowed')::boolean then raise exception 'Second request denied'; end if;
  if (public.mall_reserve_ai_request(repeat('a',64))->>'allowed')::boolean then raise exception 'IP quota exceeded'; end if;
  if not (public.mall_reserve_ai_request(repeat('b',64))->>'allowed')::boolean then raise exception 'Other IP blocked'; end if;
  if (public.mall_reserve_ai_request(repeat('c',64))->>'allowed')::boolean then raise exception 'Global minute quota exceeded'; end if;
end$$;
reset role;
delete from public.mall_ai_quota_windows where scope<>'global-day';
set role service_role;
do $$begin
  if not (public.mall_reserve_ai_request(repeat('c',64))->>'allowed')::boolean then raise exception 'New minute reservation denied'; end if;
  if (public.mall_reserve_ai_request(repeat('d',64))->>'allowed')::boolean then raise exception 'Global daily quota exceeded'; end if;
end$$;
reset role;
-- Leave a clean low daily budget for the concurrent-client test runner.
truncate public.mall_ai_quota_windows;
update public.mall_ai_quota_config set ip_per_minute=30,global_per_minute=30,global_per_day=5;
\echo 'PASS: legacy-safe constraints, invalid-metric rejection, stale-day guard, browser-role denial, shared IP/minute/day quotas, idempotent migration'
