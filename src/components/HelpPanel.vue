<template>
  <!-- Botón de apertura -->
  <button class="help-panel-btn" @click="open = true" title="Ayuda — Glosario de términos">
    <span>?</span>
  </button>

  <!-- Overlay -->
  <teleport to="body">
    <div v-if="open" class="help-panel-overlay" @click.self="open = false">
      <div class="help-panel">
        <div class="help-panel-header">
          <div>
            <div class="help-panel-title">Glosario de términos</div>
            <div class="help-panel-sub">Definiciones de los conceptos usados en la aplicación</div>
          </div>
          <button class="help-panel-close" @click="open = false">✕</button>
        </div>
        <div class="help-panel-body">
          <div v-for="item in glosario" :key="item.termino" class="help-panel-item">
            <div class="help-panel-term">{{ item.termino }}</div>
            <div class="help-panel-def">{{ item.definicion }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'
import { glosario } from '../helpTexts.js'
const open = ref(false)
</script>
