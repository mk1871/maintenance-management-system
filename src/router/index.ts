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

// Navigation guard refactorizado para nueva API
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si la ruta no requiere auth, siempre permitir
  if (!to.meta.requiresAuth) {
    return next()
  }

  // Verificar auth sólo una vez si no hay usuario
  if (!authStore.supabaseUser && !authStore.isLoading) {
    await authStore.checkAuth()
  }

  if (authStore.isAuthenticated) {
    next()
  } else {
    // Reemplaza, evita historial de ruta protegida
    next({ name: 'Login', replace: true, query: { redirect: to.fullPath } })
  }
})

export default router
