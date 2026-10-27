-- Apply after 004_member_coupons.sql. Re-running this migration is safe.
begin;

-- Old rows remain readable by the hardened renderer; reject malformed new writes.
create or replace function public.mall_valid_visit_metrics(data jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare value jsonb; field text; metrics jsonb;
begin
  foreach field in array array['coupons','draws','drives','flights','sits','visits'] loop
    value := data -> field;
    if value is not null then
      if jsonb_typeof(value) <> 'number' then return false; end if;
      if (value::text)::numeric < 0 or (value::text)::numeric > 1000000000 or trunc((value::text)::numeric) <> (value::text)::numeric then return false; end if;
    end if;
  end loop;
  foreach field in array array['corners','prizes','sites'] loop
    metrics := data -> field;
    if metrics is not null then
      if jsonb_typeof(metrics) <> 'object' then return false; end if;
      for value in select v from jsonb_each(metrics) as entries(k,v) loop
        if jsonb_typeof(value) <> 'number' then return false; end if;
        if (value::text)::numeric < 0 or (value::text)::numeric > 1000000000 or trunc((value::text)::numeric) <> (value::text)::numeric then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.mall_valid_visit_metrics(jsonb) from public, anon;
grant execute on function public.mall_valid_visit_metrics(jsonb) to authenticated, service_role;
alter table public.mall_visits drop constraint if exists mall_visits_metrics_valid;
alter table public.mall_visits add constraint mall_visits_metrics_valid check (public.mall_valid_visit_metrics(data)) not valid;

-- Reject claims for a stale day instead of silently storing them under a new one.
create or replace function public.mall_collect_coupon_for_day(coupon text, collection_day date)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if collection_day is null or collection_day <> (now() at time zone 'UTC')::date then
    raise exception 'Coupon day changed; refresh and try again' using errcode = '22023';
  end if;
  return public.mall_collect_coupon(coupon);
end;
$$;
revoke all on function public.mall_collect_coupon_for_day(text,date) from public, anon;
grant execute on function public.mall_collect_coupon_for_day(text,date) to authenticated;

-- Server-only shared quota. No browser role can view, reserve or change budgets.
create table if not exists public.mall_ai_quota_config (
  id boolean primary key default true check (id),
  ip_per_minute integer not null default 12 check (ip_per_minute between 1 and 10000),
  global_per_minute integer not null default 120 check (global_per_minute between 1 and 10000),
  global_per_day integer not null default 1000 check (global_per_day between 1 and 1000000)
);
insert into public.mall_ai_quota_config(id) values(true) on conflict do nothing;
create table if not exists public.mall_ai_quota_windows (
  scope text not null,
  window_start timestamptz not null,
  requests integer not null check (requests >= 0),
  primary key(scope,window_start)
);
create index if not exists mall_ai_quota_window_age on public.mall_ai_quota_windows(window_start);
alter table public.mall_ai_quota_config enable row level security;
alter table public.mall_ai_quota_windows enable row level security;
revoke all on public.mall_ai_quota_config, public.mall_ai_quota_windows from anon, authenticated;

create or replace function public.mall_reserve_ai_request(ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' set lock_timeout = '2s' set timezone = 'UTC' as $$
declare
  config public.mall_ai_quota_config%rowtype;
  current_at timestamptz; minute_start timestamptz; day_start timestamptz;
  ip_count integer; minute_count integer; day_count integer; retry integer;
begin
  if ip_hash is null or ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid client hash' using errcode = '22023';
  end if;
  -- One lock serializes checking and reserving all three limits across instances.
  perform pg_advisory_xact_lock(734001, 1);
  current_at := clock_timestamp();
  minute_start := date_trunc('minute', current_at);
  day_start := date_trunc('day', current_at at time zone 'UTC') at time zone 'UTC';
  select * into strict config from public.mall_ai_quota_config where id = true;
  delete from public.mall_ai_quota_windows where window_start < day_start - interval '1 day';
  select coalesce(max(requests),0) into day_count from public.mall_ai_quota_windows where scope='global-day' and window_start=day_start;
  select coalesce(max(requests),0) into minute_count from public.mall_ai_quota_windows where scope='global-minute' and window_start=minute_start;
  select coalesce(max(requests),0) into ip_count from public.mall_ai_quota_windows where scope='ip:'||ip_hash and window_start=minute_start;
  if day_count >= config.global_per_day then
    retry := greatest(1, ceil(extract(epoch from (day_start + interval '1 day' - current_at)))::integer);
    return jsonb_build_object('allowed',false,'retry_after',retry,'reason','daily_limit');
  end if;
  if minute_count >= config.global_per_minute or ip_count >= config.ip_per_minute then
    retry := greatest(1, ceil(extract(epoch from (minute_start + interval '1 minute' - current_at)))::integer);
    return jsonb_build_object('allowed',false,'retry_after',retry,'reason','minute_limit');
  end if;
  insert into public.mall_ai_quota_windows(scope,window_start,requests) values
    ('global-day',day_start,1),('global-minute',minute_start,1),('ip:'||ip_hash,minute_start,1)
  on conflict(scope,window_start) do update set requests=public.mall_ai_quota_windows.requests+1;
  return jsonb_build_object('allowed',true,'retry_after',0);
end;
$$;
revoke all on function public.mall_reserve_ai_request(text) from public, anon, authenticated;
grant execute on function public.mall_reserve_ai_request(text) to service_role;
commit;
