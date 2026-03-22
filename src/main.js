import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const app = createApp(App)

// Directiva v-focus: posiciona el cursor en el primer campo al abrir un modal
app.directive('focus', {
  mounted(el) {
    // Pequeño delay para asegurar que el modal está visible
    setTimeout(() => el.focus(), 50)
  }
})

app.mount('#app')
