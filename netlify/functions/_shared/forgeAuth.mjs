/**
 * Forge API — per-tenant auth + metering helper.
 *
 * Replaces the single shared FORGE_API_KEY. Each tenant has one or more API
 * keys stored as SHA-256 hashes in Supabase. This module hashes the incoming
 * Bearer token, then calls the `forge_authorize` SQL function which atomically:
 *   - validates the key,
 *   - enforces per-minute rate limit + monthly quota,
 *   - logs a usage event.
 *
 * Env required (set in Netlify):
 *   SUPABASE_URL                 https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    service-role key (server-only, never shipped to browser)
 *
 * If SUPABASE_URL is absent, callers should fall back to legacy single-key auth.
 */

import { createHash } from 'node:crypto'

export const supabaseConfigured = () =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export const hashKey = (plain) =>
  createHash('sha256').update(String(plain)).digest('hex')

const REASON_STATUS = {
  invalid_key:      401,
  tenant_suspended: 403,
  rate_limited:     429,
  quota_exceeded:   429,
}

/**
 * @returns {Promise<{ok:boolean, status:number, reason:string, tenantId?:string, apiKeyId?:string}>}
 */
export async function authorize({ token, endpoint, ip }) {
  if (!token) return { ok: false, status: 401, reason: 'missing_token' }

  const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/forge_authorize`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_key_hash: hashKey(token),
      p_endpoint: endpoint,
      p_ip: ip || null,
    }),
  })

  if (!res.ok) {
    return { ok: false, status: 502, reason: 'auth_backend_error' }
  }

  const rows = await res.json().catch(() => [])
  const row = Array.isArray(rows) ? rows[0] : rows
  if (!row || !row.allowed) {
    const reason = row?.reason || 'invalid_key'
    return { ok: false, status: REASON_STATUS[reason] || 401, reason }
  }
  return { ok: true, status: 200, reason: 'ok', tenantId: row.out_tenant_id, apiKeyId: row.out_api_key_id }
}
