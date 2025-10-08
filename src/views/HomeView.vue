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
const getStatusVariant = (status: string): 'default' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'outline' | 'secondary'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
  }
  return variants[status] ?? 'secondary'
}

/**
 * Traduce prioridad a español
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
 * Traduce estado a español
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
 * Navega al detalle de una tarea
 */
const navigateToTask = (taskId: string): void => {
  router.push({ name: 'TaskDetail', params: { id: taskId } })
}

/**
 * Navega a la lista de tareas
 */
const navigateToTasks = (): void => {
  router.push({ name: 'Tasks' })
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
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">
        Resumen general del sistema de gestión de mantenimiento
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="i in 7" :key="`skeleton-${i}`" class="h-32" />
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Estadísticas -->
      <DashboardStats :format-currency="formatCurrency" :stats="stats" />

      <!-- Tareas Vencidas Alert -->
      <Card v-if="overdueTasks.length > 0" class="border-destructive">
        <CardHeader>
          <div class="flex items-center gap-2">
            <AlertCircle class="h-5 w-5 text-destructive" />
            <CardTitle>Tareas Vencidas</CardTitle>
          </div>
          <CardDescription>
            Hay {{ overdueTasks.length }} tarea{{ overdueTasks.length !== 1 ? 's' : '' }}
            vencida{{ overdueTasks.length !== 1 ? 's' : '' }} que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" @click="navigateToTasks">
            Ver Tareas Vencidas
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <!-- Tareas Recientes -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>Últimas tareas creadas en el sistema</CardDescription>
            </div>
            <Button size="sm" variant="outline" @click="navigateToTasks">
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
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
              <TableRow v-if="recentTasks.length === 0">
                <TableCell class="text-center text-muted-foreground" colspan="5">
                  No hay tareas recientes
                </TableCell>
              </TableRow>
              <TableRow
                v-for="task in recentTasks"
                :key="task.id"
                class="cursor-pointer hover:bg-muted/50"
                @click="navigateToTask(task.id)"
              >
                <TableCell class="font-medium">
                  {{ task.description.substring(0, 50)
                  }}{{ task.description.length > 50 ? '...' : '' }}
                </TableCell>
                <TableCell>
                  {{ task.accommodation?.code || 'N/A' }}
                </TableCell>
                <TableCell>
                  <Badge :variant="getPriorityVariant(task.priority)">
                    {{ translatePriority(task.priority) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(task.status)">
                    {{ translateStatus(task.status) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {{ new Date(task.due_date).toLocaleDateString('es-ES') }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
