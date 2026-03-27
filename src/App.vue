<template>
  <!-- ── Loading inicial ─────────────────────── -->
  <div v-if="loading" class="loading-shell">
    <div style="color:var(--text3);font-size:13px">Cargando…</div>
  </div>

  <!-- ── Redirigir a login si no hay sesión ───── -->
  <LoginView v-else-if="!user && isLocal" />

  <!-- ── Mantenimiento ────────────────────────── -->
  <div v-else-if="mantenimiento && !isAdmin" class="loading-shell">
    <div style="max-width:420px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🔧</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:12px;color:var(--text)">
        Aplicación en mantenimiento
      </div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:24px;line-height:1.6">
        Estamos realizando tareas de mantenimiento.<br>
        La aplicación estará disponible en breve.<br>
        Disculpa las molestias.
      </div>
      <button class="btn btn-sm" @click="logout">Cerrar sesión</button>
    </div>
  </div>

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

  <!-- ── Portal Partícipe ──────────────────────── -->
  <div v-else-if="isParticipe" class="app-layout" :style="mantenimiento && isAdmin ? 'padding-top:36px' : ''">
    <!-- Banner mantenimiento admin -->
    <div v-if="mantenimiento && isAdmin"
      style="position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--orange);color:#fff;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
      <span style="font-size:16px">🔧</span>
      <span>APLICACIÓN EN MANTENIMIENTO — los usuarios no administradores no pueden acceder</span>
      <span style="font-size:16px">🔧</span>
    </div>
    <div class="sidebar-overlay" :class="{open: sidebarOpen}" @click="sidebarOpen = false"></div>
    <aside class="sidebar" :class="{open: sidebarOpen}">
      <div class="sidebar-logo">
        <div class="brand"><span class="brand-promo">PROMO</span><span class="brand-cima">CIMA</span> <span style="font-size:10px;font-weight:400;opacity:0.6;letter-spacing:0">v1.0</span></div>
        <div class="sub">Portal Partícipe</div>
      </div>
      <!-- Selector multi-empresa (solo visible con >1 empresa) -->
      <div v-if="tieneMultiEmpresa" class="empresa-selector" style="padding:8px;border-bottom:1px solid var(--border);">
        <div style="font-size:9px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Empresa activa</div>
        <div style="position:relative">
          <select
            :value="empresaId"
            @change="cambiarEmpresa($event.target.value)"
            style="width:100%;padding:6px 8px;font-size:12px;font-weight:600;color:var(--text);background:var(--bg3);border:1px solid var(--border);border-radius:4px;cursor:pointer;appearance:none;padding-right:24px;"
          >
            <option v-for="eid in empresaIds" :key="eid" :value="eid">{{ empresasMap[eid] || eid }}</option>
          </select>
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text3);font-size:10px;">▼</span>
        </div>
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
        <button @click="toggleTheme" class="theme-toggle-btn" style="margin-bottom:8px" :title="temaActual === 'dark' ? 'Cambiar a Promocima' : temaActual === 'light' ? 'Cambiar a oscuro' : 'Cambiar a claro'">
          <span>{{ temaActual === 'dark' ? '🌙' : temaActual === 'light' ? '☀️' : '🏛️' }}</span>
          <span style="font-size:11px;margin-left:6px">{{ temaActual === 'dark' ? 'Modo oscuro' : temaActual === 'light' ? 'Modo claro' : 'Promocima' }}</span>
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
  <div v-else class="app-layout" :style="mantenimiento && isAdmin ? 'padding-top:36px' : ''">
    <!-- Banner mantenimiento admin -->
    <div v-if="mantenimiento && isAdmin"
      style="position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--orange);color:#fff;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
      <span style="font-size:16px">🔧</span>
      <span>APLICACIÓN EN MANTENIMIENTO — los usuarios no administradores no pueden acceder</span>
      <span style="font-size:16px">🔧</span>
    </div>
    <div class="sidebar-overlay" :class="{open: sidebarOpen}" @click="sidebarOpen = false"></div>
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{open: sidebarOpen, collapsed: sidebarCollapsed}">
      <div class="sidebar-logo">
        <div class="sidebar-logo-img-wrap">
          <div class="brand sidebar-logo-text"><span class="brand-promo">PROMO</span><span class="brand-cima">CIMA</span> <span style="font-size:10px;font-weight:400;opacity:0.6;letter-spacing:0">v1.0</span></div>
        </div>
        <div class="sub sidebar-logo-text">Capital Privado · Gestión Interna</div>
        <button class="sidebar-collapse-btn" @click="toggleCollapse" :title="sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'">
          {{ sidebarCollapsed ? '»' : '«' }}
        </button>
      </div>
      <!-- Selector multi-empresa (solo visible con >1 empresa) -->
      <div v-if="tieneMultiEmpresa" class="empresa-selector sidebar-logo-text" style="padding:8px;border-bottom:1px solid var(--border);">
        <div style="font-size:9px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Empresa activa</div>
        <div style="position:relative">
          <select
            :value="empresaId"
            @change="cambiarEmpresa($event.target.value)"
            style="width:100%;padding:6px 8px;font-size:12px;font-weight:600;color:var(--text);background:var(--bg3);border:1px solid var(--border);border-radius:4px;cursor:pointer;appearance:none;padding-right:24px;"
          >
            <option v-for="eid in empresaIds" :key="eid" :value="eid">{{ empresasMap[eid] || eid }}</option>
          </select>
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text3);font-size:10px;">▼</span>
        </div>
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
          <span>{{ temaForzado === 'dark' ? '🌙' : '🏛️' }}</span>
          <span style="color:var(--text3)">Entorno: </span>
          <div style="display:flex;flex-direction:column;gap:1px">
            <span :style="temaForzado === 'dark' ? 'color:var(--orange);font-weight:600' : 'color:#D2B48C;font-weight:600'">
              {{ entorno }}
            </span>
            <span style="color:var(--text3);font-size:10px">{{ temaForzado === 'dark' ? '(Modo Oscuro)' : '(Tema Corporativo)' }}</span>
          </div>
        </div>
        <button v-else @click="toggleTheme" class="theme-toggle-btn" :title="temaActual === 'dark' ? 'Cambiar a Promocima' : temaActual === 'light' ? 'Cambiar a oscuro' : 'Cambiar a claro'">
          <span>{{ temaActual === 'dark' ? '🌙' : temaActual === 'light' ? '☀️' : '🏛️' }}</span>
          <span class="sidebar-footer-text" style="font-size:11px;margin-left:6px">{{ temaActual === 'dark' ? 'Modo oscuro' : temaActual === 'light' ? 'Modo claro' : 'Promocima' }}</span>
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
      <div class="content" :key="empresaKey">
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
import { useMantenimiento } from './composables/useMantenimiento.js'
const { user, perfil, loading, nombre, initiales, isAdmin, isInterno, isParticipe, participeId, participeIds, rol, logout, empresaId, empresaIds, tieneMultiEmpresa, cambiarEmpresa, empresaKey } = useAuth()
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
const empresasMap = ref({})  // id -> nombre
function toggleCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}

