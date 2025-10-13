<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'

import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import DashboardStats from '@/components/dashboard/DashboardStats.vue'
import DashboardRecentTasks from '@/components/dashboard/DashboardRecentTasks.vue'
import DashboardOverdueTasks from '@/components/dashboard/DashboardOverdueTasks.vue'

import { useTasksStore } from '@/stores/tasks'
import { useCostsStore } from '@/stores/costs'
import { useAccommodationsStore } from '@/stores/accommodations'

const router = useRouter()

const tasksStore = useTasksStore()
const costsStore = useCostsStore()
const accommodationsStore = useAccommodationsStore()

// Computed para tareas recientes (últimas 5)
const recentTasks = computed(() => {
  return [...tasksStore.tasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
})

// Computed para tareas vencidas
const overdueTasks = computed(() => tasksStore.overdueTasks)

// Computed para tareas de alta prioridad
const highPriorityTasks = computed(() =>
  tasksStore.tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length
)

// Computed para tasa de completación
const completionRate = computed(() => {
  if (tasksStore.taskCount === 0) return 0
  return (tasksStore.completedTasks.length / tasksStore.taskCount) * 100
})

// Computed para costo promedio por tarea
const averageCostPerTask = computed(() => {
  if (tasksStore.taskCount === 0) return 0
  return costsStore.totalCosts / tasksStore.taskCount
})

// Computed para estadísticas del dashboard (formato compatible con DashboardStats)
const dashboardStats = computed(() => ({
  totalTasks: tasksStore.taskCount,
  pendingTasks: tasksStore.pendingTasks.length,
  completedTasks: tasksStore.completedTasks.length,
  inProgressTasks: tasksStore.inProgressTasks.length,
  overdueTasksCount: tasksStore.overdueTasks.length,
  highPriorityTasks: highPriorityTasks.value,
  completionRate: completionRate.value,
  monthlyCost: costsStore.monthlyCosts,
  averageCostPerTask: averageCostPerTask.value,
  totalAccommodations: accommodationsStore.accommodationCount,
  activeAccommodations: accommodationsStore.activeAccommodations.length,
}))

const isLoading = computed(() =>
  tasksStore.isLoading || costsStore.isLoading || accommodationsStore.isLoading
)

const navigateToTask = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

const navigateToTasks = (): void => {
  router.push('/tasks')
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

onMounted(async () => {
  await Promise.all([
    tasksStore.fetchTasks(),
    costsStore.fetchCosts(),
    accommodationsStore.fetchAccommodations(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton class="h-20 w-full" />
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-32 w-full" />
      </div>
      <Skeleton class="h-96 w-full" />
    </div>

    <!-- Content -->
    <template v-else>
      <DashboardHeader @navigate-tasks="navigateToTasks" />

      <DashboardStats :format-currency="formatCurrency" :stats="dashboardStats" />

      <DashboardOverdueTasks :tasks="overdueTasks" @view-task="navigateToTask" />

      <DashboardRecentTasks
        :tasks="recentTasks"
        @view-task="navigateToTask"
        @view-all="navigateToTasks"
      />
    </template>
  </div>
</template>
