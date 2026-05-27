const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export const handler = async () => ({
  statusCode: 200,
  headers: CORS,
  body: JSON.stringify({
    ok: true,
    service: 'Curcible Forge API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }),
})
