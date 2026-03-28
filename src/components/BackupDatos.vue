<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Copia de Seguridad</div>
        <div class="section-sub">Entorno actual:
          <span :style="esPruebas ? 'color:var(--orange);font-weight:600' : 'color:var(--green);font-weight:600'">
            {{ entorno }}
          </span>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="table-card">
      <div class="modal-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
          <button class="btn btn-primary" :disabled="operando" @click="iniciarOperacion('backup')">
            ⬇ Descargar backup CSV
          </button>
          <template v-if="esPruebas">
            <button class="btn btn-registrar" :disabled="operando" @click="confirmarRestaurar">
              📂 Restaurar desde ZIP
            </button>
            <input ref="inputZip" type="file" accept=".zip" style="display:none" @change="onFileSelected">
          </template>
        </div>

        <!-- Zona drag & drop restaurar -->
        <div v-if="esPruebas && mostrarDropzone"
          style="margin-bottom:20px"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop">
          <div :style="`
            border: 2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'};
            border-radius: 10px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            background: ${dragOver ? 'var(--bg2)' : 'transparent'};
            transition: all 0.2s;
          `" @click="inputZip.click()">
            <div style="font-size:32px;margin-bottom:8px">📦</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:4px">
              {{ archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra el ZIP aquí o haz clic para seleccionarlo' }}
            </div>
            <div v-if="!archivoSeleccionado" style="font-size:12px;color:var(--text3)">
              Fichero backup_promocima_YYYY-MM-DD.zip
            </div>
          </div>

          <!-- Confirmación restaurar -->
          <div v-if="archivoSeleccionado" style="margin-top:16px;padding:16px;border-radius:8px;background:var(--bg2);border:1px solid var(--orange)">
            <p style="font-size:13px;font-weight:600;color:var(--orange);margin-bottom:8px">⚠ Atención</p>
            <p style="font-size:13px;color:var(--text2);margin-bottom:16px">
              Se borrarán <strong>todos los datos actuales</strong> de PRUEBAS y se importarán los del fichero <strong>{{ archivoSeleccionado.name }}</strong>.
            </p>
            <div style="display:flex;gap:8px">
              <button class="btn btn-danger" :disabled="operando" @click="iniciarOperacion('restaurar')">
                Sí, restaurar
              </button>
              <button class="btn" @click="cancelarRestaurar">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Lista de progreso tablas -->
        <div v-if="operacion" style="font-family:monospace;font-size:13px;display:flex;flex-direction:column;gap:4px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-family:inherit">
            <span v-if="operacion === 'backup'">Exportando datos de <strong>{{ entorno }}</strong>...</span>
            <span v-else-if="operacion === 'restaurar' && fase === 'leyendo'">Leyendo fichero ZIP...</span>
            <span v-else-if="operacion === 'restaurar' && fase === 'borrando'">Borrando datos actuales...</span>
            <span v-else-if="operacion === 'restaurar' && fase === 'escribiendo'">Importando datos...</span>
          </div>

          <div v-for="t in estadoTablas" :key="t.nombre"
            style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:6px"
            :style="t.estado !== 'pendiente' ? 'background:var(--bg2)' : 'color:var(--text3)'">
            <span style="width:16px;text-align:center">
              <span v-if="t.estado === 'pendiente'" style="color:var(--text3)">○</span>
              <span v-else-if="t.estado === 'cargando'">⏳</span>
              <span v-else-if="t.estado === 'ok'" style="color:var(--green)">✓</span>
              <span v-else-if="t.estado === 'error'" style="color:var(--red)">✗</span>
            </span>
            <span style="width:260px">{{ t.nombre }}</span>
            <span v-if="t.estado === 'cargando'" style="color:var(--accent)">
              {{ t.accion }}... ({{ t.filasParciales.toLocaleString('es-ES') }} filas)
            </span>
            <span v-else-if="t.estado === 'ok'" style="color:var(--green);font-weight:600">
              {{ t.filas.toLocaleString('es-ES') }} registros
            </span>
            <span v-else-if="t.estado === 'error'" style="color:var(--red)">
              {{ t.errorMsg }}
            </span>
          </div>
        </div>

        <!-- Total -->
        <div v-if="totalFilas !== null" style="margin-top:16px;padding:10px 14px;background:var(--bg2);border-radius:6px;font-size:13px;font-weight:600">
          Total: {{ totalFilas.toLocaleString('es-ES') }} registros en {{ TODAS_TABLAS.length }} tablas
        </div>

        <div v-if="errorOp" class="alert alert-danger" style="margin-top:16px">{{ errorOp }}</div>
        <div v-if="exitoso" class="alert alert-success" style="margin-top:12px">
          ✓ {{ mensajeExito }} — {{ fechaUltimoBackup }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase.js'
import { useAuth } from '../composables/useAuth.js'

const { empresaId } = useAuth()

// ── Entorno ───────────────────────────────────────────────────
const entorno = import.meta.env.VITE_ENTORNO || 'PRODUCCIÓN'
const esPruebas = import.meta.env.VITE_ENTORNO === 'PRUEBAS'

// ── Estado ────────────────────────────────────────────────────
const operando = ref(false)
const operacion = ref(null)
const fase = ref(null)
const errorOp = ref(null)
const exitoso = ref(false)
const mensajeExito = ref('')
const fechaUltimoBackup = ref(null)
const mostrarDropzone = ref(false)
const dragOver = ref(false)
const archivoSeleccionado = ref(null)
const inputZip = ref(null)

// ── Tablas ────────────────────────────────────────────────────
const TABLAS_CON_EMPRESA = [
  'empresas',
  'clientes',
  'intermediarios',
  'participes',
  'prestamos',
  'cobros',
  'titulares',
  'contratos_ccp',
  'pagos_reales_participe',
  'config',
]

const TABLAS_SIN_EMPRESA = [
  'email_templates',
  'BdE_Sectores',
  'BdE_Tipos_id',
  'BdE_Titulares',
  'BdE_Titulares_Enviados',
  'BdE_Operaciones',
  'BdE_Operaciones_Enviadas',
  'BdE_Operaciones_Titulares',
]

const TODAS_TABLAS = [...TABLAS_CON_EMPRESA, ...TABLAS_SIN_EMPRESA]

const PK_TABLA = {
  'BdE_Operaciones': 'id',
  'BdE_Operaciones_Titulares': 'operacion_id',
  'BdE_Operaciones_Enviadas': 'codigo_expediente',
  'BdE_Sectores': 'codigo',
  'BdE_Tipos_id': 'id',
  'BdE_Titulares': 'id',
  'BdE_Titulares_Enviados': 'identificacion',
}

const estadoTablas = ref(TODAS_TABLAS.map(nombre => ({
  nombre, estado: 'pendiente', filas: null, filasParciales: 0, errorMsg: '', accion: '',
})))

const totalFilas = computed(() => {
  if (!estadoTablas.value.every(t => t.estado === 'ok')) return null
  return estadoTablas.value.reduce((sum, t) => sum + (t.filas || 0), 0)
})

onMounted(() => {
  const ultimo = localStorage.getItem('ultimo_backup_' + empresaId.value)
  if (ultimo) fechaUltimoBackup.value = ultimo
})

function resetEstado() {
  estadoTablas.value.forEach(t => {
    t.estado = 'pendiente'; t.filas = null; t.filasParciales = 0; t.errorMsg = ''; t.accion = ''
  })
}

// ── Drag & drop ───────────────────────────────────────────────
function confirmarRestaurar() {
  mostrarDropzone.value = true
  archivoSeleccionado.value = null
  exitoso.value = false
  errorOp.value = null
  operacion.value = null
}

function cancelarRestaurar() {
  mostrarDropzone.value = false
  archivoSeleccionado.value = null
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.name.endsWith('.zip')) {
    archivoSeleccionado.value = file
  } else {
    errorOp.value = 'El fichero debe ser un ZIP de backup de Promocima'
  }
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (file) archivoSeleccionado.value = file
}

// ── Fetch con paginación ──────────────────────────────────────
async function fetchTablaCompleta(client, tabla, filtrarEmpresa, onPagina) {
  const PAGE = 1000
  let offset = 0
  let todos = []
  const conEmpresa = filtrarEmpresa && TABLAS_CON_EMPRESA.includes(tabla) && tabla !== 'empresas'

  while (true) {
    let query = client.from(tabla).select('*').range(offset, offset + PAGE - 1)
    if (conEmpresa) query = query.eq('empresa_id', empresaId.value)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    todos = todos.concat(data)
    onPagina(todos.length)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return todos
}

// ── CSV ───────────────────────────────────────────────────────
function objectsToCSV(rows) {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = v => {
    if (v === null || v === undefined) return ''
    const s = Array.isArray(v) ? JSON.stringify(v) : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [headers.join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n')
}

function csvToObjects(csv) {
  if (!csv.trim()) return []
  const { data } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    transform: v => v === '' ? null : v,
  })
  return data
}
// ── Borrar todas las tablas ───────────────────────────────────
async function borrarTodasLasTablas() {
  const EXCLUIR_BORRADO = ['empresas', 'perfiles']
  const tablasOrdenBorrado = [...TODAS_TABLAS].reverse().filter(t => !EXCLUIR_BORRADO.includes(t))
  for (const tabla of tablasOrdenBorrado) {
    const col = PK_TABLA[tabla] || 'id'
    const { error } = await supabase.from(tabla).delete().not(col, 'is', null)
    if (error) throw new Error(`Error borrando ${tabla}: ${error.message}`)
  }
}

// ── Insertar datos ────────────────────────────────────────────
async function insertarDatos(tabla, rows) {
  if (!rows || rows.length === 0) return
  const CHUNK = 500
  const entrada = estadoTablas.value.find(t => t.nombre === tabla)
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase.from(tabla).insert(chunk)
    if (error) throw new Error(error.message)
    entrada.filasParciales = Math.min(i + CHUNK, rows.length)
  }
}

// ── Iniciar operación ─────────────────────────────────────────
async function iniciarOperacion(tipo) {
  operando.value = true
  operacion.value = tipo
  errorOp.value = null
  exitoso.value = false
  resetEstado()

  try {
    if (tipo === 'backup') {
      await ejecutarBackup()
    } else if (tipo === 'restaurar') {
      await ejecutarRestaurar()
    }
  } catch (e) {
    errorOp.value = e.message
  } finally {
    operando.value = false
  }
}

// ── Backup CSV ────────────────────────────────────────────────
async function ejecutarBackup() {
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')
  const zip = new JSZip()

  for (let i = 0; i < TODAS_TABLAS.length; i++) {
    const tabla = TODAS_TABLAS[i]
    const entrada = estadoTablas.value.find(t => t.nombre === tabla)
    entrada.estado = 'cargando'
    entrada.accion = 'exportando'
    try {
      const rows = await fetchTablaCompleta(supabase, tabla, true, p => { entrada.filasParciales = p })
      zip.file(`${String(i + 1).padStart(2, '0')}_${tabla}.csv`, objectsToCSV(rows))
      entrada.filas = rows.length
      entrada.estado = 'ok'
    } catch (e) {
      entrada.estado = 'error'
      entrada.errorMsg = e.message
      throw new Error(`Error exportando ${tabla}: ${e.message}`)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup_promocima_${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(url)

  const ahora = new Date().toLocaleString('es-ES')
  localStorage.setItem('ultimo_backup_' + empresaId.value, ahora)
  fechaUltimoBackup.value = ahora
  mensajeExito.value = 'Backup descargado correctamente'
  exitoso.value = true
}

// ── Restaurar desde ZIP ───────────────────────────────────────
async function ejecutarRestaurar() {
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')
  const Papa = await new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'
    s.onload = () => resolve(window.Papa)
    document.head.appendChild(s)
  })

  // Leer ZIP
  fase.value = 'leyendo'
  const zip = await JSZip.loadAsync(archivoSeleccionado.value)
  const datosZip = {}

  const EXCLUIR_IMPORT = ['empresas', 'perfiles']
  for (const tabla of TODAS_TABLAS.filter(t => !EXCLUIR_IMPORT.includes(t))) {
    const entrada = estadoTablas.value.find(t => t.nombre === tabla)
    entrada.estado = 'cargando'
    entrada.accion = 'leyendo'
    // Buscar el fichero CSV en el ZIP por nombre de tabla
    const fichero = Object.values(zip.files).find(f => f.name.includes(`_${tabla}.csv`) || f.name === `${tabla}.csv`)
    if (fichero) {
      const csv = await fichero.async('string')
      datosZip[tabla] = csvToObjects(csv)
    } else {
      datosZip[tabla] = []
    }
    entrada.filas = datosZip[tabla].length
    entrada.estado = 'ok'
  }

  // Borrar datos actuales
  fase.value = 'borrando'
  resetEstado()
  await borrarTodasLasTablas()

  // Insertar datos del ZIP
  fase.value = 'escribiendo'
  for (const tabla of TODAS_TABLAS.filter(t => !EXCLUIR_IMPORT.includes(t))) {
    const entrada = estadoTablas.value.find(t => t.nombre === tabla)
    entrada.estado = 'cargando'
    entrada.accion = 'importando'
    try {
      await insertarDatos(tabla, datosZip[tabla])
      entrada.filas = datosZip[tabla].length
      entrada.estado = 'ok'
    } catch (e) {
      entrada.estado = 'error'
      entrada.errorMsg = e.message
      throw new Error(`Error importando ${tabla}: ${e.message}`)
    }
  }

  const ahora = new Date().toLocaleString('es-ES')
  localStorage.setItem('ultimo_backup_' + empresaId.value, ahora)
  fechaUltimoBackup.value = ahora
  mensajeExito.value = 'Datos restaurados correctamente'
  exitoso.value = true
  mostrarDropzone.value = false
  archivoSeleccionado.value = null
  fase.value = null
}
</script>
