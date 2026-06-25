// Single purchase receiver — handles all 8 products
const PURCHASE_WEBHOOK = 'https://n8n.curcible.com/webhook/curcible-purchase';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Gumroad sends application/x-www-form-urlencoded
  const params = new URLSearchParams(event.body || '');
  const payload = Object.fromEntries(params.entries());

  // Skip test purchases in production
  if (payload.test === 'true' && process.env.NODE_ENV === 'production') {
    return { statusCode: 200, body: JSON.stringify({ skipped: 'test_purchase' }) };
  }

  const body = JSON.stringify({
    source:       'gumroad',
    product:      payload.product_name,
    permalink:    (payload.permalink || '').toLowerCase().trim(),
    sale_id:      payload.sale_id,
    email:        payload.email,
    full_name:    payload.full_name,
    price_cents:  payload.price,
    currency:     payload.currency,
    ip_country:   payload.ip_country,
    license_key:  payload.license_key,
    test:         payload.test === 'true',
    purchased_at: payload.sale_timestamp,
  });

  try {
    const response = await fetch(PURCHASE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await response.text();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'application/json' },
      body: text || '{}',
    };
  } catch (err) {
    console.error('Gumroad webhook error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to reach n8n', detail: err.message }),
    };
  }
};
