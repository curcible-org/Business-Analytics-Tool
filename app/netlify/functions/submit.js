const N8N_WEBHOOK = 'https://n8n-production-fbbb.up.railway.app/webhook/curcible-onboarding';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    });

    const text = await response.text();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'application/json' },
      body: text || '{}',
    };
  } catch (err) {
    console.error('Webhook proxy error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to reach webhook', detail: err.message }),
    };
  }
};
