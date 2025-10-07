<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-vue-next'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import { taskService, type Task } from '@/composables/taskService'
import { costService } from '@/composables/costService'

const route = useRoute()
const router = useRouter()

// Estado de datos
const accommodationId = route.params.id as string
const accommodation = ref<Accommodation | null>(null)
const recentTasks = ref<Task[]>([])
const isLoading = ref(true)

// Resumen de estadísticas
const summary = ref({
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  totalCost: 0,
})

/**
 * Carga los datos del alojamiento
 */
const loadAccommodationData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const accData = await accommodationService.getById(accommodationId)

    if (!accData) {
      toast.error('Alojamiento no encontrado')
      router.push('/accommodations')
      return
    }

    accommodation.value = accData

    // Cargar tareas del alojamiento
    const allTasks = await taskService.getAll()
    recentTasks.value = allTasks
      .filter((task) => task.accommodation_id === accommodationId)
      .slice(0, 5)

    // Calcular resumen
    await calculateSummary()
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar los datos del alojamiento')
  } finally {
    isLoading.value = false
  }
}

/**
 * Calcula el resumen de estadísticas
 */
const calculateSummary = async (): Promise<void> => {
  try {
    const tasks = await taskService.getAll()
    const accommodationTasks = tasks.filter((task) => task.accommodation_id === accommodationId)

    summary.value.pendingTasks = accommodationTasks.filter(
      (task) => task.status === 'pending',
    ).length
    summary.value.inProgressTasks = accommodationTasks.filter(
      (task) => task.status === 'in_progress',
    ).length
    summary.value.completedTasks = accommodationTasks.filter(
      (task) => task.status === 'completed',
    ).length

    const costs = await costService.getAll()
    const accommodationCosts = costs.filter((cost) => cost.accommodation_id === accommodationId)
    summary.value.totalCost = accommodationCosts.reduce((sum, cost) => sum + cost.amount, 0)
  } catch (err: unknown) {
    console.error(err)
  }
}

/**
 * Total de tareas
 */
const totalTasks = computed(() => {
  return summary.value.pendingTasks + summary.value.inProgressTasks + summary.value.completedTasks
})

/**
 * Total de áreas configuradas
 */
const totalAreas = computed(() => {
  return accommodation.value?.configured_areas
    ? Object.keys(accommodation.value.configured_areas).length
    : 0
})

/**
 * Total de elementos configurados
 */
const totalElements = computed(() => {
  if (!accommodation.value?.configured_areas) return 0
  return Object.values(accommodation.value.configured_areas).reduce(
    (sum, elements) => sum + elements.length,
    0,
  )
})

/**
 * Formatea el estado
 */
const formatStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return statuses[status] || status
}

/**
 * Variante de badge para estado
 */
const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    pending: 'outline',
    in_progress: 'default',
    completed: 'secondary',
    cancelled: 'outline',
  }
  return variants[status] ?? 'secondary'
}

/**
 * Formatea el nombre del área
 */
const formatAreaName = (area: string): string => {
  const areaNames: Record<string, string> = {
    living_room: 'Sala de Estar',
    kitchen: 'Cocina',
    bathroom_1: 'Baño Principal',
    bathroom_2: 'Segundo Baño',
    bedroom_1: 'Dormitorio Principal',
    bedroom_2: 'Segundo Dormitorio',
    bedroom_3: 'Tercer Dormitorio',
    terrace: 'Terraza',
    garage: 'Garaje',
  }
  return areaNames[area] || area
}

/**
 * Formatea la prioridad
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
 * Clase de borde según prioridad
 */
const getPriorityBorder = (priority: string): string => {
  const borders: Record<string, string> = {
    low: 'border-l-green-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500',
  }
  return borders[priority] ?? 'border-l-gray-500'
}

/**
 * Navega a crear nueva tarea
 */
const createNewTask = (): void => {
  router.push(`/tasks/new?accommodation=${accommodationId}`)
}

/**
 * Navega a ver detalle de tarea
 */
