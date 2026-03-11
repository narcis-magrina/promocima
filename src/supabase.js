import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Evita el error de LockManager en Safari
    lock: async (name, acquireTimeout, fn) => fn(),
  },
  global: {
    // Reintento automático en errores de red (hasta 3 veces con backoff)
    fetch: (...args) => {
      let attempts = 0
      const attempt = () => fetch(...args).catch(err => {
        if (++attempts < 3) return new Promise(r => setTimeout(r, 500 * attempts)).then(attempt)
        throw err
      })
      return attempt()
    }
  }
})
