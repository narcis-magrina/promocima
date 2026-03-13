function enviarCorreosDesdeNeon() {
  const CONFIG = {
    jdbcUrl: 'jdbc:postgresql://ep-polished-thunder-agmmqpjf.c-2.eu-central-1.aws.neon.tech/neondb',
    dbUser: 'neondb_owner',
    dbPassword: 'npg_CTVySKr7R1PB',
    tablaTemplates: 'email_templates',
    tablaDestinatarios: 'emails_pendientes'
  };

  let conn, stmtPendientes, stmtTemplate, stmtUpdate, rsPendientes;

  try {
    console.log('INICIO');
    conn = Jdbc.getConnection(CONFIG.jdbcUrl, CONFIG.dbUser, CONFIG.dbPassword);
    console.log('Conexión OK');

    // Obtener emails pendientes con su template_nombre
    stmtPendientes = conn.prepareStatement(`
      SELECT id, para, nombre, password, url, template_nombre
      FROM ${CONFIG.tablaDestinatarios}
      WHERE enviado = false
    `);
    rsPendientes = stmtPendientes.executeQuery();

    stmtUpdate = conn.prepareStatement(`
      UPDATE ${CONFIG.tablaDestinatarios}
      SET enviado = true
      WHERE id = ?
    `);

    let enviados = 0;

    while (rsPendientes.next()) {
      const id             = rsPendientes.getInt('id');
      const para           = rsPendientes.getString('para');
      const nombre         = rsPendientes.getString('nombre');
      const password       = rsPendientes.getString('password');
      const url            = rsPendientes.getString('url');
      const templateNombre = rsPendientes.getString('template_nombre') || 'invitacion';

      console.log('Procesando: ' + para + ' | template: ' + templateNombre);

      // Cargar template por nombre
      stmtTemplate = conn.prepareStatement(`
        SELECT asunto, cuerpo_html
        FROM ${CONFIG.tablaTemplates}
        WHERE nombre = ?
        LIMIT 1
      `);
      stmtTemplate.setString(1, templateNombre);
      const rsTemplate = stmtTemplate.executeQuery();

      if (!rsTemplate.next()) {
        console.error('Template no encontrado: ' + templateNombre);
        rsTemplate.close();
        stmtTemplate.close();
        continue;
      }

      const asuntoTemplate    = rsTemplate.getString('asunto');
      const cuerpoHtmlTemplate = rsTemplate.getString('cuerpo_html');
      rsTemplate.close();
      stmtTemplate.close();

      const asunto   = reemplazarPlaceholders(asuntoTemplate, { para, nombre, password, url });
      const htmlBody = reemplazarPlaceholders(cuerpoHtmlTemplate, { para, nombre, password, url });

      GmailApp.sendEmail(para, asunto, 'Tu cliente de correo no soporta HTML.', {
        from: 'nmagrina@promocima.com',
        // from: 'narcis.magrinya@gmail.com',
        htmlBody: htmlBody
      });

      console.log('Email enviado a: ' + para);

      stmtUpdate.setInt(1, id);
      stmtUpdate.executeUpdate();
      enviados++;
    }

    console.log('FIN. Correos enviados: ' + enviados);

  } catch (e) {
    console.error('ERROR: ' + e.message);
    throw e;
  } finally {
    if (rsPendientes)   rsPendientes.close();
    if (stmtPendientes) stmtPendientes.close();
    if (stmtUpdate)     stmtUpdate.close();
    if (conn)           conn.close();
  }
}

function reemplazarPlaceholders(texto, data) {
  if (!texto) return '';
  const email = data.para || '';
  return texto
    .replace(/\{\{para\}\}/g,     escapeHtml(email))
    .replace(/\{\{email\}\}/g,    escapeHtml(email))
    .replace(/\{\{nombre\}\}/g,   escapeHtml(data.nombre || ''))
    .replace(/\{\{password\}\}/g, escapeHtml(data.password || ''))
    .replace(/\{\{url\}\}/g,      data.url || '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}