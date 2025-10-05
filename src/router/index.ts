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
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterView.vue'),
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
      path: '/costs',
      name: 'Costs',
      component: () => import('../views/CostsView.vue'),
      meta: { requiresAuth: true }
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
  
  // If route doesn't require auth, proceed
  if (!to.meta.requiresAuth) {
    // If route should be hidden when authenticated (like login) and user is authenticated, redirect to home
    if (to.meta.hideForAuth && authStore.isAuthenticated) {
      next({ name: 'Home' })
    } else {
      next()
    }
    return
  }
  
  // For routes that require auth, wait for auth state to be initialized
  if (authStore.supabaseUser === null && !authStore.isLoading) {
    // Initialize auth state
    await authStore.checkAuth()
  }
  
  // Wait for loading to complete if still loading
  if (authStore.isLoading) {
    // Wait for auth check to complete
    const maxWait = 3000 // 3 seconds max wait
    const startTime = Date.now()
    
    while (authStore.isLoading && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // Check if user is authenticated
  if (authStore.isAuthenticated) {
    next()
  } else {
    // Redirect to login if not authenticated
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
})

export default router
