const SUPABASE_URL = 'https://dicsmyxogptpnepycixq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3NteXhvZ3B0cG5lcHljaXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5MDgzMiwiZXhwIjoyMDg4OTY2ODMyfQ.r1MZQtmtvjzhLAMbEFIToudaCPJySZdaCsgIn3Pd4XQ'

function supabaseGet(tabla, filtros) {
  let url = `${SUPABASE_URL}/rest/v1/${tabla}?${filtros}`
  const res = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  return JSON.parse(res.getContentText())
}

function supabasePatch(tabla, filtro, datos) {
  const url = `${SUPABASE_URL}/rest/v1/${tabla}?${filtro}`
  UrlFetchApp.fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(datos)
  })
}

function enviarCorreosDesdeSupabase() {
  console.log('INICIO')

  // Obtener emails pendientes
  const pendientes = supabaseGet('emails_pendientes', 'enviado=eq.false&select=id,para,nombre,password,url,template_nombre')
  console.log('Pendientes: ' + pendientes.length)

  if (pendientes.length === 0) {
    console.log('No hay emails pendientes')
    return
  }

  // Obtener todos los templates de una vez
  const templates = supabaseGet('email_templates', 'select=nombre,asunto,cuerpo_html')
  const templateMap = {}
  templates.forEach(t => templateMap[t.nombre] = t)

  let enviados = 0

  pendientes.forEach(function(row) {
    const { id, para, nombre, password, url, template_nombre } = row
    const templateNombre = template_nombre || 'invitacion'

    console.log('Procesando: ' + para + ' | template: ' + templateNombre)

    const template = templateMap[templateNombre]
    if (!template) {
      console.error('Template no encontrado: ' + templateNombre)
      return
    }

    const asunto   = reemplazarPlaceholders(template.asunto, { para, nombre, password, url })
    const htmlBody = reemplazarPlaceholders(template.cuerpo_html, { para, nombre, password, url })

    GmailApp.sendEmail(para, asunto, 'Tu cliente de correo no soporta HTML.', {
      from: 'narcism.magrinya@gmail.com',
      htmlBody: htmlBody
    })

    console.log('Email enviado a: ' + para)

    // Marcar como enviado
    supabasePatch('emails_pendientes', 'id=eq.' + id, { enviado: true })
    enviados++
  })

  console.log('FIN. Correos enviados: ' + enviados)
}

function reemplazarPlaceholders(texto, data) {
  if (!texto) return ''
  const email = data.para || ''
  return texto
    .replace(/\{\{para\}\}/g,     escapeHtml(email))
    .replace(/\{\{email\}\}/g,    escapeHtml(email))
    .replace(/\{\{nombre\}\}/g,   escapeHtml(data.nombre || ''))
    .replace(/\{\{password\}\}/g, escapeHtml(data.password || ''))
    .replace(/\{\{url\}\}/g,      data.url || '')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;')
}
