import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useVueSonner } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const initThemeBeforeMount = (): void => {
  const THEME_STORAGE_KEY = 'theme-preference'
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.classList.add(savedTheme)
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
  }
}

initThemeBeforeMount()

const app = createApp(App)

app.use(createPinia())
app.use(useVueSonner)
app.use(router)

app.mount('#app')

const authStore = useAuthStore()
authStore.initAuth()

const themeStore = useThemeStore()
themeStore.initTheme()

const cleanupSystemListener = themeStore.listenToSystemChanges()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupSystemListener()
  })
}
