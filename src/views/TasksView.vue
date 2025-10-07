<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Search, Filter, RefreshCw } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import TaskForm from '@/components/tasks/TaskForm.vue'

import { type Task, taskService } from '@/composables/taskService'
import { type Accommodation, accommodationService } from '@/composables/accommodationService'

const router = useRouter()

// Estado de datos
const tasks = ref<Task[]>([])
const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)

// Estado de filtros
const searchQuery = ref('')
const statusFilter = ref<string>('all')
const priorityFilter = ref<string>('all')
const accommodationFilter = ref<string>('all')

// Paginación
const currentPage = ref(1)
const itemsPerPage = 10

/**
 * Carga inicial de datos desde la base de datos
 */
const loadData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const [tasksData, accommodationsData] = await Promise.all([
      taskService.getAll(),
      accommodationService.getAll(),
    ])
    tasks.value = tasksData
    accommodations.value = accommodationsData
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar las tareas')
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresca los datos desde la base de datos
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await loadData()
  isRefreshing.value = false
  toast.success('Tareas actualizadas')
}

/**
 * Limpia todos los filtros aplicados
 */
const clearFilters = (): void => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  accommodationFilter.value = 'all'
  currentPage.value = 1
}

/**
 * Filtra tareas según criterios seleccionados
 */
const filteredTasks = computed(() => {
  let result = [...tasks.value]

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (task) =>
        task.description.toLowerCase().includes(query) ||
        task.accommodation?.code.toLowerCase().includes(query) ||
        task.accommodation?.name.toLowerCase().includes(query),
    )
  }

  // Filtro por estado
  if (statusFilter.value !== 'all') {
    result = result.filter((task) => task.status === statusFilter.value)
  }

  // Filtro por prioridad
  if (priorityFilter.value !== 'all') {
    result = result.filter((task) => task.priority === priorityFilter.value)
  }

  // Filtro por alojamiento
  if (accommodationFilter.value !== 'all') {
    result = result.filter((task) => task.accommodation_id === accommodationFilter.value)
  }

  return result
})

/**
 * Tareas paginadas según página actual
 */
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTasks.value.slice(start, end)
})

/**
 * Calcula total de páginas disponibles
 */
const totalPages = computed(() => Math.ceil(filteredTasks.value.length / itemsPerPage))

/**
 * Navega a una página específica
 */
const goToPage = (page: number): void => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

/**
 * Formatea el nombre del área desde la base de datos
 */
const formatAreaName = (area: string): string => {
  const areaNames: Record<string, string> = {
    living_room: 'Sala',
    kitchen: 'Cocina',
    bathroom_1: 'Baño 1',
    bathroom_2: 'Baño 2',
    bedroom_1: 'Habitación 1',
    bedroom_2: 'Habitación 2',
    bedroom_3: 'Habitación 3',
    terrace: 'Terraza',
    garage: 'Garaje',
  }
  return areaNames[area] || area
}

/**
 * Formatea el nombre del elemento
 */
const formatElementName = (element: string): string => {
  return element.charAt(0).toUpperCase() + element.slice(1).replace(/_/g, ' ')
}

/**
 * Formatea la prioridad para mostrar
 */
const formatPriority = (priority: string): string => {
  const priorities: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return priorities[priority] || priority
}

/**
 * Retorna la variante de badge según prioridad
 */
const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  }
  return variants[priority] ?? 'default'
}

/**
 * Formatea el estado para mostrar
 */
const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return statuses[status] || status
}

/**
 * Retorna la variante de badge según estado
 */
const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'outline',
    in_progress: 'default',
    completed: 'secondary',
    cancelled: 'outline',
  }
  return variants[status] ?? 'default'
}

/**
 * Formatea fecha en formato español
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Navega al detalle de la tarea
 */
const viewTaskDetail = (taskId: string): void => {
  router.push(`/tasks/${taskId}`)
}

/**
 * Maneja la creación exitosa de una tarea
 */
const handleTaskCreated = (): void => {
  handleRefresh()
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tareas de Mantenimiento</h1>
        <p class="text-muted-foreground mt-1">
          Gestiona y monitorea todas las tareas de mantenimiento
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button :disabled="isRefreshing" size="icon" variant="outline" @click="handleRefresh">
          <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
        </Button>
        <TaskForm @task-created="handleTaskCreated" />
      </div>
    </div>

    <!-- Filtros -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Filter class="h-5 w-5" />
          Filtros
        </CardTitle>
        <CardDescription>Filtra las tareas según tus criterios</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Búsqueda -->
          <div class="relative">
            <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" class="pl-9" placeholder="Buscar tareas..." />
          </div>

          <!-- Filtro por Estado -->
          <Select v-model="statusFilter">
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <!-- Filtro por Prioridad -->
          <Select v-model="priorityFilter">
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>

          <!-- Filtro por Alojamiento -->
          <Select v-model="accommodationFilter">
            <SelectTrigger>
              <SelectValue placeholder="Alojamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los alojamientos</SelectItem>
              <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                {{ acc.code }} - {{ acc.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Botón limpiar filtros -->
        <div class="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" @click="clearFilters"> Limpiar filtros </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de Tareas -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Lista de Tareas</CardTitle>
            <CardDescription> {{ filteredTasks.length }} tarea(s) encontrada(s) </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-3">
          <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredTasks.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="text-6xl mb-4">📋</div>
          <h3 class="text-lg font-semibold">No hay tareas</h3>
          <p class="text-muted-foreground mt-1">
            {{
              tasks.length === 0
                ? 'Crea tu primera tarea para comenzar'
                : 'No se encontraron tareas con los filtros aplicados'
            }}
          </p>
          <Button v-if="tasks.length > 0" class="mt-4" variant="outline" @click="clearFilters">
            Limpiar filtros
          </Button>
        </div>

        <!-- Tabla -->
        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alojamiento</TableHead>
                <TableHead>Área / Elemento</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="task in paginatedTasks"
                :key="task.id"
                class="hover:bg-muted/50 cursor-pointer"
                @click="viewTaskDetail(task.id)"
              >
                <TableCell class="font-medium">
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ task.accommodation?.code }}</span>
                    <span class="text-xs text-muted-foreground">{{
                        task.accommodation?.name
                      }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex flex-col">
                    <span class="text-sm">{{ formatAreaName(task.area) }}</span>
                    <span class="text-xs text-muted-foreground">{{
                        formatElementName(task.element)
                      }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div :title="task.description" class="max-w-xs truncate">
                    {{ task.description }}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="getPriorityVariant(task.priority)">
                    {{ formatPriority(task.priority) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(task.status)">
                    {{ formatStatus(task.status) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ formatDate(task.due_date) }}
                </TableCell>
                <TableCell class="text-right">
                  <Button size="sm" variant="ghost" @click.stop="viewTaskDetail(task.id)">
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
          <p class="text-sm text-muted-foreground">Página {{ currentPage }} de {{ totalPages }}</p>
          <div class="flex gap-2">
            <Button
              :disabled="currentPage === 1"
              size="sm"
              variant="outline"
              @click="goToPage(currentPage - 1)"
            >
              Anterior
            </Button>
            <Button
              :disabled="currentPage === totalPages"
              size="sm"
              variant="outline"
              @click="goToPage(currentPage + 1)"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
