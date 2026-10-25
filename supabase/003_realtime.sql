-- Run AFTER 001_initial.sql. Safe to rerun.
-- Private channels only: disable "Allow public access" in Realtime Settings.
begin;
create or replace function public.mall_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.mall_roles where user_id = auth.uid() and role in ('admin', 'staff'));
$$;
revoke all on function public.mall_is_staff() from public;
grant execute on function public.mall_is_staff() to authenticated;

-- A shared presence lobby discovers per-tab channels. Lobby metadata is untrusted.
-- Only the account named in a peer topic can publish its state/chat/presence.
-- Receivers derive staff eligibility from the authorized topic, never the payload.
drop policy if exists mall_realtime_read on realtime.messages;
create policy mall_realtime_read on realtime.messages for select to authenticated using (
  (select realtime.topic()) = 'mall:lobby'
  or (select realtime.topic()) ~ '^mall:(guest|staff):[0-9a-f-]{36}:[0-9a-f-]{36}$'
);
drop policy if exists mall_realtime_write on realtime.messages;
create policy mall_realtime_write on realtime.messages for insert to authenticated with check (
  ((select realtime.topic()) = 'mall:lobby' and extension = 'presence')
  or (
    (select realtime.topic()) ~ '^mall:(guest|staff):[0-9a-f-]{36}:[0-9a-f-]{36}$'
    and split_part((select realtime.topic()), ':', 3) = (select auth.uid())::text
    and (split_part((select realtime.topic()), ':', 2) = 'guest' or public.mall_is_staff())
    and extension in ('broadcast', 'presence')
  )
);
commit;