const viewTask = (taskId: string): void => {
  router.push(`/tasks/${taskId}`)
}

/**
 * Navega de vuelta a la lista
 */
const goBack = (): void => {
  router.push('/accommodations')
}

onMounted(async () => {
  await loadAccommodationData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
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
    <div v-else-if="!accommodation" class="flex flex-col items-center justify-center py-12">
      <AlertCircle class="h-16 w-16 text-muted-foreground mb-4" />
      <h2 class="text-2xl font-bold">Alojamiento no encontrado</h2>
      <Button class="mt-4" @click="goBack">Volver a alojamientos</Button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button size="icon" variant="outline" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              {{ accommodation.code }} - {{ accommodation.name }}
            </h1>
            <p class="text-muted-foreground mt-1">
              {{ accommodation.address || 'Sin dirección' }}
            </p>
          </div>
        </div>
        <Badge :variant="getStatusVariant(accommodation.status)">
          {{ formatStatus(accommodation.status) }}
        </Badge>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Información General -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Building2 class="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <Label class="text-muted-foreground">Código</Label>
                  <p class="font-medium">{{ accommodation.code }}</p>
                </div>
                <div class="space-y-1">
                  <Label class="text-muted-foreground">Estado</Label>
                  <Badge :variant="getStatusVariant(accommodation.status)">
                    {{ formatStatus(accommodation.status) }}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div class="space-y-1">
                <Label class="text-muted-foreground">Dirección</Label>
                <p class="text-sm">{{ accommodation.address || 'Sin dirección registrada' }}</p>
              </div>
              <Separator />
              <div class="space-y-2">
                <Label class="text-muted-foreground">Áreas Configuradas</Label>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="(elements, area) in accommodation.configured_areas"
                    :key="area"
                    variant="outline"
                  >
                    {{ formatAreaName(area as string) }} ({{ elements.length }})
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Tareas Recientes -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <FileText class="h-5 w-5" />
                Tareas Recientes
              </CardTitle>
              <CardDescription>Últimas 5 tareas de este alojamiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="recentTasks.length > 0" class="space-y-3">
                <div
                  v-for="task in recentTasks"
                  :key="task.id"
                  :class="getPriorityBorder(task.priority)"
                  class="border-l-4 pl-4 py-3 hover:bg-muted/50 rounded-r cursor-pointer transition-colors"
                  @click="viewTask(task.id)"
                >
                  <h3 class="font-medium line-clamp-2">{{ task.description }}</h3>
                  <div class="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Badge class="text-xs" variant="outline">
                      {{ formatPriority(task.priority) }}
                    </Badge>
                    <Badge class="text-xs" variant="outline">
                      {{ formatStatus(task.status) }}
                    </Badge>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                No hay tareas registradas
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Resumen Estadístico -->
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Estadísticas del alojamiento</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">Pendientes</span>
                </div>
                <span class="font-bold text-lg">{{ summary.pendingTasks }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-blue-500" />
                  <span class="text-sm text-muted-foreground">En Progreso</span>
                </div>
                <span class="font-bold text-lg">{{ summary.inProgressTasks }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500" />
                  <span class="text-sm text-muted-foreground">Completadas</span>
                </div>
                <span class="font-bold text-lg">{{ summary.completedTasks }}</span>
              </div>
              <Separator />
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm text-muted-foreground">Costo Total</span>
                </div>
                <span class="font-bold text-lg">€{{ summary.totalCost.toFixed(2) }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Información Rápida -->
          <Card>
            <CardHeader>
              <CardTitle>Información Rápida</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Total Tareas</span>
                <span class="font-medium">{{ totalTasks }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Áreas</span>
                <span class="font-medium">{{ totalAreas }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Elementos</span>
                <span class="font-medium">{{ totalElements }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Acciones -->
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <Button class="w-full" @click="createNewTask">Crear Nueva Tarea</Button>
              <Button class="w-full" variant="outline">Editar Alojamiento</Button>
              <Button class="w-full" variant="outline">Generar Reporte</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
