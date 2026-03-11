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

  <!-- ── Portal Partícipe ──────────────────────── -->
  <div v-else-if="isParticipe" class="app-layout">
    <aside class="sidebar">
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
        <div class="topbar-title">{{ participeCcpId ? 'Detalle Contrato' : (nombresParticipes[participeActivoId] || 'Mi Perfil') }}</div>
      </div>
      <div class="content">
        <!-- Detalle CCP seleccionado -->
        <ContratosCCP
          v-if="participeCcpId"
          :view-id="participeCcpId"
          :read-only="true"
          @navigate="onParticipeNav"
        />
        <!-- Perfil del partícipe (KPIs + tabla CCP + editar contacto) -->
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
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
          <img src="/src/logo.png" class="sidebar-logo-img" alt="Logo">
          <div class="brand">PROMOCIMA</div>
        </div>
        <div class="sub">Capital Privado · Gestión Interna</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-label">Principal</div>
          <div class="nav-item" :class="{ active: page === 'dashboard' }" @click="navigate('dashboard')">
            <span class="icon">▦</span> Dashboard
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Entidades</div>
          <div class="nav-item" :class="{ active: page === 'clientes' }" @click="navigate('clientes')">
            <span class="icon">◫</span> Clientes
          </div>
          <div class="nav-item" :class="{ active: page === 'intermediarios' }" @click="navigate('intermediarios')">
            <span class="icon">⧉</span> Intermediarios
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Operaciones</div>
          <div class="nav-item" :class="{ active: page === 'prestamos' }" @click="navigate('prestamos')">
            <span class="icon">◎</span> Préstamos
          </div>
          <div class="nav-item" :class="{ active: page === 'cobros' }" @click="navigate('cobros')">
            <span class="icon">◐</span> Cobros
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Participación</div>
          <div class="nav-item" :class="{ active: page === 'participes' }" @click="navigate('participes')">
            <span class="icon">👥</span> Partícipes
          </div>
          <div class="nav-item" :class="{ active: page === 'contratos-ccp' }" @click="navigate('contratos-ccp')">
            <span class="icon">📋</span> Contratos CCP
          </div>
          <div class="nav-item" :class="{ active: page === 'pagos-participes' }" @click="navigate('pagos-participes')">
            <span class="icon">💸</span> Pagos
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-label">Análisis</div>
          <div class="nav-item" :class="{ active: page === 'estadisticas' }" @click="navigate('estadisticas')">
            <span class="icon">◩</span> Dirección
          </div>
        </div>
        <!-- Administración: solo admin -->
        <div v-if="isAdmin" class="nav-section">
          <div class="nav-label">Administración</div>
          <div class="nav-item" :class="{ active: page === 'usuarios' }" @click="navigate('usuarios')">
            <span class="icon">👤</span> Usuarios
          </div>
          <div class="nav-item" :class="{ active: page === 'configuracion' }" @click="navigate('configuracion')">
            <span class="icon">⊙</span> Configuración
          </div>
          <div class="nav-item" :class="{ active: page === 'administracion' }" @click="navigate('administracion')">
            <span class="icon">🛠</span> Administración
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div class="user-avatar">{{ initiales }}</div>
          <div class="user-info">
            <div class="name">{{ nombre }}</div>
            <div class="role">{{ rolLabel }}</div>
          </div>
        </div>
        <button class="btn btn-sm" style="width:100%;justify-content:center" @click="logout">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main">
      <div class="topbar">
        <div class="topbar-title">{{ pageTitle }}</div>
        <div style="font-size:12px;color:var(--text3);display:flex;align-items:center;gap:6px">
          <span style="opacity:0.5">Fecha ref.</span>
          <span style="font-family:var(--mono);color:var(--text2)">{{ fechaReferenciaGlobal ? fmtDate(fechaReferenciaGlobal) : 'hoy' }}</span>
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
        <Estadisticas       v-else-if="page === 'estadisticas'" />
        <Configuracion      v-else-if="page === 'configuracion' && isAdmin" />
        <Administracion     v-else-if="page === 'administracion' && isAdmin" />
        <!-- Fallback: acceso denegado a páginas de admin para usuarios internos -->
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
const participeCcpId    = ref(null)
const participeActivoId = ref(null)
const nombresParticipes = ref({})

// Cuando cambian los partícipes del usuario, seleccionar el primero y cargar nombres
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
  estadisticas: 'Estadísticas de Dirección',
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
import Estadisticas     from './components/Estadisticas.vue'
import Configuracion    from './components/Configuracion.vue'
import Administracion   from './components/Administracion.vue'
import { supabase }     from './supabase.js'
import { fechaReferenciaGlobal, fmtDate } from './utils.js'

// ── Init ───────────────────────────────────────
onMounted(async () => {
  initAuth()
  // Cargar fecha de referencia global desde config
  const { data } = await supabase.from('config').select('fecha_referencia').eq('id', 1).single()
  if (data?.fecha_referencia) fechaReferenciaGlobal.value = data.fecha_referencia
})
</script>
