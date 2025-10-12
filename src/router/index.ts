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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore()

  // Rutas públicas
  if (!to.meta.requiresAuth) {
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      next({ name: 'Home' })
    } else {
      next()
    }
    return
  }

  // ✅ SI YA ESTÁ AUTENTICADO, CONTINUAR SIN HACER NADA
  if (authStore.isAuthenticated) {
    next()
    return
  }

  // ✅ SI ESTÁ CARGANDO, ESPERAR
  if (authStore.isLoading) {
    let attempts = 0
    while (authStore.isLoading && attempts < 30) {
      await new Promise((r) => setTimeout(r, 100))
      attempts++
    }
  }

  // ✅ SI NO ESTÁ AUTENTICADO Y NO ESTÁ CARGANDO, VERIFICAR
  if (!authStore.isAuthenticated && !authStore.isLoading) {
    await authStore.checkAuth()
  }

  // Decisión final
  if (authStore.isAuthenticated) {
    next()
  } else {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
})

export default router
