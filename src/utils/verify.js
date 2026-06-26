// Browser reachability is limited: a no-cors fetch returns an opaque response,
// so we can confirm the server ANSWERED (DNS + TCP + TLS) but cannot read the
// status code. We therefore report "resolves" -- not "200 OK" -- and the UI/CSV
// label it honestly as "Resolves", never "Live". Status-code classification
// (404 / parked) happens server-side in the hosted API path.

async function checkUrl(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    await fetch(url, { mode: 'no-cors', signal: controller.signal })
    clearTimeout(timer)
    return true  // server answered (opaque response) -- DNS/TCP/TLS resolved
  } catch {
    return false // DNS failure, connection refused, or timeout
  }
}

// Prefer the place_id-based Maps link (sanctioned by Google Maps Platform terms)
// over caching name + address into a query string.
function mapsUrl(lead) {
  if (lead.places_id && !String(lead.places_id).startsWith('SAMPLE'))
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(lead.places_id)}`
  if (lead.name && lead.address)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address}`)}`
  return ''
}

export async function verifyReachability(leads) {
  return Promise.all(leads.map(async lead => {
    const web_verified = lead.website && lead.url_format_valid
      ? await checkUrl(lead.website)
      : lead.website ? false : null // skip malformed URLs -- already flagged by validate.js
    return {
      ...lead,
      web_verified,
      web_check: web_verified === true ? 'resolves' : web_verified === false ? 'unreachable' : null,
      maps_url: mapsUrl(lead),
    }
  }))
}
