<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

import TaskDetailHeader from '@/components/tasks/TaskDetailHeader.vue'
import TaskGeneralInfo from '@/components/tasks/TaskGeneralInfo.vue'
import TaskRepairStatus from '@/components/tasks/TaskRepairStatus.vue'
import TaskCostsList from '@/components/tasks/TaskCostsList.vue'
import TaskCostDialog from '@/components/tasks/TaskCostDialog.vue'
import TaskTimelineCard from '@/components/tasks/TaskTimelineCard.vue'

import { useTasksStore } from '@/stores/tasks'
import { useCostsStore } from '@/stores/costs'

const route = useRoute()
const router = useRouter()

const tasksStore = useTasksStore()
const costsStore = useCostsStore()

const taskId = route.params.id as string
const isLoading = ref(true)
const showCostDialog = ref(false)

// Computed para obtener la tarea desde el store
const task = computed(() => tasksStore.getTaskById(taskId))

// Computed para filtrar costos de esta tarea
const taskCosts = computed(() => costsStore.costs.filter((cost) => cost.task_id === taskId))

const loadTaskData = async (): Promise<void> => {
  try {
    isLoading.value = true

    // Cargar tarea si no está en el store
    if (!task.value) {
      await tasksStore.fetchTasks()
    }

    // Cargar costos
    await costsStore.fetchCosts()

    // Si después de cargar no existe, redirigir
    if (!task.value) {
      router.push('/tasks')
      return
    }
  } catch (err: unknown) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleStartRepair = async (repairerName: string): Promise<void> => {
  try {
    await tasksStore.updateTask(taskId, {
      status: 'in_progress',
      repairer_name: repairerName,
      start_date: new Date().toISOString(),
    })
  } catch (err: unknown) {
    console.error(err)
  }
}

const handleCompleteTask = async (): Promise<void> => {
  try {
    await tasksStore.updateTask(taskId, {
      status: 'completed',
      completed_date: new Date().toISOString(),
      solution: 'Reparación completada',
    })
  } catch (err: unknown) {
    console.error(err)
  }
}

const handleCostAdded = (): void => {
  showCostDialog.value = false
}

const handleTaskUpdated = (): void => {
  // El store ya actualizó la tarea automáticamente
}

const goBack = (): void => {
  router.push('/tasks')
}

onMounted(async () => {
  await loadTaskData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton class="h-12 w-full" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Skeleton class="h-64 w-full" />
          <Skeleton class="h-64 w-full" />
        </div>
        <div class="space-y-6">
          <Skeleton class="h-48 w-full" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!task">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle class="h-12 w-12" />
          </EmptyMedia>
          <EmptyTitle>Tarea no encontrada</EmptyTitle>
          <EmptyDescription> La tarea que buscas no existe o fue eliminada </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button @click="goBack">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Volver a tareas
          </Button>
        </EmptyContent>
      </Empty>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header con botón de edición y badges -->
      <TaskDetailHeader :task="task" @back="goBack" @updated="handleTaskUpdated" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <TaskGeneralInfo :task="task" />
          <TaskRepairStatus
            :task="task"
            @start-repair="handleStartRepair"
            @complete-task="handleCompleteTask"
          />
          <TaskCostsList :costs="taskCosts" @add-cost="showCostDialog = true" />
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <TaskTimelineCard :task="task" />
        </div>
      </div>
    </div>

    <!-- Cost Dialog -->
    <TaskCostDialog
      v-if="task"
      :accommodation-id="task.accommodation_id"
      :open="showCostDialog"
      :task-id="taskId"
      @close="showCostDialog = false"
      @cost-added="handleCostAdded"
    />
  </div>
</template>
