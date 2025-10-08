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

import TaskList from '@/components/tasks/TaskList.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'

import { taskService, type TaskWithRelations } from '@/composables/taskService'

// Composables
const router = useRouter()

// State
const tasks = ref<TaskWithRelations[]>([])
const isLoading = ref(true)
const taskToDelete = ref<TaskWithRelations | null>(null)
const isDeleting = ref(false)

// Filtros
const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')

/**
 * Estadísticas calculadas
 */
const stats = computed(() => {
  return calculateTaskStats()
})

/**
 * Tareas filtradas
 */
const filteredTasks = computed((): TaskWithRelations[] => {
  return applyFilters()
})

/**
 * Carga todas las tareas
 */
const loadTasks = async (): Promise<void> => {
  isLoading.value = true
  try {
    tasks.value = await taskService.getAll()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar tareas')
  } finally {
    isLoading.value = false
  }
}

/**
 * Calcula estadísticas de tareas
 */
const calculateTaskStats = () => {
  const total = tasks.value.length
  const pending = tasks.value.filter((t) => t.status === 'pending').length
  const inProgress = tasks.value.filter((t) => t.status === 'in_progress').length
  const completed = tasks.value.filter((t) => t.status === 'completed').length
  const overdue = tasks.value.filter((t) => isTaskOverdue(t)).length

  return { total, pending, inProgress, completed, overdue }
}

/**
 * Verifica si una tarea está vencida
 */
const isTaskOverdue = (task: TaskWithRelations): boolean => {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return false
  }
  return new Date(task.due_date) < new Date()
}

/**
 * Aplica filtros a las tareas
 */
const applyFilters = (): TaskWithRelations[] => {
  let filtered = [...tasks.value]

  // Filtro de búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((task) =>
      matchesSearchQuery(task, query)
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
}

/**
 * Verifica si una tarea coincide con la búsqueda
 */
const matchesSearchQuery = (task: TaskWithRelations, query: string): boolean => {
  const searchableFields = [
    task.description.toLowerCase(),
    task.accommodation?.code.toLowerCase() || '',
    task.area_label?.toLowerCase() || '',
    task.element_name?.toLowerCase() || '',
  ]

  return searchableFields.some((field) => field.includes(query))
}

/**
 * Maneja actualización de filtro de búsqueda
 */
const handleSearchUpdate = (value: string): void => {
  searchQuery.value = value
}

/**
 * Maneja actualización de filtro de estado
 */
const handleStatusUpdate = (value: string): void => {
  statusFilter.value = value
}

/**
 * Maneja actualización de filtro de prioridad
 */
const handlePriorityUpdate = (value: string): void => {
  priorityFilter.value = value
}

/**
 * Limpia todos los filtros
 */
const handleClearFilters = (): void => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
}

/**
 * Navega al detalle de una tarea
 */
const handleViewDetail = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

/**
 * Marca una tarea como completada
 */
const handleCompleteTask = async (taskId: string): Promise<void> => {
  try {
    await taskService.update({
      id: taskId,
      status: 'completed',
      completed_date: new Date().toISOString(),
    })

    toast.success('Tarea marcada como completada')
    await loadTasks()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al completar tarea')
  }
}

/**
 * Abre el dialog de confirmación de eliminación
 */
const openDeleteDialog = (taskId: string): void => {
  const task = tasks.value.find((t) => t.id === taskId)
  if (task) {
    taskToDelete.value = task
  }
}

/**
 * Cierra el dialog de eliminación
 */
const closeDeleteDialog = (): void => {
  taskToDelete.value = null
}

/**
 * Elimina una tarea después de confirmación
 */
const handleDeleteTask = async (): Promise<void> => {
  if (!taskToDelete.value) return

  isDeleting.value = true
  try {
    await taskService.delete(taskToDelete.value.id)
    toast.success('Tarea eliminada exitosamente')
    closeDeleteDialog()
    await loadTasks()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al eliminar tarea')
  } finally {
    isDeleting.value = false
  }
}

/**
 * Maneja la creación exitosa de una tarea
 */
const handleTaskCreated = (): void => {
  loadTasks()
}

// Lifecycle
onMounted(async () => {
  await loadTasks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header con Estadísticas -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold">Tareas</h1>
        <p class="text-muted-foreground">
          Gestiona y monitorea todas las tareas de mantenimiento
        </p>
      </div>

      <!-- Estadísticas Compactas -->
      <div class="flex gap-4">
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold">{{ stats.total }}</div>
            <div class="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold text-blue-600">{{ stats.pending }}</div>
            <div class="text-sm text-muted-foreground">Pendientes</div>
          </div>
        </div>
        <div class="border rounded-lg p-3 bg-card">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold text-green-600">{{ stats.completed }}</div>
            <div class="text-sm text-muted-foreground">Completadas</div>
          </div>
        </div>
        <div v-if="stats.overdue > 0" class="border rounded-lg p-3 bg-card border-destructive">
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold text-destructive">{{ stats.overdue }}</div>
            <div class="text-sm text-muted-foreground">Vencidas</div>
          </div>
        </div>
      </div>
    </div>

    <Separator />

    <!-- Toolbar con Filtros y Botón de Crear -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h2 class="text-xl font-semibold">Lista de Tareas</h2>
      <TaskForm @task-created="handleTaskCreated" />
    </div>

    <!-- Filtros -->
    <TaskFilters
      @clear="handleClearFilters"
      @update:search="handleSearchUpdate"
      @update:status="handleStatusUpdate"
      @update:priority="handlePriorityUpdate"
    />

    <!-- Lista de Tareas -->
    <TaskList
      :is-loading="isLoading"
      :tasks="filteredTasks"
      @complete="handleCompleteTask"
      @delete="openDeleteDialog"
      @view-detail="handleViewDetail"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="!!taskToDelete" @update:open="closeDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la tarea y no se puede deshacer.
            <br /><br />
            <strong>Descripción:</strong> {{ taskToDelete?.description.substring(0, 100) }}...
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="closeDeleteDialog">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDeleteTask"
          >
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
