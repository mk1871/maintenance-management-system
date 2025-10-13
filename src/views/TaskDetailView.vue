<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
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

import { taskService, type TaskWithRelations } from '@/composables/taskService'
import { costService, type Cost } from '@/composables/costService'

const route = useRoute()
const router = useRouter()

const taskId = route.params.id as string
const task = ref<TaskWithRelations | null>(null)
const costs = ref<Cost[]>([])
const isLoading = ref(true)
const showCostDialog = ref(false)

const loadTaskData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const [taskData, costsData] = await Promise.all([
      taskService.getById(taskId),
      costService.getByTaskId(taskId),
    ])

    if (!taskData) {
      toast.error('Tarea no encontrada')
      router.push('/tasks')
      return
    }

    task.value = taskData
    costs.value = costsData || []
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar los datos de la tarea')
  } finally {
    isLoading.value = false
  }
}

const handleStartRepair = async (repairerName: string): Promise<void> => {
  try {
    await taskService.update({
      id: taskId,
      status: 'in_progress',
      repairer_name: repairerName,
      start_date: new Date().toISOString(),
    })

    await loadTaskData()
    toast.success('Reparación iniciada exitosamente')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al iniciar la reparación')
  }
}

const handleCompleteTask = async (): Promise<void> => {
  try {
    await taskService.update({
      id: taskId,
      status: 'completed',
      completed_date: new Date().toISOString(),
      solution: 'Reparación completada',
    })

    await loadTaskData()
    toast.success('Tarea completada exitosamente')
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al completar la tarea')
  }
}

const handleCostAdded = async (cost: Cost): Promise<void> => {
  costs.value = [cost, ...costs.value]
  showCostDialog.value = false
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
      <TaskDetailHeader :task="task" @back="goBack" @updated="loadTaskData" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <TaskGeneralInfo :task="task" />
          <TaskRepairStatus
            :task="task"
            @start-repair="handleStartRepair"
            @complete-task="handleCompleteTask"
          />
          <TaskCostsList :costs="costs" @add-cost="showCostDialog = true" />
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
