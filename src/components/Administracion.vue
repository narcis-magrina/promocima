<template>
  <div>
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: seccion === 'generar_cobros' }" @click="seccion = 'generar_cobros'">📋 Cobros Cancelados</div>
      <div class="tab" :class="{ active: seccion === 'usuarios' }" @click="seccion = 'usuarios'">👥 Gestión de Usuarios</div>
      <div class="tab" :class="{ active: seccion === 'empresas' }" @click="seccion = 'empresas'">🏢 Empresas</div>
      <div class="tab" :class="{ active: seccion === 'config' }" @click="seccion = 'config'">⚙️ Configuración</div>
    </div>

    <AdminGenerarCobrosCancelados v-if="seccion === 'generar_cobros'" />
    <GestionUsuarios v-if="seccion === 'usuarios'" />
    <GestionEmpresas v-if="seccion === 'empresas'" />
    <Configuracion v-if="seccion === 'config'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import AdminGenerarCobrosCancelados from './AdminGenerarCobrosCancelados.vue'
import GestionUsuarios from './GestionUsuarios.vue'
import GestionEmpresas from './GestionEmpresas.vue'
import Configuracion from './Configuracion.vue'

const props = defineProps({ seccionInicial: { type: String, default: 'generar_cobros' } })

const seccion = ref(props.seccionInicial)
watch(() => props.seccionInicial, v => { seccion.value = v })
</script>
