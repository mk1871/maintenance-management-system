<template>
  <div v-if="isAuthenticated" class="flex h-screen">
    <!-- Sidebar -->
    <div class="w-64 bg-background border-r flex flex-col">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-foreground">Sistema de Gestión de Mantenimiento</h1>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <RouterLink 
              to="/" 
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              active-class="bg-muted font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </RouterLink>
          </li>
          <li>
            <RouterLink 
              to="/accommodations" 
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              active-class="bg-muted font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Accommodations
            </RouterLink>
          </li>
          <li>
            <RouterLink 
              to="/tasks" 
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              active-class="bg-muted font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tareas
            </RouterLink>
          </li>
          <li>
            <RouterLink 
              to="/costs" 
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              active-class="bg-muted font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Costos
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t">
        <div class="flex items-center">
          <div class="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
            <span class="font-medium text-foreground">U</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-foreground">{{ authStore.fullName }}</p>
            <p class="text-xs text-muted-foreground capitalize">{{ authStore.role }}</p>
          </div>
          <Button variant="ghost" size="sm" class="ml-auto" @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-auto p-6">
      <RouterView />
    </div>
  </div>
  <div v-else class="h-screen flex items-center justify-center">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

// Verificar autenticación al cargar la aplicación
onMounted(async () => {
  await authStore.checkAuth()
})

const handleLogout = async () => {
  await authStore.clearAuth()
  router.push('/login')
}

// Computed property para saber si está autenticado
const isAuthenticated = authStore.isAuthenticated
</script>