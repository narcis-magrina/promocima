import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const empresaActivaHeader = { value: null }

const customFetch = (url, options) => {
  const opts = options || {}
  const headers = new Headers(opts.headers || {})
  if (empresaActivaHeader.value) {
    headers.set('x-empresa-id', empresaActivaHeader.value)
  }
  let attempts = 0
  const attempt = () => fetch(url, { ...opts, headers }).catch(err => {
    if (++attempts < 3) return new Promise(r => setTimeout(r, 500 * attempts)).then(attempt)
    throw err
  })
  return attempt()
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (name, acquireTimeout, fn) => fn(),
  },
  global: { fetch: customFetch }
})
