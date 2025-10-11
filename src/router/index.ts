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
      redirect: '/',
    },
  ],
})

/**
 * Navigation guard con manejo de autenticación
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Rutas públicas
  if (!to.meta.requiresAuth) {
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      return next({ name: 'Home' })
    }
    return next()
  }

  // Esperar si está cargando (máximo 3 segundos)
  if (authStore.isLoading) {
    let waited = 0
    while (authStore.isLoading && waited < 3000) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waited += 100
    }
  }

  // ✅ Decisión con if/else explícito (no ternario)
  if (authStore.isAuthenticated) {
    next()
  } else {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
  }
})

export default router
