<template>
  <span class="help-tip" @mouseenter="show = true" @mouseleave="show = false" @click.stop="show = !show">
    <span class="help-tip-icon">?</span>
    <span v-if="show" class="help-tip-bubble" :class="pos">{{ texto }}</span>
  </span>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  texto: { type: String, required: true },
  pos:   { type: String, default: 'bottom' },  // bottom | top | right
})
const show = ref(false)
</script>
