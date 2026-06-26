import { createClient } from '@supabase/supabase-js'

// Publishable (anon) key + URL are safe to ship in the browser by design.
// Override per-environment via Vite env vars if you rotate them.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://rjgeedzpqcbylgnxwxml.supabase.co'
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kMy9fvicd9yIoN7NupGahg_h0tfFqGh'

export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshSession: true },
})
