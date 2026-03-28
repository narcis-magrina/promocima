<template>
  <div>
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: seccion === 'analitica' }" @click="seccion = 'analitica'">📊 KPI's</div>
      <div class="tab" :class="{ active: seccion === 'evolucion' }" @click="seccion = 'evolucion'">📈 Evolución</div>
    </div>

    <Analitica  v-if="seccion === 'analitica'" />
    <Evolucion  v-if="seccion === 'evolucion'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Analitica from './Analitica.vue'
import Evolucion from './Evolucion.vue'

const props = defineProps({ seccionInicial: { type: String, default: 'analitica' } })

const seccion = ref(props.seccionInicial)
watch(() => props.seccionInicial, v => { seccion.value = v })
</script>
