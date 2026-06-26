-- Forge accounts: link tenants to auth.users + self-serve RPCs scoped to auth.uid().
-- Frontend calls these with the publishable/anon key + the user's session JWT.

alter table forge_tenants add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists idx_forge_tenants_user on forge_tenants(user_id) where user_id is not null;

create or replace function forge_bootstrap_tenant()
returns table(tenant_id uuid, plan text, monthly_quota int, rate_per_min int)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_email text; v_tid uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select id into v_tid from forge_tenants where user_id = v_uid;
  if v_tid is null then
    select email into v_email from auth.users where id = v_uid;
    insert into forge_tenants(name, email, user_id, plan, monthly_quota, rate_per_min)
      values (coalesce(v_email, 'tenant'), v_email, v_uid, 'free', 50, 6)
      returning id into v_tid;
  end if;
  return query select t.id, t.plan, t.monthly_quota, t.rate_per_min from forge_tenants t where t.id = v_tid;
end $$;

create or replace function forge_create_api_key(p_label text default 'key')
returns table(api_key text, key_prefix text, key_id uuid)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tid uuid; v_plain text; v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select id into v_tid from forge_tenants where user_id = v_uid;
  if v_tid is null then raise exception 'no tenant; call forge_bootstrap_tenant first'; end if;
  v_plain := 'forge_' || encode(gen_random_bytes(24), 'hex');
  insert into forge_api_keys(tenant_id, key_hash, key_prefix, label)
    values (v_tid, encode(digest(v_plain, 'sha256'), 'hex'), left(v_plain, 8), coalesce(p_label, 'key'))
    returning id into v_id;
  return query select v_plain, left(v_plain, 8), v_id;
end $$;

create or replace function forge_revoke_api_key(p_key_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tid uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select id into v_tid from forge_tenants where user_id = v_uid;
  update forge_api_keys set revoked = true where id = p_key_id and tenant_id = v_tid;
  return found;
end $$;

create or replace function forge_my_keys()
returns table(id uuid, key_prefix text, label text, revoked boolean, created_at timestamptz, last_used_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tid uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select t.id into v_tid from forge_tenants t where t.user_id = v_uid;
  return query select k.id, k.key_prefix, k.label, k.revoked, k.created_at, k.last_used_at
    from forge_api_keys k where k.tenant_id = v_tid order by k.created_at desc;
end $$;

create or replace function forge_my_usage()
returns table(plan text, monthly_quota int, rate_per_min int, used_this_month int)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tid uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select t.id into v_tid from forge_tenants t where t.user_id = v_uid;
  return query
    select t.plan, t.monthly_quota, t.rate_per_min,
      (select count(*)::int from forge_usage_events e
        where e.tenant_id = v_tid and e.created_at >= date_trunc('month', now()))
    from forge_tenants t where t.id = v_tid;
end $$;

grant execute on function forge_bootstrap_tenant() to authenticated;
grant execute on function forge_create_api_key(text) to authenticated;
grant execute on function forge_revoke_api_key(uuid) to authenticated;
grant execute on function forge_my_keys() to authenticated;
grant execute on function forge_my_usage() to authenticated;

-- The gate is server-only (service role). Never callable by app users.
revoke all on function forge_authorize(text, text, text) from public, anon, authenticated;
