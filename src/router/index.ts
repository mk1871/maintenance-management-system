import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false, hideForAuth: true }
    },
    {
      path: '/accommodations',
      name: 'Accommodations',
      component: () => import('../views/AccommodationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/accommodations/:id',
      name: 'AccommodationDetail',
      component: () => import('../views/AccommodationDetailView.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('../views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks/:id',
      name: 'TaskDetail',
      component: () => import('../views/TaskDetailView.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
      meta: { requiresAuth: false }
    }
  ],
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth if it hasn't been done yet
  if (authStore.supabaseUser === null && !authStore.isLoading) {
    await authStore.checkAuth()
  }
  
  // Check if route requires auth
  if (to.meta.requiresAuth) {
    if (authStore.isAuthenticated) {
      next()
    } else {
      // Redirect to login if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  } else if (to.meta.hideForAuth && authStore.isAuthenticated) {
    // If route should be hidden when authenticated (like login), redirect to home
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
