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
})

/**
 * Navigation guard con manejo correcto de auth state
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // CORRECCIÓN 1: Si no requiere auth, permitir acceso directo
  if (!to.meta.requiresAuth) {
    // Si está autenticado y va a login/register, redirigir a home
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      return next({ name: 'Home', replace: true })
    }
    return next()
  }

  // CORRECCIÓN 2: Esperar a que termine de verificar auth si está cargando
  if (authStore.isLoading) {
    // Esperar máximo 3 segundos
    let attempts = 0
    while (authStore.isLoading && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
  }

  // CORRECCIÓN 3: Si no hay usuario después de cargar, verificar auth
  if (!authStore.supabaseUser) {
    await authStore.checkAuth()
  }

  // CORRECCIÓN 4: Decidir basado en estado final
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

export default router
