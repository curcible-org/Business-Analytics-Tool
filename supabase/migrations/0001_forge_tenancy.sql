-- Forge API — per-tenant auth, quota, and usage metering
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)
-- Replaces the single shared FORGE_API_KEY model. API keys are stored as
-- SHA-256 hashes; the plaintext key is shown to the tenant once at creation.

create extension if not exists pgcrypto;

-- ── Tenants ───────────────────────────────────────────────────────────────────
create table if not exists forge_tenants (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  plan          text not null default 'free',         -- free | starter | pro
  monthly_quota int  not null default 50,             -- runs per calendar month
  rate_per_min  int  not null default 6,              -- requests per minute
  status        text not null default 'active',       -- active | suspended
  created_at    timestamptz not null default now()
);

-- ── API keys (hashed) ─────────────────────────────────────────────────────────
create table if not exists forge_api_keys (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references forge_tenants(id) on delete cascade,
  key_hash    text not null unique,                   -- sha256(plaintext)
  key_prefix  text not null,                          -- first 8 chars, for display
  label       text,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists idx_forge_api_keys_hash on forge_api_keys(key_hash);

-- ── Usage events (metering + rate limiting + audit log) ───────────────────────
create table if not exists forge_usage_events (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null references forge_tenants(id) on delete cascade,
  api_key_id  uuid references forge_api_keys(id) on delete set null,
  endpoint    text not null,
  status      int,
  leads_returned int default 0,
  tokens      int default 0,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_forge_usage_tenant_time on forge_usage_events(tenant_id, created_at);

-- ── Atomic gate: validate key, enforce rate-limit + monthly quota, log event ──
-- Returns one row: allowed, reason, tenant_id, api_key_id.
create or replace function forge_authorize(p_key_hash text, p_endpoint text, p_ip text)
returns table(allowed boolean, reason text, out_tenant_id uuid, out_api_key_id uuid)
language plpgsql security definer
set search_path = public
as $$
declare
  v_key     forge_api_keys%rowtype;
  v_tenant  forge_tenants%rowtype;
  v_minute  int;
  v_month   int;
begin
  select * into v_key from forge_api_keys where forge_api_keys.key_hash = p_key_hash and not forge_api_keys.revoked;
  if not found then
    return query select false, 'invalid_key', null::uuid, null::uuid; return;
  end if;

  select * into v_tenant from forge_tenants where forge_tenants.id = v_key.tenant_id;
  if v_tenant.status <> 'active' then
    return query select false, 'tenant_suspended', v_tenant.id, v_key.id; return;
  end if;

  select count(*) into v_minute from forge_usage_events
   where forge_usage_events.tenant_id = v_tenant.id and forge_usage_events.created_at > now() - interval '1 minute';
  if v_minute >= v_tenant.rate_per_min then
    return query select false, 'rate_limited', v_tenant.id, v_key.id; return;
  end if;

  select count(*) into v_month from forge_usage_events
   where forge_usage_events.tenant_id = v_tenant.id and forge_usage_events.created_at >= date_trunc('month', now());
  if v_month >= v_tenant.monthly_quota then
    return query select false, 'quota_exceeded', v_tenant.id, v_key.id; return;
  end if;

  update forge_api_keys set last_used_at = now() where forge_api_keys.id = v_key.id;
  insert into forge_usage_events(tenant_id, api_key_id, endpoint, status, ip)
    values (v_tenant.id, v_key.id, p_endpoint, 0, p_ip);

  return query select true, 'ok', v_tenant.id, v_key.id;
end $$;

-- Tables are accessed only via the service-role key from serverless functions.
alter table forge_tenants     enable row level security;
alter table forge_api_keys    enable row level security;
alter table forge_usage_events enable row level security;
-- (No public policies: service role bypasses RLS; anon/auth get nothing.)
revoke all on function forge_authorize(text, text, text) from anon, authenticated;
