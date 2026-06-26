-- Stripe billing columns + plan_renews_at exposed on forge_my_usage.
alter table forge_tenants add column if not exists stripe_customer_id text;
alter table forge_tenants add column if not exists stripe_subscription_id text;
alter table forge_tenants add column if not exists plan_renews_at timestamptz;
create index if not exists idx_forge_tenants_stripe_customer on forge_tenants(stripe_customer_id);

drop function if exists forge_my_usage();
create function forge_my_usage()
returns table(plan text, monthly_quota int, rate_per_min int, used_this_month int, plan_renews_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tid uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select t.id into v_tid from forge_tenants t where t.user_id = v_uid;
  return query
    select t.plan, t.monthly_quota, t.rate_per_min,
      (select count(*)::int from forge_usage_events e
        where e.tenant_id = v_tid and e.created_at >= date_trunc('month', now())),
      t.plan_renews_at
    from forge_tenants t where t.id = v_tid;
end $$;
grant execute on function forge_my_usage() to authenticated;
