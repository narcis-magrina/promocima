<template>
  <div>
    <!-- DETALLE -->
    <template v-if="viewId">
      <div class="back-btn" @click="$emit('navigate', 'clientes')">← Volver a Clientes</div>
      <div v-if="!cliente" class="table-empty">Cargando...</div>
      <template v-else>
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex;align-items:center;gap:10px">
              {{ cliente.nombre }}
              <span v-if="clienteCIRBE" class="badge badge-blue" style="font-size:11px">CIRBE</span>
            </div>
            <div class="section-sub">{{ cliente.id }}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-registrar" @click="editar(cliente)">✎ Editar</button>
            <button class="btn btn-sm btn-danger" @click="eliminarCliente(cliente.id)">✕ Eliminar</button>
          </div>
        </div>

        <!-- Datos generales -->
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">CIF / NIF</span><span class="detail-value mono">{{ cliente.cif || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Teléfono</span><span class="detail-value">{{ cliente.telefono || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">{{ cliente.email || '—' }}</span></div>
          <div class="detail-item span-2"><span class="detail-label">Notas</span><span class="detail-value">{{ cliente.notas || '—' }}</span></div>
        </div>

        <!-- Titulares y garantes -->
        <div class="table-card">
          <div class="table-header">
            <h3>Titulares y Garantes</h3>
            <button class="btn btn-sm btn-primary" @click="abrirModalTitular()">+ Añadir</button>
          </div>
          <table>
            <thead>
              <tr><th>Nombre</th><th>CIF / NIF</th><th>Tipo</th><th style="width:80px"></th></tr>
            </thead>
            <tbody>
              <tr v-for="t in titularesCliente" :key="t.id">
                <td style="font-weight:500">{{ t.nombre }}</td>
                <td class="td-mono" style="font-size:12px">{{ t.cif || '—' }}</td>
                <td>
                  <span class="badge" :class="t.tipo === 'Titular' ? 'badge-blue' : 'badge-orange'">{{ t.tipo }}</span>
                </td>
                <td style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-ghost" @click="editarTitular(t)">✎</button>
                  <button class="btn btn-sm btn-danger-solid" style="padding:2px 7px;font-size:13px" @click="eliminarTitular(t.id)">✕</button>
                </td>
              </tr>
              <tr v-if="!titularesCliente.length">
                <td colspan="4" class="table-empty">Sin titulares ni garantes añadidos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Préstamos -->
        <div class="table-card">
          <div class="table-header"><h3>Préstamos Asociados <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
          <table>
            <thead><tr><th>ID</th><th>Alias</th><th style="text-align:right">Importe</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-for="p in prestamosCliente" :key="p.id">
                <td class="td-mono" style="color:var(--text3)">{{ p.id }}</td>
                <td>{{ p.alias }}</td>
                <td class="td-mono td-right">{{ fmt(p.importe) }}</td>
                <td v-html="getEstadoBadge(p.estado)" />
              </tr>
              <tr v-if="!prestamosCliente.length"><td colspan="4" class="table-empty">Sin préstamos</td></tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- LISTA -->
    <template v-else>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">
        <div class="kpi-card kc-blue">
          <div class="kpi-label">Personas</div>
          <div class="kpi-value">{{ nPersonas }}</div>
          <div class="kpi-sub">Clientes persona física</div>
        </div>
        <div class="kpi-card kc-green">
          <div class="kpi-label">Empresas</div>
          <div class="kpi-value">{{ nEmpresas }}</div>
          <div class="kpi-sub">Clientes persona jurídica</div>
        </div>
        <div class="kpi-card kc-blue">
          <div class="kpi-label">Clientes CIRBE</div>
          <div class="kpi-value">{{ nEmpresasCirbe }}</div>
          <div class="kpi-sub">Con declaración CIRBE</div>
        </div>
      </div>
      <div class="section-header">
        <div>
          <div class="section-title">Clientes</div>
          <div class="section-sub">{{ items.length }} clientes registrados</div>
        </div>
        <button class="btn btn-primary" @click="abrirModal()">+ Nuevo Cliente</button>
      </div>
      <div class="table-card">
        <div class="table-header">
          <h3>Listado <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
          <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Buscar..." v-model="busqueda" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
        </div>
        <table>
          <thead><tr>
            <th @click="setSort('nombre')" :class="thClass('nombre')">Nombre <span class="sort-icon">{{ thIcon('nombre') }}</span></th>
            <th @click="setSort('tipo')" :class="thClass('tipo')" class="col-hide-mobile">Tipo <span class="sort-icon">{{ thIcon('tipo') }}</span></th>
  
            <th class="col-hide-mobile">Teléfono</th>
            <th class="col-hide-mobile">Email</th>
            <th @click="setSort('nPrestamos')" :class="thClass('nPrestamos')" style="text-align:center">Préstamos <span class="sort-icon">{{ thIcon('nPrestamos') }}</span></th>
            <th style="text-align:center" class="col-hide-mobile">CIRBE</th>
            <th style="width:40px"></th>
          </tr></thead>
          <tbody>
            <tr v-for="c in clientesFiltrados" :key="c.id" style="cursor:pointer" @click="$emit('navigate','clientes',c.id)">
              <td style="font-weight:500">{{ c.nombre }}</td>
              <td class="col-hide-mobile"><span class="badge" :class="c.tipo === 'empresa' ? 'badge-green' : 'badge-blue'">{{ c.tipo }}</span></td>

              <td style="font-size:12px" class="col-hide-mobile">{{ c.telefono || '—' }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ c.email || '—' }}</td>
              <td class="td-center"><span class="badge badge-gray">{{ c.nPrestamos || 0 }}</span></td>
              <td class="td-center col-hide-mobile">
                <span v-if="c.cirbe" class="badge badge-blue">Sí</span>
                <span v-else style="color:var(--text3)">—</span>
              </td>
              <td @click.stop>
                <button
                  class="btn btn-sm btn-danger-solid"
                  :disabled="prestamos.some(p => p.cliente_id === c.id)"
                  :title="prestamos.some(p => p.cliente_id === c.id) ? 'No se puede eliminar: tiene préstamos' : 'Eliminar cliente'"
                  @click.stop="eliminarClienteLista(c.id)"
                >✕</button>
              </td>
            </tr>
            <tr v-if="!clientesFiltrados.length"><td colspan="7" class="table-empty">Sin resultados</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- MODAL CLIENTE -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ form.id ? 'Editar' : 'Nuevo' }} Cliente</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrarModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Nombre / Razón Social <span class="req">*</span></label>
              <input class="form-control" v-focus v-model="form.nombre" placeholder="Nombre completo o razón social">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" :class="{'filter-active': !!form.tipo}" v-model="form.tipo" :style="!!form.tipo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option value="empresa">Empresa</option>
                <option value="persona">Persona Física</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">CIF / NIF</label>
              <input class="form-control" v-model="form.cif" placeholder="A12345678">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-control" v-model="form.telefono">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" v-model="form.email">
            </div>
            <div class="form-group span-2">
              <label class="form-label">Notas</label>
              <textarea class="form-control" v-model="form.notas"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>

    <!-- MODAL TITULAR -->
    <div class="modal-overlay" v-if="modalTitular">
      <div class="modal" style="max-width:480px">
        <div class="modal-header">
          <h2>{{ formTitular.id ? 'Editar' : 'Nuevo' }} Titular / Garante</h2>
          <button class="btn btn-ghost btn-sm" @click="modalTitular = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid cols-1">
            <div class="form-group">
              <label class="form-label">Nombre <span class="req">*</span></label>
              <input class="form-control" v-focus v-model="formTitular.nombre">
            </div>
            <div class="form-group">
              <label class="form-label">CIF / NIF</label>
              <input class="form-control" v-model="formTitular.cif">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" :class="{'filter-active': !!formTitular.tipo}" v-model="formTitular.tipo" :style="!!formTitular.tipo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option>Titular</option>
                <option>Garante</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="modalTitular = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarTitular">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { validarCampos, traducirErrorSupabase } from '../utils/validar.js'
