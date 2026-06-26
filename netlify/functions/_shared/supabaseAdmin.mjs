// Server-side Supabase helpers for the billing functions.
// verifyUser(): validate a user's access token via GoTrue.
// tenant CRUD via PostgREST with the service-role key (bypasses RLS).

const URL  = () => process.env.SUPABASE_URL
const SVC  = () => process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = () => process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export async function verifyUser(accessToken) {
  if (!accessToken) return null
  const res = await fetch(`${URL()}/auth/v1/user`, {
    headers: { apikey: ANON() || SVC(), Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json() // { id, email, ... }
}

const restHeaders = (extra = {}) => ({
  apikey: SVC(),
  Authorization: `Bearer ${SVC()}`,
  'Content-Type': 'application/json',
  ...extra,
})

export async function getTenantByUser(userId) {
  const res = await fetch(`${URL()}/rest/v1/forge_tenants?user_id=eq.${userId}&select=*`, { headers: restHeaders() })
  const rows = res.ok ? await res.json() : []
  return rows[0] || null
}

export async function getTenantByCustomer(customerId) {
  const res = await fetch(`${URL()}/rest/v1/forge_tenants?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=*`, { headers: restHeaders() })
  const rows = res.ok ? await res.json() : []
  return rows[0] || null
}

export async function patchTenant(tenantId, patch) {
  const res = await fetch(`${URL()}/rest/v1/forge_tenants?id=eq.${tenantId}`, {
    method: 'PATCH',
    headers: restHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  })
  const rows = res.ok ? await res.json() : []
  return rows[0] || null
}
