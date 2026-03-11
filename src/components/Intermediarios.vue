<template>
  <div>
    <template v-if="viewId">
      <div class="back-btn" @click="$emit('navigate', 'intermediarios')">← Volver a Intermediarios</div>
      <div v-if="!intermediario">Cargando...</div>
      <template v-else>
        <div class="section-header">
          <div class="section-title">{{ intermediario.nombre }}</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-registrar" @click="editar(intermediario)">✎ Editar</button>
            <button class="btn btn-sm btn-danger" @click="eliminarIntermediario(intermediario.id)">✕ Eliminar</button>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">Empresa</div><div class="detail-value">{{ intermediario.empresa || '—' }}</div></div>
          <div class="detail-item"><div class="detail-label">Teléfono</div><div class="detail-value">{{ intermediario.telefono || '—' }}</div></div>
          <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">{{ intermediario.email || '—' }}</div></div>
        </div>
        <div class="table-card">
          <div class="table-header"><h3>Préstamos Intermediados</h3></div>
          <table>
            <thead><tr><th>ID</th><th>Alias</th><th>Cliente</th><th style="text-align:right">Importe</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-for="p in prestamosInter" :key="p.id">
                <td class="td-mono" style="color:var(--text3)">{{ p.id }}</td>
                <td>{{ p.alias }}</td>
                <td style="font-size:12px">{{ p.clientes?.nombre || '—' }}</td>
                <td class="td-mono td-right">{{ fmt(p.importe) }}</td>
                <td v-html="getEstadoBadge(p.estado)" />
              </tr>
              <tr v-if="!prestamosInter.length"><td colspan="5" class="table-empty">Sin préstamos</td></tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <template v-else>
      <div class="section-header">
        <div class="section-title">Intermediarios</div>
        <button class="btn btn-primary" @click="abrirModal()">+ Nuevo Intermediario</button>
      </div>
      <div class="table-card">
        <div class="table-header"><h3>Listado</h3></div>
        <table>
          <thead><tr>
              <th @click="setSort('nombre')" :class="thClass('nombre')">Nombre <span class="sort-icon">{{ thIcon('nombre') }}</span></th>
              <th @click="setSort('empresa')" :class="thClass('empresa')">Empresa <span class="sort-icon">{{ thIcon('empresa') }}</span></th>
              <th>Teléfono</th><th>Email</th>
              <th @click="setSort('nPrestamos')" :class="thClass('nPrestamos')" style="text-align:center">Préstamos <span class="sort-icon">{{ thIcon('nPrestamos') }}</span></th>
              <th></th>
            </tr></thead>
          <tbody>
            <tr v-for="i in interOrdenados" :key="i.id" style="cursor:pointer" @click="$emit('navigate','intermediarios',i.id)">
              <td style="font-weight:500">{{ i.nombre }}</td>
              <td>{{ i.empresa || '—' }}</td>
              <td style="font-size:12px">{{ i.telefono || '—' }}</td>
              <td style="font-size:12px">{{ i.email || '—' }}</td>
              <td class="td-center"><span class="badge badge-gray">{{ i.nPrestamos || 0 }}</span></td>
              <td @click.stop style="display:flex;gap:4px">
                <button class="btn btn-sm btn-ghost" @click.stop="editar(i)">✎</button>
                <button
                  class="btn btn-sm btn-danger-solid"
                  :disabled="prestamos.some(p => p.intermediario_id === i.id)"
                  :title="prestamos.some(p => p.intermediario_id === i.id) ? 'No se puede eliminar: tiene préstamos' : 'Eliminar intermediario'"
                  @click.stop="eliminarInterLista(i.id)"
                >✕</button>
              </td>
            </tr>
            <tr v-if="!items.length"><td colspan="6" class="table-empty">Sin intermediarios</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ form.id ? 'Editar' : 'Nuevo' }} Intermediario</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrarModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Nombre <span class="req">*</span></label><input class="form-control" v-model="form.nombre"></div>
            <div class="form-group"><label class="form-label">Empresa</label><input class="form-control" v-model="form.empresa"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" v-model="form.telefono"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-control" v-model="form.email"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useSort } from '../composables/useSort.js'
import { useCrud } from '../composables/useCrud.js'
import { fmt, getEstadoBadge } from '../utils.js'

const props = defineProps({ viewId: String })
const emit = defineEmits(['navigate'])

const {
  items, secundarios: prestamos,
  modalAbierto, form,
  abrirModal, editar, cerrarModal, guardar, eliminar,
  inicializar,
} = useCrud(
  'intermediarios',
  () => ({ id: null, nombre: '', empresa: '', telefono: '', email: '' }),
  {
    ordenPor:   'nombre',
    prefixId:   'I',
    secundaria: { tabla: 'prestamos', select: 'id, alias, importe, estado, intermediario_id, clientes(nombre)', orden: 'id' },
    enriquecerItems: (ints, prest) =>
      ints.map(x => ({ ...x, nPrestamos: prest.filter(p => p.intermediario_id === x.id).length })),
    validar: f => !f.nombre.trim() ? 'El nombre es obligatorio' : null,
    prepararData: f => ({
      nombre:   f.nombre.trim(),
      empresa:  (f.empresa  || '').trim(),
      telefono: (f.telefono || '').trim(),
      email:    (f.email    || '').trim(),
    }),
  }
)

inicializar(toRef(props, 'viewId'))

const { sorted: interOrdenados, setSort, thIcon, thClass } = useSort(items, 'nombre')
const intermediario = computed(() => items.value.find(i => i.id === props.viewId) || null)
const prestamosInter = computed(() => prestamos.value.filter(p => p.intermediario_id === props.viewId))
async function eliminarInterLista(id) {
  if (prestamos.value.some(p => p.intermediario_id === id))
    return alert('No se puede eliminar: tiene préstamos vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este intermediario?' })
  if (ok && props.viewId === id) emit('navigate', 'intermediarios')
}

async function eliminarIntermediario(id) {
  if (prestamos.value.some(p => p.intermediario_id === id))
    return alert('No se puede eliminar: tiene préstamos vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este intermediario?' })
  if (ok) emit('navigate', 'intermediarios')
}
</script>
