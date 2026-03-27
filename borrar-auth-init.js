(function() {
  var hash   = window.location.hash
  var search = window.location.search
  var params = new URLSearchParams(search)
  var tokenHash = params.get('token_hash')
  var type      = params.get('type') || 'recovery'

  if (tokenHash) {
    // Flujo PKCE: invite o recovery via token_hash en query string
    sessionStorage.setItem('supabase_token_hash', tokenHash)
    sessionStorage.setItem('supabase_auth_type', type)
    window.history.replaceState(null, '', window.location.pathname)
  } else if (hash.includes('access_token')) {
    // Flujo implícito: tokens en el hash de la URL
    var hashType = hash.includes('type=invite') ? 'invite' : 'recovery'
    sessionStorage.setItem('supabase_auth_hash', hash)
    sessionStorage.setItem('supabase_auth_type', hashType)
    window.history.replaceState(null, '', window.location.pathname)
  } else if (hash.includes('error=access_denied') || hash.includes('error_code=otp_expired')) {
    sessionStorage.setItem('supabase_auth_error', 'El enlace ha expirado. Solicita al administrador que te reenvíe la invitación.')
    window.history.replaceState(null, '', window.location.pathname)
  }
})()
