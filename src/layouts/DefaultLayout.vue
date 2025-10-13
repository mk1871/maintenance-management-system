<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  UserIcon,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const handleLogout = async (): Promise<void> => {
  await supabase.auth.signOut()
  authStore.clearAuth()
  router.replace({ name: 'Login' })
}

const formatRole = (role: string | null): string => {
  if (!role) return 'Usuario'
  const map: Record<string, string> = {
    supervisor: 'Supervisor',
    chief: 'Jefe',
  }
  return map[role] || role
}

const getRoleBadgeVariant = (
  role: string | null,
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  if (!role) return 'secondary'
  const map: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    supervisor: 'default',
    chief: 'destructive',
  }
  return map[role] || 'secondary'
}

const navigationItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/accommodations', icon: Building2Icon, label: 'Alojamientos' },
  { to: '/tasks', icon: ListIcon, label: 'Tareas' },
  { to: '/costs', icon: CreditCardIcon, label: 'Costos' },
]

const closeMobileMenu = (): void => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div v-if="authStore.isLoading" class="h-screen flex items-center justify-center">
    <Spinner class="h-12 w-12" />
  </div>

  <SidebarProvider v-else>
    <div v-if="authStore.isAuthenticated" class="flex h-screen w-full">
      <Sidebar class="hidden md:flex" collapsible="icon">
        <SidebarHeader class="border-b">
          <div class="flex items-center justify-between p-4">
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold truncate">Sistema de Gestión</h1>
              <p class="text-xs text-muted-foreground mt-1">Mantenimiento</p>
            </div>
            <ThemeToggle />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in navigationItems" :key="item.to">
                  <SidebarMenuButton :is-active="$route.path === item.to" as-child>
                    <router-link :to="item.to">
                      <component :is="item.icon" />
                      <span>{{ item.label }}</span>
                    </router-link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter class="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <SidebarMenuButton class="w-full">
                    <Avatar class="h-8 w-8">
                      <AvatarImage
                        v-if="authStore.userProfile?.profile_picture_url"
                        :alt="authStore.fullName || 'Usuario'"
                        :src="authStore.userProfile.profile_picture_url"
                      />
                      <AvatarFallback>
                        {{ authStore.fullName.charAt(0).toUpperCase() || 'U' }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="flex flex-col items-start flex-1 min-w-0">
                      <span class="text-sm font-medium truncate">
                        {{ authStore.fullName || 'Usuario' }}
                      </span>
                      <Badge
                        :variant="getRoleBadgeVariant(authStore.role)"
                        class="text-xs h-4 px-1"
                      >
                        {{ formatRole(authStore.role) }}
                      </Badge>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="handleLogout">
                    <LogOutIcon class="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <!-- ========================================
           HEADER MÓVIL + SHEET
           ======================================== -->
      <div class="flex flex-col flex-1">
        <header
          v-if="authStore.isAuthenticated"
          class="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div class="flex h-14 items-center justify-between px-4">
            <div class="flex items-center gap-2">
              <SidebarTrigger class="md:hidden" />
              <h1 class="text-lg font-bold">Sistema de Gestión</h1>
            </div>
            <div class="flex items-center gap-2">
              <ThemeToggle />
              <Sheet v-model:open="isMobileMenuOpen">
                <SheetTrigger as-child>
                  <Button aria-label="Abrir menú" size="icon" variant="outline">
                    <MenuIcon class="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent class="w-64 p-0" side="left">
                  <div class="flex flex-col h-full">
                    <div class="p-4 border-b">
                      <h2 class="text-lg font-semibold">Navegación</h2>
                    </div>

                    <nav class="flex-1 overflow-y-auto p-4">
                      <SidebarMenu>
                        <SidebarMenuItem v-for="item in navigationItems" :key="item.to">
                          <SidebarMenuButton
                            :is-active="$route.path === item.to"
                            as-child
                            @click="closeMobileMenu"
                          >
                            <router-link :to="item.to">
                              <component :is="item.icon" />
                              <span>{{ item.label }}</span>
                            </router-link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
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
                            {{ authStore.fullName.charAt(0).toUpperCase() || 'U' }}
                          </AvatarFallback>
                        </Avatar>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">
                            {{ authStore.fullName || 'Usuario' }}
                          </p>
                          <Badge
                            :variant="getRoleBadgeVariant(authStore.role)"
                            class="mt-1 text-xs"
                          >
                            {{ formatRole(authStore.role) }}
                          </Badge>
                        </div>
                      </div>
                      <Button class="w-full" variant="destructive" @click="handleLogout">
                        <LogOutIcon class="h-4 w-4 mr-2" />
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <!-- ========================================
             CONTENIDO PRINCIPAL
             ======================================== -->
        <main class="flex-1 overflow-auto p-6">
          <slot />
        </main>
      </div>
    </div>

    <!-- Vista sin autenticación -->
    <div v-else class="flex h-screen">
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </SidebarProvider>
</template>
