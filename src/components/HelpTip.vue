<template>
  <span class="help-tip" ref="el" @mouseenter="open" @mouseleave="close" @click.stop="toggle">
    <span class="help-tip-icon">?</span>
    <teleport to="body">
      <span v-if="show" class="help-tip-bubble" :style="bubbleStyle">{{ texto }}</span>
    </teleport>
  </span>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  texto: { type: String, required: true },
  pos:   { type: String, default: 'bottom' },
})

const el    = ref(null)
const show  = ref(false)
const rect  = ref(null)

function open() {
  rect.value = el.value?.getBoundingClientRect()
  show.value = true
}
function close()  { show.value = false }
function toggle() { show.value ? close() : open() }

// Cierra el tooltip al tocar/clicar fuera (necesario en móvil donde mouseleave no aplica)
function onOutsideClick() { close() }
watch(show, val => {
  if (val) document.addEventListener('click', onOutsideClick)
  else     document.removeEventListener('click', onOutsideClick)
})
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

const bubbleStyle = computed(() => {
  if (!rect.value) return {}
  const r = rect.value
  const W = 220
  if (props.pos === 'top') {
    return { position:'fixed', zIndex:9999, width: W+'px',
             left: Math.max(8, r.left + r.width/2 - W/2) + 'px',
             bottom: (window.innerHeight - r.top + 6) + 'px' }
  }
  if (props.pos === 'right') {
    return { position:'fixed', zIndex:9999, width: W+'px',
             left: (r.right + 6) + 'px',
             top: Math.max(8, r.top + r.height/2 - 40) + 'px' }
  }
  // default: bottom
  return { position:'fixed', zIndex:9999, width: W+'px',
           left: Math.max(8, Math.min(window.innerWidth - W - 8, r.left + r.width/2 - W/2)) + 'px',
           top: (r.bottom + 6) + 'px' }
})
</script>
