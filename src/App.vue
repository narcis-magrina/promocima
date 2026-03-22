<template>
  <!-- ── Loading inicial ─────────────────────── -->
  <div v-if="loading" class="loading-shell">
    <div style="color:var(--text3);font-size:13px">Cargando…</div>
  </div>

  <!-- ── Login ────────────────────────────────── -->
  <LoginView v-else-if="!user" />

  <!-- ── Sin perfil ────────────────────────────── -->
  <div v-else-if="!perfil" class="loading-shell">
    <div style="max-width:380px;text-align:center">
      <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:var(--text)">
        Cuenta sin perfil asignado
      </div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:20px">
        Tu cuenta ({{ user.email }}) existe pero no tiene un perfil configurado.<br>
        Contacta con el administrador.
      </div>
      <button class="btn btn-sm" @click="logout">Cerrar sesión</button>
    </div>
  </div>

  <!-- ── Activar cuenta (primer acceso) ────────── -->
  <ActivarCuenta
    v-else-if="perfil && !perfil.activo"
    :perfil="perfil"
    @activado="recargarPerfil"
    @logout="logout"
  />

  <!-- ── Portal Partícipe ──────────────────────── -->
  <div v-else-if="isParticipe" class="app-layout">
    <div class="sidebar-overlay" :class="{open: sidebarOpen}" @click="sidebarOpen = false"></div>
    <aside class="sidebar" :class="{open: sidebarOpen}">
      <div class="sidebar-logo">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
          <img src="/src/logo.png" class="sidebar-logo-img" alt="Logo">
          <div class="brand">PROMOCIMA <span style="font-size:10px;font-weight:400;opacity:0.6;letter-spacing:0">v1.0</span></div>
        </div>
        <div class="sub">Portal Partícipe</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-label">Mi Portal</div>
          <!-- Opción "Todo" — solo si hay más de un partícipe -->
          <div v-if="participeIds.length > 1"
               class="nav-item"
               :class="{ active: participeActivoId === null && !participeCcpId }"
               @click="participeActivoId = null; participeCcpId = null; sidebarOpen = false">
            <span class="icon">▦</span> Todo
          </div>
          <div v-for="pid in participeIds" :key="pid"
               class="nav-item"
               :class="{ active: participeActivoId === pid && !participeCcpId }"
               @click="participeActivoId = pid; participeCcpId = null; sidebarOpen = false">
            <span class="icon">▦</span> {{ nombresParticipes[pid] || pid }}
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <button @click="toggleTheme" class="theme-toggle-btn" style="margin-bottom:8px" :title="darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <span>{{ darkMode ? '☀️' : '🌙' }}</span>
          <span style="font-size:11px;margin-left:6px">{{ darkMode ? 'Modo claro' : 'Modo oscuro' }}</span>
        </button>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="user-avatar">{{ initiales }}</div>
          <div class="user-info">
            <div v-if="fechaCierrePortal" style="font-size:10px;color:var(--accent);margin-bottom:2px;font-family:var(--mono)">
              Datos hasta {{ fmtDate(fechaCierrePortal) }}
            </div>
            <div class="name">{{ nombre }}</div>
            <div class="role">Partícipe</div>
          </div>
        </div>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menú">☰</button>
        <div class="topbar-title">{{ participeCcpId ? 'Detalle Contrato' : 'Detalle Partícipe' }}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <HelpPanel />
          <button class="btn btn-sm" @click="logout">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <ContratosCCP
          v-if="participeCcpId"
          :view-id="participeCcpId"
          :read-only="true"
          :es-portal-participe="true"
          :fecha-cierre="fechaCierrePortal"
          @navigate="onParticipeNav"
        />
        <!-- Modo Todo: KPIs agregados de todos los partícipes -->
        <ParticiPePortal
          v-else-if="participeActivoId === null && participeIds.length > 1"
          :participe-ids="participeIds"
          :fecha-cierre="fechaCierrePortal"
          @navigate="onParticipeNav"
        />
        <!-- Modo individual: detalle de un partícipe -->
        <Participes
          v-else
          :view-id="participeActivoId"
          :read-only="true"
          :solo-editar-contacto="true"
          :es-portal-participe="true"
          :fecha-cierre="fechaCierrePortal"
          @navigate="onParticipeNav"
        />
      </div>
    </main>
  </div>

  <!-- ── App completa (admin + interno) ─────────── -->
  <div v-else class="app-layout">
    <div class="sidebar-overlay" :class="{open: sidebarOpen}" @click="sidebarOpen = false"></div>
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{open: sidebarOpen, collapsed: sidebarCollapsed}">
      <div class="sidebar-logo">
        <div class="sidebar-logo-img-wrap">
          <img src="/src/logo.png" class="sidebar-logo-img" alt="Logo">
          <div class="brand sidebar-logo-text">PROMOCIMA <span style="font-size:10px;font-weight:400;opacity:0.6;letter-spacing:0">v1.0</span></div>
        </div>
        <div class="sub sidebar-logo-text">Capital Privado · Gestión Interna</div>
        <button class="sidebar-collapse-btn" @click="toggleCollapse" :title="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'">
          {{ sidebarCollapsed ? '»' : '«' }}
        </button>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-label">Principal</div>
          <div class="nav-item" :class="{ active: page === 'dashboard' }" @click="sidebarOpen=false; navigate('dashboard')" :title="sidebarCollapsed ? 'Dashboard' : ''">
            <span class="icon">▦</span><span class="nav-item-text"> Dashboard</span>
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Entidades</div>
          <div class="nav-item" :class="{ active: page === 'clientes' }" @click="sidebarOpen=false; navigate('clientes')" :title="sidebarCollapsed ? 'Clientes' : ''">
            <span class="icon">◫</span><span class="nav-item-text"> Clientes</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'intermediarios' }" @click="sidebarOpen=false; navigate('intermediarios')" :title="sidebarCollapsed ? 'Intermediarios' : ''">
            <span class="icon">⧉</span><span class="nav-item-text"> Intermediarios</span>
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Operaciones</div>
          <div class="nav-item" :class="{ active: page === 'prestamos' }" @click="sidebarOpen=false; navigate('prestamos')" :title="sidebarCollapsed ? 'Préstamos' : ''">
            <span class="icon">◎</span><span class="nav-item-text"> Préstamos</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'cobros' }" @click="sidebarOpen=false; navigate('cobros')" :title="sidebarCollapsed ? 'Cobros' : ''">
            <span class="icon">◐</span><span class="nav-item-text"> Cobros</span>
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Participación</div>
          <div class="nav-item" :class="{ active: page === 'participes' }" @click="sidebarOpen=false; navigate('participes')" :title="sidebarCollapsed ? 'Partícipes' : ''">
            <span class="icon">👥</span><span class="nav-item-text"> Partícipes</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'contratos-ccp' }" @click="sidebarOpen=false; navigate('contratos-ccp')" :title="sidebarCollapsed ? 'Contratos CCP' : ''">
            <span class="icon">📋</span><span class="nav-item-text"> Contratos CCP</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'pagos-participes' }" @click="sidebarOpen=false; navigate('pagos-participes')" :title="sidebarCollapsed ? 'Pagos' : ''">
            <span class="icon">💸</span><span class="nav-item-text"> Pagos</span>
          </div>
        </div>
        <div v-if="isAdmin" class="nav-section">
          <div class="nav-label">Administración</div>
          <div class="nav-item" :class="{ active: page === 'usuarios' }" @click="sidebarOpen=false; navigate('usuarios')" :title="sidebarCollapsed ? 'Usuarios' : ''">
            <span class="icon">👤</span><span class="nav-item-text"> Usuarios</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'configuracion' }" @click="sidebarOpen=false; navigate('configuracion')" :title="sidebarCollapsed ? 'Configuración' : ''">
            <span class="icon">⊙</span><span class="nav-item-text"> Configuración</span>
          </div>
          <div class="nav-item" :class="{ active: page === 'administracion' }" @click="sidebarOpen=false; navigate('administracion')" :title="sidebarCollapsed ? 'Administración' : ''">
            <span class="icon">🛠</span><span class="nav-item-text"> Administración</span>
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-footer-inner">
          <div class="user-avatar">{{ initiales }}</div>
          <div class="user-info sidebar-footer-text">
            <div class="name">{{ nombre }}</div>
            <div class="role">{{ rolLabel }}</div>
            <div v-if="empresaId" style="font-size:10px;color:var(--text3);margin-top:1px;font-family:var(--mono)">{{ empresaId }}</div>
          </div>
        </div>
        <!-- Entorno forzado: mostrar info, no permitir cambio -->
        <div v-if="temaForzado" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;background:var(--bg2);font-size:12px">
          <span>{{ temaForzado === 'dark' ? '🌙' : '☀️' }}</span>
          <span style="color:var(--text3)">Entorno: </span>
          <div style="display:flex;flex-direction:column;gap:1px">
            <span :style="temaForzado === 'dark' ? 'color:var(--orange);font-weight:600' : 'color:var(--green);font-weight:600'">
              {{ entorno }}
            </span>
            <span style="color:var(--text3);font-size:10px">{{ temaForzado === 'dark' ? '(Modo Oscuro)' : '(Modo Claro)' }}</span>
          </div>
        </div>
        <button v-else @click="toggleTheme" class="theme-toggle-btn" :title="darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <span>{{ darkMode ? '☀️' : '🌙' }}</span>
          <span class="sidebar-footer-text" style="font-size:11px;margin-left:6px">{{ darkMode ? 'Modo claro' : 'Modo oscuro' }}</span>
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main">
      <div class="topbar">
        <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menú">☰</button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <HelpPanel />
          <button class="btn btn-sm" @click="logout">Cerrar sesión</button>
        </div>
      </div>
      <div class="content">
        <Dashboard          v-if="page === 'dashboard'"       @navigate="navigate" />
        <Clientes           v-else-if="page === 'clientes'"           :view-id="id" @navigate="navigate" />
        <Intermediarios     v-else-if="page === 'intermediarios'"     :view-id="id" @navigate="navigate" />
        <Prestamos          v-else-if="page === 'prestamos'"          :view-id="id" @navigate="navigate" />
        <Cobros             v-else-if="page === 'cobros'"             @navigate="navigate" />
        <Participes         v-else-if="page === 'participes'"         :view-id="id" @navigate="navigate" />
        <ContratosCCP       v-else-if="page === 'contratos-ccp'"      :view-id="id" @navigate="navigate" />
        <PagosParticipes    v-else-if="page === 'pagos-participes'"   @navigate="navigate" />
        <GestionUsuarios    v-else-if="page === 'usuarios' && isAdmin" />
        <Configuracion      v-else-if="page === 'configuracion' && isAdmin" />
        <Administracion     v-else-if="page === 'administracion' && isAdmin" />
        <div v-else class="content" style="padding:40px;color:var(--text3)">
          Página no encontrada o sin acceso.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import './styles.css'

