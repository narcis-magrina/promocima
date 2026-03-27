export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/javascript')

  res.send(`
    window.APP_CONFIG = {
      SUPABASE_URL: "${process.env.SUPABASE_URL}",
      SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}",
      APP_URL: "${process.env.APP_URL || 'https://prestamos.promocima.com'}"
    };
  `)
}
