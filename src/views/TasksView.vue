<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
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
import { ListTodo, Clock, Loader, CheckCircle, AlertTriangle } from 'lucide-vue-next'

import TaskList from '@/components/tasks/TaskList.vue'
import TaskFilters from '@/components/tasks/TaskFilters.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'

import { taskService, type TaskWithRelations } from '@/composables/taskService'

const router = useRouter()

const tasks = ref<TaskWithRelations[]>([])
const isLoading = ref(true)
const taskToDelete = ref<TaskWithRelations | null>(null)
const isDeleting = ref(false)

const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')

/**
 * Estadísticas calculadas
 */
const stats = computed(() => {
  const total = tasks.value.length
  const pending = tasks.value.filter((t) => t.status === 'pending').length
  const inProgress = tasks.value.filter((t) => t.status === 'in_progress').length
  const completed = tasks.value.filter((t) => t.status === 'completed').length
  const overdue = tasks.value.filter((t) => {
    if (t.status === 'completed' || t.status === 'cancelled') return false
    return new Date(t.due_date) < new Date()
  }).length

  return { total, pending, inProgress, completed, overdue }
})

/**
 * Tareas filtradas
 */
const filteredTasks = computed((): TaskWithRelations[] => {
  let filtered = [...tasks.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((task) => {
      const searchableFields = [
        task.description.toLowerCase(),
        task.accommodation?.code.toLowerCase() || '',
        task.area_label?.toLowerCase() || '',
        task.element_name?.toLowerCase() || '',
      ]
      return searchableFields.some((field) => field.includes(query))
    })
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((task) => task.status === statusFilter.value)
  }

  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter((task) => task.priority === priorityFilter.value)
  }

  return filtered
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

onMounted(async () => {
  await loadTasks()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tareas</h1>
      <p class="text-muted-foreground">Gestiona y monitorea todas las tareas de mantenimiento</p>
    </div>

    <!-- Estadísticas con Cards oficiales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total</p>
            <p class="text-3xl font-bold">{{ stats.total }}</p>
          </div>
          <ListTodo class="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Pendientes</p>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ stats.pending }}</p>
          </div>
          <Clock class="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">En Progreso</p>
            <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {{ stats.inProgress }}
            </p>
          </div>
          <Loader class="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Completadas</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ stats.completed }}
            </p>
          </div>
          <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
        </CardContent>
      </Card>

      <Card v-if="stats.overdue > 0" class="border-destructive">
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Vencidas</p>
            <p class="text-3xl font-bold text-destructive">{{ stats.overdue }}</p>
          </div>
          <AlertTriangle class="h-8 w-8 text-destructive" />
        </CardContent>
      </Card>
    </div>

    <Separator />

    <!-- Toolbar -->
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
          <AlertDialogCancel @click="closeDeleteDialog"> Cancelar </AlertDialogCancel>
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
