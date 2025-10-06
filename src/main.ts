import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useVueSonner } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(useVueSonner)
app.use(router)

app.mount('#app')
// Inicializar auth store después del mount
const authStore = useAuthStore()
authStore.initAuth()
