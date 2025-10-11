<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import ThemeToggle from '@/components/ThemeToggle.vue'
import {
  HomeIcon,
  Building2Icon,
  ListIcon,
  CreditCardIcon,
  LogOutIcon,
  MenuIcon,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const handleLogout = async () => {
  await supabase.auth.signOut()
  await authStore.clearAuth()
  router.replace({ name: 'Login' })
  window.history.replaceState({}, '', '/login')
}

const formatRole = (role: string | null): string => {
  if (!role) return 'Usuario'
  const roleMap: Record<string, string> = {
    supervisor: 'Supervisor',
    chief: 'Jefe',
  }
  return roleMap[role] || role
}

const getRoleBadgeVariant = (
  role: string | null,
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  if (!role) return 'secondary'
  const variantMap: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    supervisor: 'default',
    chief: 'destructive',
  }
  return variantMap[role] || 'secondary'
}

const navigationItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/accommodations', icon: Building2Icon, label: 'Alojamientos' },
  { to: '/tasks', icon: ListIcon, label: 'Tareas' },
  { to: '/costs', icon: CreditCardIcon, label: 'Costos' },
]

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div v-if="authStore.isLoading" class="h-screen flex items-center justify-center">
    <Spinner class="h-12 w-12" />
  </div>

  <div v-else class="flex h-screen">
    <!-- Desktop Sidebar -->
    <aside
      v-if="authStore.isAuthenticated"
      class="hidden md:flex w-64 bg-background border-r flex-col"
    >
      <div class="p-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-foreground">Sistema de Gestión</h1>
          <p class="text-xs text-muted-foreground mt-1">Mantenimiento</p>
        </div>
        <ThemeToggle />
      </div>

      <Separator />

      <nav class="flex-1 p-4 overflow-y-auto">
        <ul class="space-y-2">
          <li v-for="item in navigationItems" :key="item.to">
            <RouterLink
              :to="item.to"
              active-class="bg-primary text-primary-foreground hover:bg-primary/90"
              class="flex items-center gap-3 p-3 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <Separator />

      <div class="p-4">
        <div class="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              v-if="authStore.userProfile?.profile_picture_url"
              :alt="authStore.fullName || 'Usuario'"
              :src="authStore.userProfile.profile_picture_url"
            />
            <AvatarFallback>
              {{ authStore.fullName?.charAt(0).toUpperCase() || 'U' }}
            </AvatarFallback>
          </Avatar>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ authStore.fullName || 'Usuario' }}
            </p>
            <Badge :variant="getRoleBadgeVariant(authStore.role)" class="mt-1 text-xs">
              {{ formatRole(authStore.role) }}
            </Badge>
          </div>

          <Button aria-label="Cerrar sesión" size="icon" variant="ghost" @click="handleLogout">
            <LogOutIcon class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>

    <!-- Mobile Navigation -->
    <div v-if="authStore.isAuthenticated" class="md:hidden fixed top-0 left-0 right-0 z-50">
      <div class="bg-background border-b p-4 flex items-center justify-between">
        <h1 class="text-lg font-bold text-foreground">Sistema de Gestión</h1>
        <ThemeToggle />
        <Sheet v-model:open="isMobileMenuOpen">
          <SheetTrigger as-child>
            <Button aria-label="Abrir menú" size="icon" variant="outline">
              <MenuIcon class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent class="w-64 p-0" side="left">
            <div class="flex flex-col h-full">
              <div class="p-4">
                <h2 class="text-xl font-bold text-foreground">Navegación</h2>
              </div>

              <Separator />

              <nav class="flex-1 p-4 overflow-y-auto">
                <ul class="space-y-2">
                  <li v-for="item in navigationItems" :key="item.to">
                    <RouterLink
                      :to="item.to"
                      active-class="bg-primary text-primary-foreground"
                      class="flex items-center gap-3 p-3 rounded-md hover:bg-muted text-foreground transition-colors"
                      @click="closeMobileMenu"
                    >
                      <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
                      <span>{{ item.label }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </nav>

              <Separator />

              <div class="p-4">
                <div class="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage
                      v-if="authStore.userProfile?.profile_picture_url"
                      :alt="authStore.fullName || 'Usuario'"
                      :src="authStore.userProfile.profile_picture_url"
                    />
                    <AvatarFallback>
                      {{ authStore.fullName?.charAt(0).toUpperCase() || 'U' }}
                    </AvatarFallback>
                  </Avatar>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">
                      {{ authStore.fullName || 'Usuario' }}
                    </p>
                    <Badge :variant="getRoleBadgeVariant(authStore.role)" class="mt-1 text-xs">
                      {{ formatRole(authStore.role) }}
                    </Badge>
                  </div>
                </div>

                <Button class="w-full" variant="destructive" @click="handleLogout">
                  <LogOutIcon class="h-5 w-5 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>

    <!-- Main Content -->
    <main
      :class="[
        authStore.isAuthenticated ? 'flex-1 overflow-auto p-6 md:p-6 pt-20 md:pt-6' : 'flex-1',
      ]"
    >
      <slot />
    </main>
  </div>
</template>