// ── Auth ───────────────────────────────────────
import { initAuth, useAuth } from './composables/useAuth.js'
const { user, perfil, loading, nombre, initiales, isAdmin, isInterno, isParticipe, participeId, participeIds, rol, logout, isRecoveryMode, empresaId } = useAuth()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
function toggleCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}

// ── Tema claro / oscuro ────────────────────────
// En PRUEBAS siempre modo oscuro, en PRODUCCIÓN siempre modo claro
const entorno = import.meta.env.VITE_ENTORNO || 'PRODUCCIÓN'
const temaForzado = entorno === 'PRUEBAS' ? 'dark' : entorno === 'PRODUCCIÓN' ? 'light' : null
const darkMode = ref(temaForzado !== null ? temaForzado === 'dark' : localStorage.getItem('theme') === 'dark')
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  if (!temaForzado) localStorage.setItem('theme', dark ? 'dark' : 'light')
}
// Aplicar al cargar
applyTheme(darkMode.value)
function toggleTheme() {
  if (temaForzado) return  // No permitir cambio si el tema está forzado por entorno
  darkMode.value = !darkMode.value
  applyTheme(darkMode.value)
}
const participeCcpId    = ref(null)
const participeActivoId = ref(null)
const nombresParticipes = ref({})
const fechaCierrePortal = ref(null)

