/**
 * POST /.netlify/functions/stripe-checkout  ->  /api/v1/billing/checkout
 * Auth: Authorization: Bearer <supabase user access_token>
 * Body: { plan: 'starter' | 'pro' }
 * Returns: { ok, url }  — redirect the browser to `url`.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO,
 *      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL (optional)
 */
import Stripe from 'stripe'
import { verifyUser, getTenantByUser, patchTenant } from './_shared/supabaseAdmin.mjs'
import { priceForPlan } from './_shared/plans.mjs'

const CORS = {
  'Access-Control-Allow-Origin': process.env.APP_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const json = (s, b) => ({ statusCode: s, headers: CORS, body: JSON.stringify(b) })

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS }
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Use POST.' })
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { ok: false, error: 'Billing not configured (STRIPE_SECRET_KEY).' })

  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const user = await verifyUser(token)
  if (!user?.id) return json(401, { ok: false, error: 'Unauthorized.' })

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { ok: false, error: 'Invalid JSON.' }) }
  const price = priceForPlan(body.plan)
  if (!price) return json(400, { ok: false, error: 'Unknown or unconfigured plan.' })

  const tenant = await getTenantByUser(user.id)
  if (!tenant) return json(400, { ok: false, error: 'No tenant. Open the app once to bootstrap your account.' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { tenant_id: tenant.id, user_id: user.id } })
    customerId = customer.id
    await patchTenant(tenant.id, { stripe_customer_id: customerId })
  }

  const appUrl = process.env.APP_URL || 'https://forge-lead-intelligence.netlify.app'
  const sessionObj = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: tenant.id,
    subscription_data: { metadata: { tenant_id: tenant.id } },
    success_url: `${appUrl}/?billing=success`,
    cancel_url: `${appUrl}/?billing=cancel`,
  })

  return json(200, { ok: true, url: sessionObj.url })
}
