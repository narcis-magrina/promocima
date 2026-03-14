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
          <div class="brand">PROMOCIMA</div>
        </div>
        <div class="sub">Portal Partícipe</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-label">Mi Portal</div>
          <div v-for="pid in participeIds" :key="pid"
               class="nav-item"
               :class="{ active: participeActivoId === pid && !participeCcpId }"
               @click="participeActivoId = pid; participeCcpId = null">
            <span class="icon">▦</span> {{ nombresParticipes[pid] || pid }}
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div class="user-avatar">{{ initiales }}</div>
          <div class="user-info">
            <div class="name">{{ nombre }}</div>
            <div class="role">Partícipe</div>
          </div>
        </div>
        <button class="btn btn-sm" style="width:100%;justify-content:center" @click="logout">
          Cerrar sesión
        </button>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menú">☰</button>
        <div class="topbar-title">{{ participeCcpId ? 'Detalle Contrato' : (nombresParticipes[participeActivoId] || 'Mi Perfil') }}</div>
      </div>
      <div class="content">
        <ContratosCCP
          v-if="participeCcpId"
          :view-id="participeCcpId"
          :read-only="true"
          @navigate="onParticipeNav"
        />
        <Participes
          v-else
          :view-id="participeActivoId"
          :read-only="true"
          :solo-editar-contacto="true"
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
          <div class="brand sidebar-logo-text">PROMOCIMA</div>
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
          <div class="user-info">
            <div class="name">{{ nombre }}</div>
            <div class="role">{{ rolLabel }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main">
      <div class="topbar">
        <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menú">☰</button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <button class="btn btn-sm" @click="logout">Cerrar sesión</button>
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
const { user, perfil, loading, nombre, initiales, isAdmin, isInterno, isParticipe, participeId, participeIds, rol, logout, isRecoveryMode } = useAuth()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
function toggleCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}
const participeCcpId    = ref(null)
const participeActivoId = ref(null)
const nombresParticipes = ref({})

watch(participeIds, async (ids) => {
  if (!ids.length) return
  if (!participeActivoId.value || !ids.includes(participeActivoId.value)) {
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
import { supabase }     from './supabase.js'

// ── Init ───────────────────────────────────────
onMounted(() => {
  initAuth()
})
</script>
