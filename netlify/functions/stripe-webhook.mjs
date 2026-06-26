/**
 * POST /.netlify/functions/stripe-webhook  ->  /api/v1/billing/webhook
 * Stripe webhook. Verifies signature, then maps subscription state onto the
 * tenant's plan / monthly_quota / rate_per_min in Supabase.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Set the endpoint in Stripe to .../api/v1/billing/webhook and subscribe to:
 *   checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */
import Stripe from 'stripe'
import { getTenantByCustomer, patchTenant } from './_shared/supabaseAdmin.mjs'
import { PLANS, planForPrice } from './_shared/plans.mjs'

async function resolveTenant(meta, customerId) {
  if (meta?.tenant_id) return { id: meta.tenant_id }
  if (customerId) return await getTenantByCustomer(customerId)
  return null
}

async function applyPlan(tenantId, planKey, sub) {
  const p = PLANS[planKey] || PLANS.free
  await patchTenant(tenantId, {
    plan: p.plan,
    monthly_quota: p.monthly_quota,
    rate_per_min: p.rate_per_min,
    stripe_subscription_id: sub?.id || null,
    plan_renews_at: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    status: 'active',
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST.' }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    return { statusCode: 500, body: 'Billing not configured.' }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature']
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body

  let evt
  try {
    evt = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return { statusCode: 400, body: `Webhook signature failed: ${e.message}` }
  }

  try {
    if (evt.type === 'checkout.session.completed') {
      const s = evt.data.object
      const tenant = await resolveTenant({ tenant_id: s.client_reference_id }, s.customer)
      if (tenant?.id && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription)
        const priceId = sub.items?.data?.[0]?.price?.id
        await applyPlan(tenant.id, planForPrice(priceId), sub)
      }
    } else if (evt.type === 'customer.subscription.updated') {
      const sub = evt.data.object
      const tenant = await resolveTenant(sub.metadata, sub.customer)
      if (tenant?.id) {
        const priceId = sub.items?.data?.[0]?.price?.id
        const planKey = (sub.status === 'active' || sub.status === 'trialing') ? planForPrice(priceId) : 'free'
        await applyPlan(tenant.id, planKey, sub)
      }
    } else if (evt.type === 'customer.subscription.deleted') {
      const sub = evt.data.object
      const tenant = await resolveTenant(sub.metadata, sub.customer)
      if (tenant?.id) await applyPlan(tenant.id, 'free', null)
    }
  } catch (e) {
    return { statusCode: 500, body: `Handler error: ${e.message}` }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
