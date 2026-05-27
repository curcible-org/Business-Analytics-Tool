async function checkUrl(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    await fetch(url, { mode: 'no-cors', signal: controller.signal })
    clearTimeout(timer)
    return true  // domain resolved (opaque response = server answered)
  } catch {
    return false // DNS failure, connection refused, or timeout
  }
}

function mapsUrl(name, address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`
}

export async function verifyReachability(leads) {
  return Promise.all(leads.map(async lead => {
    const web_verified = lead.website && lead.url_format_valid
      ? await checkUrl(lead.website)
      : lead.website ? false : null // skip malformed URLs — already flagged by validate.js
    return {
      ...lead,
      web_verified,
      maps_url: mapsUrl(lead.name, lead.address),
    }
  }))
}
