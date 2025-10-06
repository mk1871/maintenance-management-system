<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { HomeIcon, Building2Icon, ListIcon, CreditCardIcon, LogOutIcon } from 'lucide-vue-next'
import { supabase } from '@/services/supabase.ts'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  // 1. Cerrar sesión en Supabase
  await supabase.auth.signOut()

  // 2. Limpiar el estado de la store
  await authStore.clearAuth()

  // 3. Reemplazar la URL actual por /login (sin agregar historial)
  router.replace({ name: 'Login' })

  // 4. Reemplazar el historial para que “Atrás” no vuelva
  window.history.replaceState({}, '', '/login')
}

const formatRole = (role: string | null) => {
  if (!role) return 'Usuario'
  const roleNames: Record<string, string> = {
    supervisor: 'Supervisor',
    chief: 'Jefe',
  }
  return roleNames[role] || role
}
</script>

<template>
  <div v-if="authStore.isLoading" class="h-screen flex items-center justify-center">
    <Spinner class="h-12 w-12" />
  </div>

  <div v-else class="flex h-screen">
    <!-- Sidebar (solo si autenticado) -->
    <aside v-if="authStore.isAuthenticated" class="w-64 bg-background border-r flex flex-col">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-foreground">Sistema de Gestión</h1>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <RouterLink
              active-class="bg-muted font-medium"
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              to="/"
            >
              <HomeIcon class="h-5 w-5 mr-3" /> Dashboard
            </RouterLink>
          </li>
          <li>
            <RouterLink
              active-class="bg-muted font-medium"
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              to="/accommodations"
            >
              <Building2Icon class="h-5 w-5 mr-3" /> Alojamientos
            </RouterLink>
          </li>
          <li>
            <RouterLink
              active-class="bg-muted font-medium"
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              to="/tasks"
            >
              <ListIcon class="h-5 w-5 mr-3" /> Tareas
            </RouterLink>
          </li>
          <li>
            <RouterLink
              active-class="bg-muted font-medium"
              class="flex items-center p-2 rounded-md hover:bg-muted text-foreground"
              to="/costs"
            >
              <CreditCardIcon class="h-5 w-5 mr-3" /> Costos
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t">
        <div class="flex items-center">
          <div class="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
            <span class="font-medium text-foreground">{{
              authStore.fullName?.charAt(0).toUpperCase() || 'U'
            }}</span>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ authStore.fullName || 'Usuario' }}
            </p>
            <p class="text-xs text-muted-foreground capitalize truncate">
              {{ formatRole(authStore.role) }}
            </p>
          </div>
          <Button class="ml-2" size="sm" variant="ghost" @click="handleLogout">
            <LogOutIcon class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>

    <!-- Contenido principal -->
    <main :class="authStore.isAuthenticated ? 'flex-1 overflow-auto p-6' : 'flex-1'">
      <slot />
    </main>
  </div>
</template>
