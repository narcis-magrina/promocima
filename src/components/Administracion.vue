<template>
  <div>
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: seccion === 'usuarios' }" @click="seccion = 'usuarios'">👥 Gestión de Usuarios</div>
      <div class="tab" :class="{ active: seccion === 'empresas' }" @click="seccion = 'empresas'">🏢 Empresas</div>
      <div class="tab" :class="{ active: seccion === 'config' }" @click="seccion = 'config'">⚙️ Configuración</div>
      <div class="tab" :class="{ active: seccion === 'backup' }" @click="seccion = 'backup'">💾 Backup</div>
      <div class="tab" :class="{ active: seccion === 'generar_cobros' }" @click="seccion = 'generar_cobros'">📋 Cobros Cancelados</div>
    </div>

    <GestionUsuarios v-if="seccion === 'usuarios'" />
    <GestionEmpresas v-if="seccion === 'empresas'" />
    <Configuracion v-if="seccion === 'config'" />
    <BackupDatos v-if="seccion === 'backup'" />
    <AdminGenerarCobrosCancelados v-if="seccion === 'generar_cobros'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import AdminGenerarCobrosCancelados from './AdminGenerarCobrosCancelados.vue'
import GestionUsuarios from './GestionUsuarios.vue'
import GestionEmpresas from './GestionEmpresas.vue'
import Configuracion from './Configuracion.vue'
import BackupDatos from './BackupDatos.vue'

const props = defineProps({ seccionInicial: { type: String, default: 'usuarios' } })

const seccion = ref(props.seccionInicial)
watch(() => props.seccionInicial, v => { seccion.value = v })
</script>
