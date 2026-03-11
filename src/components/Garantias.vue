<template>
  <div>
    <div class="section-header">
      <div class="section-title">Garantías Hipotecarias</div>
      <button class="btn btn-primary" @click="abrirModal()">+ Nueva Garantía</button>
    </div>
    <div class="table-card">
      <div class="table-header"><h3>Listado</h3></div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th @click="setSort('direccion')" :class="thClass('direccion')">Dirección <span class="sort-icon">{{ thIcon('direccion') }}</span></th>
              <th @click="setSort('tipo')" :class="thClass('tipo')">Tipo <span class="sort-icon">{{ thIcon('tipo') }}</span></th>
              <th @click="setSort('metros')" :class="thClass('metros')" style="text-align:right">m² <span class="sort-icon">{{ thIcon('metros') }}</span></th>
              <th @click="setSort('tasador')" :class="thClass('tasador')">Tasador <span class="sort-icon">{{ thIcon('tasador') }}</span></th>
              <th @click="setSort('valor_tasacion')" :class="thClass('valor_tasacion')" style="text-align:right">Valor Tasación <span class="sort-icon">{{ thIcon('valor_tasacion') }}</span></th>
              <th @click="setSort('valor_mercado')" :class="thClass('valor_mercado')" style="text-align:right">Valor Mercado <span class="sort-icon">{{ thIcon('valor_mercado') }}</span></th>
              <th style="text-align:center">LTV</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in garantiasSorted" :key="g.id" style="cursor:pointer" @click="verDetalle(g)">
              <td style="font-size:12px;max-width:220px">{{ g.direccion }}</td>
              <td><span class="badge badge-blue">{{ g.tipo }}</span></td>
              <td class="td-mono td-right">{{ Number(g.metros).toLocaleString('es-ES') }} m²</td>
              <td style="font-size:12px">{{ g.tasador || '—' }}</td>
              <td class="td-mono td-right">{{ fmt(g.valor_tasacion) }}</td>
              <td class="td-mono td-right">{{ fmt(g.valor_mercado) }}</td>
              <td class="td-mono td-center" :style="{ color: ltvColor(g) }"><strong>{{ ltvValor(g) }}</strong></td>
            </tr>
            <tr v-if="!items.length"><td colspan="7" class="table-empty">Sin garantías</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>{{ form.id ? (modoVer ? 'Detalle' : 'Editar') + ' Garantía' : 'Nueva Garantía' }}</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrarModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid cols-3">
            <div class="form-group">
              <label class="form-label">Tipo <span class="req">*</span></label>
              <select class="form-control" v-model="form.tipo" :disabled="modoVer">
                <option v-for="t in TIPOS" :key="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Metros Cuadrados</label>
              <input class="form-control" type="number" v-model="form.metros" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Tasador</label>
              <input class="form-control" v-model="form.tasador" :disabled="modoVer">
            </div>
            <div class="form-group span-3">
              <label class="form-label">Dirección <span class="req">*</span></label>
              <input class="form-control" v-model="form.direccion" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Tasación</label>
              <input class="form-control" type="date" v-model="form.fecha_tasacion" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Tasación (€) <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="form.valor_tasacion" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Mercado (€)</label>
              <input class="form-control" type="number" v-model="form.valor_mercado" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Suelo (€)</label>
              <input class="form-control" type="number" v-model="form.valor_suelo" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Terminado (€)</label>
              <input class="form-control" type="number" v-model="form.valor_terminado" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Adquisición</label>
              <input class="form-control" type="date" v-model="form.fecha_adquisicion" :disabled="modoVer">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Adquisición (€)</label>
              <input class="form-control" type="number" v-model="form.valor_adquisicion" :disabled="modoVer">
            </div>
            <div class="form-group span-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" v-model="form.notas" :disabled="modoVer"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="cerrarModal()">{{ modoVer ? 'Cerrar' : 'Cancelar' }}</button>
          <button v-if="modoVer" class="btn" @click="modoVer = false">✎ Editar</button>
          <button v-if="!modoVer" class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSort } from '../composables/useSort.js'
import { useCrud } from '../composables/useCrud.js'
import { fmt } from '../utils.js'

const TIPOS = ['Solar', 'Local Comercial', 'Nave Industrial', 'Edificio', 'Vivienda', 'Parking', 'Otro']

const modoVer = ref(false)

const formVacio = () => ({
  tipo: 'Solar', direccion: '', metros: '', tasador: '',
  fecha_tasacion: '', valor_tasacion: '', valor_mercado: '',
  valor_suelo: '', valor_terminado: '', fecha_adquisicion: '',
  valor_adquisicion: '', notas: ''
})

const {
  items, secundarios: prestamos,
  modalAbierto, form,
  abrirModal: _abrirModal, cerrarModal, guardar,
  inicializar,
} = useCrud(
  'garantias',
  formVacio,
  {
    ordenPor:   'id',
    prefixId:   'G',
    idStrategy: 'max_num',
    secundaria: { tabla: 'prestamos', select: 'id, importe, garantia_id', orden: 'id' },
    validar: f => (!f.direccion || !f.valor_tasacion) ? 'Dirección y valor de tasación son obligatorios' : null,
    prepararData: f => {
      const data = {}
      for (const [k, v] of Object.entries(f)) {
        if (k === 'id') continue
        data[k] = v === '' ? null : v
      }
      return data
    },
  }
)

inicializar()

const { sorted: garantiasSorted, setSort, thIcon, thClass } = useSort(items, 'id')

function abrirModal() {
  modoVer.value = false
  _abrirModal()
}

function verDetalle(g) {
  form.value = { ...g }
  modoVer.value = true
  modalAbierto.value = true
}

function ltvValor(g) {
  const p = prestamos.value.find(x => x.garantia_id === g.id)
  if (!p) return '—'
  return (Number(p.importe) / Number(g.valor_tasacion) * 100).toFixed(1) + '%'
}

function ltvColor(g) {
  const v = parseFloat(ltvValor(g))
  return v <= 40 ? 'var(--green)' : 'var(--orange)'
}
</script>
