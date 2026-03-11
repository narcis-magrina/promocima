import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lsdmmnxkrrliutleyehp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG1tbnhrcnJsaXV0bGV5ZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTUzMDAsImV4cCI6MjA4NzMzMTMwMH0.RfBENxz49du3CUkQeCbt0i3Y9mlRSQzhZqI6s34cxCM'

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
