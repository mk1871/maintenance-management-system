<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowRight } from 'lucide-vue-next'

import DashboardStats from '@/components/dashboard/DashboardStats.vue'
import { useDashboardStats } from '@/composables/useDashboardStats'

// Composables
const router = useRouter()
const { stats, isLoading, recentTasks, overdueTasks, loadDashboardData, formatCurrency } =
  useDashboardStats()

/**
 * Obtiene variante de badge según prioridad
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
 * Obtiene variante de badge según estado
 */
const getStatusVariant = (status: string): 'default' | 'outline' | 'secondary' | 'destructive' => {
  const variants: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
  }
  return variants[status] ?? 'secondary'
}

/**
 * Obtiene clases adicionales para badge de estado (solo para completed)
 */
const getStatusClasses = (status: string): string => {
  if (status === 'completed') {
    return 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
  }
  return ''
}

/**
 * Traduce prioridad
 */
const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }
  return translations[priority] ?? priority
}

/**
 * Traduce estado
 */
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }
  return translations[status] ?? status
}

/**
 * Formatea fecha
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Navega al detalle de una tarea
 */
const navigateToTask = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

/**
 * Navega a la vista de tareas
 */
const navigateToTasks = (): void => {
  router.push('/tasks')
}

// Lifecycle
onMounted(async () => {
  try {
    await loadDashboardData()
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar datos del dashboard')
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Resumen general del sistema de mantenimiento</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="i in 4" :key="i" class="h-32" />
      </div>
      <Skeleton class="h-64" />
    </div>

    <!-- Stats Cards -->
    <DashboardStats v-else :format-currency="formatCurrency" :stats="stats" />

    <!-- Tareas Vencidas (si hay) -->
    <Card v-if="overdueTasks.length > 0" class="border-red-200 dark:border-red-900">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle class="text-red-600 dark:text-red-400">Tareas Vencidas</CardTitle>
          </div>
          <Badge variant="destructive">{{ overdueTasks.length }}</Badge>
        </div>
        <CardDescription>Requieren atención inmediata</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Alojamiento</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="task in overdueTasks"
              :key="task.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="navigateToTask(task.id)"
            >
              <TableCell class="font-medium">{{ task.description }}</TableCell>
              <TableCell class="font-mono text-sm">
                {{ task.accommodation?.code || 'N/A' }}
              </TableCell>
              <TableCell>
                <Badge :variant="getPriorityVariant(task.priority)">
                  {{ translatePriority(task.priority) }}
                </Badge>
              </TableCell>
              <TableCell class="text-red-600 dark:text-red-400 font-semibold">
                {{ formatDate(task.due_date) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Tareas Recientes -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Tareas Recientes</CardTitle>
            <CardDescription>Últimas 10 tareas registradas</CardDescription>
          </div>
          <Button size="sm" variant="outline" @click="navigateToTasks">
            Ver todas
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="recentTasks.length === 0" class="text-center py-8">
          <p class="text-muted-foreground">No hay tareas registradas</p>
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Alojamiento</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="task in recentTasks"
              :key="task.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="navigateToTask(task.id)"
            >
              <TableCell class="font-medium">{{ task.description }}</TableCell>
              <TableCell class="font-mono text-sm">
                {{ task.accommodation?.code || 'N/A' }}
              </TableCell>
              <TableCell>
                <Badge :variant="getPriorityVariant(task.priority)">
                  {{ translatePriority(task.priority) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  :class="getStatusClasses(task.status)"
                  :variant="getStatusVariant(task.status)"
                >
                  {{ translateStatus(task.status) }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatDate(task.due_date) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
