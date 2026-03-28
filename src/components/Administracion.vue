<template>
  <div>
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: seccion === 'config' }" @click="seccion = 'config'">⚙️ Configuración</div>
      <div class="tab" :class="{ active: seccion === 'empresas' }" @click="seccion = 'empresas'">🏢 Empresas</div>
      <div class="tab" :class="{ active: seccion === 'usuarios' }" @click="seccion = 'usuarios'">👥 Usuarios</div>
      <div class="tab" :class="{ active: seccion === 'backup' }" @click="seccion = 'backup'">💾 Backup</div>
    </div>

    <Configuracion v-if="seccion === 'config'" />
    <GestionEmpresas v-if="seccion === 'empresas'" />
    <GestionUsuarios v-if="seccion === 'usuarios'" />
    <BackupDatos v-if="seccion === 'backup'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import GestionUsuarios from './GestionUsuarios.vue'
import GestionEmpresas from './GestionEmpresas.vue'
import Configuracion from './Configuracion.vue'
import BackupDatos from './BackupDatos.vue'

const props = defineProps({ seccionInicial: { type: String, default: 'config' } })

const seccion = ref(props.seccionInicial)
watch(() => props.seccionInicial, v => { seccion.value = v })
</script>