import { ref, computed, toRef } from 'vue'
import { useSort } from '../composables/useSort.js'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { useCrud } from '../composables/useCrud.js'
import { supabase } from '../supabase.js'
import { fmt, getEstadoBadge } from '../utils.js'

const props = defineProps({ viewId: String })
const emit  = defineEmits(['navigate'])

const busqueda = usePersistedRef('clientes.busqueda', '')
const titulares = ref([])

const {
  items, secundarios: prestamos,
  modalAbierto, form,
  abrirModal, editar, cerrarModal, guardar, eliminar,
  inicializar,
} = useCrud(
  'clientes',
  () => ({ id: null, nombre: '', tipo: 'empresa', cif: '', telefono: '', email: '', notas: '' }),
  {
    ordenPor:   'nombre',
    prefixId:   'C',
    idPadding:  6,
    secundaria: { tabla: 'prestamos', select: 'id, alias, importe, estado, cliente_id, cirbe', orden: 'id' },
    enriquecerItems: (clientes, prest) =>
      clientes.map(c => ({
        ...c,
        nPrestamos: prest.filter(p => p.cliente_id === c.id).length,
        // CIRBE calculado: true si algún préstamo del cliente tiene cirbe=true
        cirbe: prest.some(p => p.cliente_id === c.id && p.cirbe),
      })),
    validar: f => {
      const errores = validarCampos(f, [
        { campo: 'nombre', label: 'Nombre / Razón Social', requerido: true },
      ])
      return errores.length ? errores.join('\n') : null
    },
    prepararData: f => ({
      nombre:   f.nombre.trim(),
      tipo:     f.tipo,
      cif:      (f.cif      || '').trim(),
      telefono: (f.telefono || '').trim(),
      email:    (f.email    || '').trim(),
      notas:    (f.notas    || '').trim(),
    }),
  }
)

