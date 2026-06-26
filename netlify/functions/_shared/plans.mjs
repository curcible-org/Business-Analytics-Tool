// Plan definitions. Stripe price IDs come from env; quota/rate are the entitlements
// applied to forge_tenants when a subscription becomes active. Edit freely.

export const PLANS = {
  free:    { plan: 'free',    monthly_quota: 50,   rate_per_min: 6  },
  starter: { plan: 'starter', monthly_quota: 500,  rate_per_min: 12 },
  pro:     { plan: 'pro',     monthly_quota: 5000, rate_per_min: 30 },
}

// Map a Stripe price ID -> plan key. Set these env vars to your live price IDs.
export function planForPrice(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_PRO]:     'pro',
  }
  return map[priceId] || 'free'
}

// plan key -> the Stripe price id (for checkout)
export function priceForPlan(planKey) {
  if (planKey === 'starter') return process.env.STRIPE_PRICE_STARTER
  if (planKey === 'pro')     return process.env.STRIPE_PRICE_PRO
  return null
}