// Cargar fecha de cierre del portal desde config
watch(isParticipe, async (val) => {
  if (!val) return
  const { data } = await supabase.from('config').select('fecha_cierre_portal').eq('id', 1).single()
  fechaCierrePortal.value = data?.fecha_cierre_portal || null
}, { immediate: true })

watch(participeIds, async (ids) => {
  if (!ids.length) return
  // Si hay varios partícipes y no hay uno seleccionado, arrancar en modo Todo (null)
  // Si hay uno solo, seleccionarlo directamente
  if (participeActivoId.value !== null && !ids.includes(participeActivoId.value)) {
    participeActivoId.value = ids.length === 1 ? ids[0] : null
  }
  if (ids.length === 1 && participeActivoId.value === null) {
    participeActivoId.value = ids[0]
  }
  const { data } = await supabase.from('participes').select('id, nombre').in('id', ids)
  nombresParticipes.value = Object.fromEntries((data || []).map(p => [p.id, p.nombre]))
}, { immediate: true })

function onParticipeNav(page, id) {
  if (page === 'contratos-ccp' && id) {
    participeCcpId.value = id
  } else {
    participeCcpId.value = null
  }
}

const rolLabel = computed(() => ({ admin: 'Administrador', interno: 'Usuario Interno', participe: 'Partícipe' }[rol.value] || rol.value))