inicializar(toRef(props, 'viewId'))

// Cargar titulares al montar (tabla separada, fuera del useCrud)
async function cargarTitulares() {
  const { data } = await supabase.from('titulares').select('*').order('nombre')
  titulares.value = data || []
}
cargarTitulares()

// ── Computed ──────────────────────────────────────────────────────────────────
const { sorted: clientesOrdenados, setSort, thIcon, thClass } = useSort(items, 'nombre')

const nPersonas      = computed(() => items.value.filter(c => (c.tipo||'').toLowerCase() === 'persona').length)
const nEmpresas      = computed(() => items.value.filter(c => (c.tipo||'').toLowerCase() === 'empresa').length)
const nEmpresasCirbe = computed(() => items.value.filter(c => c.cirbe).length)

const cliente          = computed(() => items.value.find(c => c.id === props.viewId) || null)
const prestamosCliente = computed(() => prestamos.value.filter(p => p.cliente_id === props.viewId))
const titularesCliente = computed(() => titulares.value.filter(t => t.cliente_id === props.viewId))
// CIRBE en detalle: true si algún préstamo del cliente tiene cirbe=true
const clienteCIRBE     = computed(() => prestamosCliente.value.some(p => p.cirbe))

const clientesFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase()
  return clientesOrdenados.value.filter(c =>
    c.nombre.toLowerCase().includes(q) || (c.cif || '').toLowerCase().includes(q)
  )
})

// ── Eliminar cliente ──────────────────────────────────────────────────────────
async function eliminarClienteLista(id) {
  if (prestamos.value.some(p => p.cliente_id === id))
    return alert('No se puede eliminar: tiene préstamos asociados.')
  if (!confirm('¿Eliminar este cliente? Se eliminarán también sus titulares vinculados.')) return
  await supabase.from('titulares').delete().eq('cliente_id', id)
  await eliminar(id, { confirmar: false })
}

async function eliminarCliente(id) {
  if (prestamos.value.some(p => p.cliente_id === id))
    return alert('No se puede eliminar: tiene préstamos asociados.')
  if (!confirm('¿Eliminar este cliente? Se eliminarán también sus titulares vinculados.')) return
  // Borrar titulares en cascada
  await supabase.from('titulares').delete().eq('cliente_id', id)
  const ok = await eliminar(id, { confirmar: false })
  if (ok) emit('navigate', 'clientes')
}

// ── Titulares ─────────────────────────────────────────────────────────────────
const modalTitular = ref(false)
const formTitular  = ref({ id: null, nombre: '', cif: '', tipo: 'Titular' })

function abrirModalTitular() {
  formTitular.value = { id: null, nombre: '', cif: '', tipo: 'Titular' }
  modalTitular.value = true
}

function editarTitular(t) {
  formTitular.value = { ...t }
  modalTitular.value = true
}

async function guardarTitular() {
  if (!formTitular.value.nombre.trim()) return alert('El nombre es obligatorio')
  if (!props.viewId) return alert('Error: no hay cliente seleccionado')
  const data = {
    cliente_id: props.viewId,
    nombre:     formTitular.value.nombre.trim(),
    cif:        (formTitular.value.cif || '').trim() || null,
    tipo:       formTitular.value.tipo,
  }
  let error
  if (formTitular.value.id) {
    const res = await supabase.from('titulares').update(data).eq('id', formTitular.value.id)
    error = res.error
  } else {
    // ID formato T001, T002... la columna debe ser TEXT en Supabase
    const { data: existing } = await supabase.from('titulares').select('id')
    const nums = (existing || []).map(x => parseInt((x.id || '').replace(/\D/g, '')) || 0)
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    const nuevoId = 'T' + String(next).padStart(6, '0')
    const res = await supabase.from('titulares').insert({ id: nuevoId, ...data })
    error = res.error
    if (error && error.code === '22P02') {
      // La columna aún es UUID — ejecutar fix_titulares_id.sql en Supabase primero
      return alert('La columna id de la tabla titulares es UUID. Ejecuta fix_titulares_id.sql en Supabase SQL Editor para cambiarla a TEXT.')
    }
  }
  if (error) return alert(traducirErrorSupabase(error))
  modalTitular.value = false
  await cargarTitulares()
}

async function eliminarTitular(id) {
  if (!confirm('¿Eliminar este titular / garante?')) return
  await supabase.from('titulares').delete().eq('id', id)
  await cargarTitulares()
}
</script>
