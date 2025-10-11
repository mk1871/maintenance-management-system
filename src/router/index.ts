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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

/**
 * Navigation guard simplificado
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si no requiere auth, continuar
  if (!to.meta.requiresAuth) {
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      return next({ name: 'Home', replace: true })
    }
    return next()
  }

  // ✅ Esperar máximo 3 segundos si está cargando
  let attempts = 0
  while (authStore.isLoading && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  // Si no hay usuario, verificar auth
  if (!authStore.supabaseUser && !authStore.isLoading) {
    await authStore.checkAuth()
  }

  // Decisión final
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