// ── Recargar perfil tras activar cuenta ────────
async function recargarPerfil() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single()
    if (data) perfil.value = data
  }
}

// ── Router ─────────────────────────────────────
import { useRouter } from './composables/useRouter.js'
const { page, id, navigate } = useRouter()

// Al hacer login, redirigir según rol siempre al punto de entrada correcto
watch(perfil, (p) => {
  if (!p) return
  if (p.rol === 'participe') return  // portal tiene su propio layout
  navigate('dashboard')              // admin/interno siempre al dashboard
}, { immediate: true })

// ── Títulos ────────────────────────────────────
const titles = {
  dashboard: 'Dashboard Financiero',
  clientes: 'Clientes',
  intermediarios: 'Intermediarios',
  prestamos: 'Préstamos',
  cobros: 'Cobros',
  participes: 'Gestión de Partícipes',
  'contratos-ccp': 'Contratos Cuenta Partícipe',
  'pagos-participes': 'Pagos a Partícipes',
  configuracion: 'Configuración Global',
  usuarios: 'Gestión de Usuarios',
}
const pageTitle = computed(() => titles[page.value] || '')

// ── Components ─────────────────────────────────
import LoginView        from './components/LoginView.vue'
import ActivarCuenta    from './components/ActivarCuenta.vue'
import ParticiPePortal  from './components/ParticiPePortal.vue'
import GestionUsuarios  from './components/GestionUsuarios.vue'
import Dashboard        from './components/Dashboard.vue'
import Clientes         from './components/Clientes.vue'
import Intermediarios   from './components/Intermediarios.vue'
import Prestamos        from './components/Prestamos.vue'
import Cobros           from './components/Cobros.vue'
import Participes       from './components/Participes.vue'
import ContratosCCP     from './components/ContratosCCP.vue'
import PagosParticipes  from './components/PagosParticipes.vue'
import Configuracion    from './components/Configuracion.vue'
import Administracion   from './components/Administracion.vue'
import HelpPanel        from './components/HelpPanel.vue'
import { supabase }     from './supabase.js'
import { fmtDate }      from './utils.js'

// ── Init ───────────────────────────────────────
onMounted(() => {
  initAuth()
})
</script>