// ── Tema claro / oscuro ────────────────────────
// En PRUEBAS siempre modo oscuro, en PRODUCCIÓN siempre modo claro
const { mantenimiento, cargarMantenimiento } = useMantenimiento()

const entorno = import.meta.env.VITE_ENTORNO || 'PRODUCCIÓN'
// Admin → tema forzado según entorno. El resto elige libremente.
// PRUEBAS: dark forzado | PRODUCCIÓN: promocima forzado
const temaForzadoAdmin = entorno === 'PRUEBAS' ? 'dark' : 'promocima'
const temaForzado = computed(() => isAdmin.value ? temaForzadoAdmin : null)

const TEMAS = ['promocima', 'light', 'dark']
const temaActual = ref(localStorage.getItem('tema') || 'promocima')

function applyTheme(tema) {
  if (temaForzado.value) {
    document.documentElement.setAttribute('data-theme', temaForzado.value)
  } else {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('tema', tema)
    temaActual.value = tema
  }
}
// Aplicar al cargar
applyTheme(temaActual.value)
// Cuando el perfil cargue, aplicar tema forzado si es admin
watch(isAdmin, (admin) => {
  if (admin && temaForzadoAdmin) {
    applyTheme(temaForzadoAdmin)
  } else if (!admin) {
    applyTheme(temaActual.value)
  }
}, { immediate: true })
function toggleTheme() {
  if (temaForzado.value) return
  const idx = TEMAS.indexOf(temaActual.value)
  applyTheme(TEMAS[(idx + 1) % TEMAS.length])
}
// darkMode kept for compatibility
const darkMode = computed(() => temaActual.value === 'dark')
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
    participeCcpId.value = null
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

// ── Router ─────────────────────────────────────
import { useRouter } from './composables/useRouter.js'
const { page, id, navigate } = useRouter()

// Al hacer login, redirigir según rol siempre al punto de entrada correcto
watch(perfil, async (p) => {
  if (!p) return
  cargarMantenimiento()
  // Cargar nombres de empresas del usuario
  if (empresaIds.value.length) {
    const { data } = await supabase.from('empresas').select('id, nombre').in('id', empresaIds.value)
    if (data) empresasMap.value = Object.fromEntries(data.map(e => [e.id, e.nombre]))
  }
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

// ── Recargar al cambiar empresa ────────────────
watch(empresaId, (newId, oldId) => {
  if (oldId && newId !== oldId) {
    console.log('[App] empresa cambió de', oldId, 'a', newId, '- recargando')
    navigate('dashboard')
  }
})

// ── Init ───────────────────────────────────────

onMounted(async () => {
  await initAuth()
  if (!user.value && !isLocal) {
    window.location.href = '/login.html'
  }
})

watch(user, (u) => {
  if (!u && !loading.value && !isLocal) {
    window.location.href = '/login.html'
  }
})
</script>
