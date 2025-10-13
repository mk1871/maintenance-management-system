<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import TasksHeader from '@/components/tasks/TasksHeader.vue'
import TasksStats from '@/components/tasks/TasksStats.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'

import { useTasksStore } from '@/stores/tasks'
import type { TaskWithRelations } from '@/composables/taskService'

const router = useRouter()
const tasksStore = useTasksStore()

const taskToDelete = ref<TaskWithRelations | null>(null)
const isDeleting = ref(false)
const isRefreshing = ref(false)

// Filtros
const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')

/**
 * Tareas filtradas
 */
const filteredTasks = computed((): TaskWithRelations[] => {
  let filtered = [...tasksStore.tasks]

  // ✅ CORRECCIÓN: Usar 'description' en lugar de 'title'
  // Filtro de búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (task) =>
        task.description.toLowerCase().includes(query) ||
        task.area_label?.toLowerCase().includes(query) ||
        task.element_name?.toLowerCase().includes(query) ||
        task.accommodation?.code.toLowerCase().includes(query) ||
        task.accommodation?.name.toLowerCase().includes(query),
    )
  }

  // Filtro de estado
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((task) => task.status === statusFilter.value)
  }

  // Filtro de prioridad
  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter((task) => task.priority === priorityFilter.value)
  }

  return filtered
})

/**
 * Refresca los datos
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await tasksStore.fetchTasks()
  isRefreshing.value = false
  toast.success('Tareas actualizadas')
}

/**
 * Maneja la creación exitosa de una tarea
 */
const handleTaskCreated = (): void => {
  // El store ya actualizó la lista automáticamente
}

/**
 * ✅ CORRECCIÓN: Recibir taskId (string) y buscar la tarea en el store
 * Navega al detalle de una tarea
 */
const handleViewTask = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

/**
 * ✅ CORRECCIÓN: Recibir taskId (string) y buscar la tarea en el store
 * Inicia el proceso de eliminación
 */
const handleDeleteTask = (taskId: string): void => {
  const task = tasksStore.tasks.find((t) => t.id === taskId)
  if (task) {
    taskToDelete.value = task
  }
}

/**
 * Confirma y ejecuta la eliminación
 */
const confirmDelete = async (): Promise<void> => {
  if (!taskToDelete.value) return

  try {
    isDeleting.value = true
    await tasksStore.deleteTask(taskToDelete.value.id)
    taskToDelete.value = null
  } catch (error: unknown) {
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

/**
 * Cancela la eliminación
 */
const cancelDelete = (): void => {
  taskToDelete.value = null
}

onMounted(async () => {
  await tasksStore.fetchTasks()
})
</script>

<template>
  <div class="space-y-6">
    <TasksHeader
      :is-refreshing="isRefreshing"
      @refresh="handleRefresh"
      @task-created="handleTaskCreated"
    />

    <!-- ✅ RECUPERADO: Pasando stats desde el store -->
    <TasksStats :stats="tasksStore.stats" />

    <Separator />

    <TaskFilters
      v-model:priority="priorityFilter"
      v-model:search="searchQuery"
      v-model:status="statusFilter"
    />

    <TaskList
      :is-loading="tasksStore.isLoading"
      :tasks="filteredTasks"
      @delete="handleDeleteTask"
      @view="handleViewTask"
    />

    <!-- Alert Dialog para eliminación -->
    <AlertDialog :open="!!taskToDelete" @update:open="(open) => !open && cancelDelete()">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
          <AlertDialogDescription>
            <!-- ✅ CORRECCIÓN: Usar 'description' en lugar de 'title' -->
            Esta acción no se puede deshacer. Se eliminará permanentemente la tarea
            <span v-if="taskToDelete" class="font-semibold">"{{ taskToDelete.description }}"</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting" @click="cancelDelete">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDelete"
          >
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
