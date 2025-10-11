// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, hideForAuth: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false, hideForAuth: true },
    },
    {
      path: '/accommodations',
      name: 'Accommodations',
      component: () => import('@/views/AccommodationsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/accommodations/:id',
      name: 'AccommodationDetail',
      component: () => import('@/views/AccommodationDetailView.vue'),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks/:id',
      name: 'TaskDetail',
      component: () => import('@/views/TaskDetailView.vue'),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      path: '/costs',
      name: 'Costs',
      component: () => import('@/views/CostsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { requiresAuth: false },
    },
  ],
  // Scroll behavior para mejor UX en móviles
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

/**
 * Navigation guard optimizado para móviles
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si la ruta no requiere autenticación
  if (!to.meta.requiresAuth) {
    // Redirigir a Home si está autenticado y va a login/register
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      return next({ name: 'Home', replace: true })
    }
    return next()
  }

  // MEJORA MÓVILES: Timeout más agresivo (2 segundos en lugar de 3)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const maxWaitTime = isMobile ? 20 : 30 // 2s móvil, 3s desktop

  // Esperar a que termine de cargar auth
  if (authStore.isLoading) {
    let attempts = 0
    while (authStore.isLoading && attempts < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    // MEJORA MÓVILES: Forzar loading=false si se pasó el tiempo
    if (authStore.isLoading) {
      console.warn('Router: Forcing loading=false after timeout')
      authStore.isLoading = false
    }
  }

  // Si no hay usuario después de esperar, verificar auth
  if (!authStore.supabaseUser) {
    try {
      await authStore.checkAuth()
    } catch (error: unknown) {
      console.error('Router: Auth check failed', error)
      // Continuar con la lógica normal en caso de error
    }
  }

  // Decisión final basada en estado de autenticación
  if (authStore.isAuthenticated) {
    next()
  } else {
    next({
      name: 'Login',
      replace: true,
      query: { redirect: to.fullPath },
    })
  }
})

// MEJORA MÓVILES: Listener de errores de navegación
router.onError((error) => {
  console.error('Router error:', error)

  // Si es error de chunk loading (común en móviles con red lenta)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.log('Reloading page due to chunk loading error')
    window.location.reload()
  }
})

export default router
