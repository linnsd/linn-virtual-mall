-- TEST FIXTURE ONLY. Run using psql against an EMPTY, disposable local database.
-- Never run this file in a hosted Supabase project.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create schema realtime;
create function realtime.topic() returns text language sql stable as $$
  select current_setting('realtime.topic', true);
$$;
create table realtime.messages(extension text);
alter table realtime.messages enable row level security;
grant usage on schema auth, realtime to anon, authenticated;
grant select, insert on realtime.messages to authenticated;
\ir ../supabase/001_initial.sql
\ir ../supabase/003_realtime.sql
\ir ../supabase/003_realtime.sql
insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.mall_roles values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','staff');
create function pg_temp.assert_denied(query text) returns void language plpgsql as $$
begin
  begin execute query;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denied: %', query;
end;
$$;
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set realtime.topic = 'mall:lobby';
insert into realtime.messages values ('presence');
select pg_temp.assert_denied('insert into realtime.messages values (''broadcast'')');
set realtime.topic = 'mall:guest:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:11111111-1111-4111-8111-111111111111';
insert into realtime.messages values ('presence'), ('broadcast');
set realtime.topic = 'mall:guest:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb:22222222-2222-4222-8222-222222222222';
select pg_temp.assert_denied('insert into realtime.messages values (''broadcast'')');
-- Guests may read authorized staff topics but may not send to them.
set realtime.topic = 'mall:staff:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:11111111-1111-4111-8111-111111111111';
select pg_temp.assert_denied('insert into realtime.messages values (''presence'')');
select pg_temp.assert_denied('insert into realtime.messages values (''broadcast'')');
select pg_temp.assert_denied('insert into public.mall_roles values (''aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'',''staff'')');
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set realtime.topic = 'mall:staff:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb:22222222-2222-4222-8222-222222222222';
insert into realtime.messages values ('presence'), ('broadcast');
-- Reading staff's payload does not let a guest overwrite it.
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$begin
  if (select count(*) from realtime.messages) <> 5 then raise exception 'Authenticated peer read denied'; end if;
end$$;
set realtime.topic = 'unrelated:room';
do $$begin
  if (select count(*) from realtime.messages) <> 0 then raise exception 'Unrelated room is readable'; end if;
end$$;
select pg_temp.assert_denied('insert into realtime.messages values (''presence'')');
set role anon;
select pg_temp.assert_denied('insert into realtime.messages values (''presence'')');
reset role;
\echo 'PASS: owner-only writes, staff-only staff topics, guest reads, no lobby chat, no anonymous access, idempotent migration'
