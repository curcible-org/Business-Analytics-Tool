-- Create one tenant + one API key, and print the PLAINTEXT key once.
-- Run in the Supabase SQL editor AFTER applying 0001_forge_tenancy.sql.
-- The plaintext is shown only here; only its SHA-256 hash is stored.

do $$
declare
  v_tenant uuid;
  v_plain  text := 'forge_' || encode(gen_random_bytes(24), 'hex');  -- the key to hand the customer
begin
  insert into forge_tenants(name, email, plan, monthly_quota, rate_per_min)
    values ('Curcible (internal)', 'pranavpatel1409@gmail.com', 'pro', 1000, 30)
    returning id into v_tenant;

  insert into forge_api_keys(tenant_id, key_hash, key_prefix, label)
    values (v_tenant, encode(digest(v_plain, 'sha256'), 'hex'), left(v_plain, 8), 'first key');

  raise notice 'API KEY (store now, shown once): %', v_plain;
end $$;
