// ─── Google Places Text Search (New API) ─────────────────────────────────────
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
// Billing: $0.032 / request · $200 free credit / month ≈ 6,250 free searches
// Requires a GCP project with billing enabled + Places API (New) enabled.

// Industry search terms per Blueprint product.
// Each entry should surface local/regional SMBs that genuinely need that product.
const PRODUCT_QUERY_MAP = {
  P01: 'small businesses in',            // InboxCore — email autoresponder: broad SMB
  P02: 'local service companies in',     // ContentCore — SEO blog: service co. need content
  P03: 'marketing agencies in',          // LeadCore — LinkedIn scraper: agencies sell B2B
  P04: 'restaurants and retail stores in', // SocialCore — 9-platform posting
  P05: 'staffing and hospitality businesses in', // TalentCore — HR screener
  P06: 'customer service businesses in', // KnowCore — WhatsApp chatbot
  P07: 'professional services firms in', // MeetCore — meeting summaries
  P08: 'digital marketing companies in', // TubeCore — YouTube summaries
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.businessStatus',
  'places.types',
  'places.rating',
  'places.userRatingCount',
].join(',')

// Parse "123 Main St, Austin, TX 78701, USA" → { street, city, stateParsed, zip }
function parseAddress(formattedAddress) {
  if (!formattedAddress) return { street: '', city: '', stateParsed: '', zip: '' }
  const parts = formattedAddress.split(',').map(s => s.trim())
  // Typical US structure: [street, city, "ST ZIP", country]
  const country = parts[parts.length - 1]               // "USA"
  const stateZip = parts[parts.length - 2] || ''        // "TX 78701"
  const city = parts[parts.length - 3] || ''            // "Austin"
  const streetParts = parts.slice(0, parts.length - 3)  // ["123 Main St"]
  const street = streetParts.join(', ')

  const szMatch = stateZip.match(/^([A-Z]{2,3})\s+(\d{4,6}(?:-\d{4})?)$/)
  return {
    street,
    city,
    stateParsed: szMatch ? szMatch[1] : stateZip,
    zip:         szMatch ? szMatch[2] : '',
    country,
  }
}

// Build a clean industry label from Google Place types array
function inferIndustry(types = []) {
  const priority = [
    'restaurant','food','cafe','bar','lodging','gym','fitness_center',
    'hair_care','beauty_salon','dentist','doctor','hospital','pharmacy',
    'lawyer','accounting','real_estate_agency','insurance_agency',
    'car_repair','electrician','plumber','contractor','roofing_contractor',
    'moving_company','storage','travel_agency','spa','pet_store','florist',
    'clothing_store','home_goods_store','furniture_store',
    'marketing_agency','advertising_agency','staffing_agency',
  ]
  for (const type of priority) {
    if (types.includes(type)) {
      return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
  }
  // Fall back to first relevant type (skip generic ones)
  const skip = new Set(['establishment','point_of_interest','food','store','health','finance'])
  const first = types.find(t => !skip.has(t))
  return first ? first.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Local Business'
}

export async function searchPlaces({ state, country, targetProduct, apiKey }) {
  const prefix = PRODUCT_QUERY_MAP[targetProduct] || 'local businesses in'
  const textQuery = `${prefix} ${state}, ${country}`

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 20,
      languageCode: 'en',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    throw new Error(`Google Places: ${msg}`)
  }

  const data = await res.json()
  const places = data.places || []

  // Filter permanently/temporarily closed
  const active = places.filter(p =>
    p.businessStatus !== 'CLOSED_PERMANENTLY' &&
    p.businessStatus !== 'CLOSED_TEMPORARILY'
  )

  return active.map(p => {
    const { street, city, stateParsed, zip } = parseAddress(p.formattedAddress)
    const phone   = p.nationalPhoneNumber || p.internationalPhoneNumber || null
    const name    = p.displayName?.text || 'Unknown Business'
    const website = p.websiteUri ? p.websiteUri.replace(/\/$/, '') : null
    const rating  = p.rating ? `${p.rating}★ (${p.userRatingCount || 0} reviews)` : null

    return {
      // Core fields (used by rest of pipeline)
      name,
      address:   p.formattedAddress || `${street}, ${city}, ${stateParsed} ${zip}`,
      city,
      state:     stateParsed,
      zip,
      phone,
      email:     null,
      website,
      social_only: false,
      industry:  inferIndustry(p.types || []),

      // Scoring fields — filled by LLM Intelligence step
      score:               null,
      buy_probability:     null,
      website_quality:     null,
      services:            [],
      tech_stack:          [],
      pain_points:         [],
      problem_solved:      null,
      sale_strategy:       null,
      recommended_products: [],
      notes:               rating ? `Google Places: ${rating}` : 'Google Places listing',

      // Places metadata (preserved for reference)
      places_id:           p.id,
      places_rating:       p.rating || null,
      places_review_count: p.userRatingCount || 0,
      places_status:       p.businessStatus || 'OPERATIONAL',
      places_types:        (p.types || []).slice(0, 4),
    }
  })
}
