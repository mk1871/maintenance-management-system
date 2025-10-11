<script lang="ts" setup>
import { computed, type Component } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  DollarSign,
} from 'lucide-vue-next'
import type { DashboardStats } from '@/composables/useDashboardStats.ts'

// Props
const props = defineProps<{
  stats: DashboardStats
  formatCurrency: (amount: number) => string
}>()

/**
 * Tipos de iconos disponibles
 */
type IconType = 'completed' | 'pending' | 'overdue' | 'progress' | 'accommodations' | 'cost'

/**
 * Obtiene el ícono según el tipo de estadística
 */
const getStatIcon = (type: IconType): Component => {
  const icons: Record<IconType, Component> = {
    completed: CheckCircle,
    pending: Clock,
    overdue: AlertTriangle,
    progress: TrendingUp,
    accommodations: Building2,
    cost: DollarSign,
  }
  return icons[type]
}

/**
 * Obtiene las clases de color para el ícono según el tipo (adaptables al tema)
 */
const getIconClasses = (type: IconType): string => {
  const classes: Record<IconType, string> = {
    completed: 'text-green-600 dark:text-green-400',
    pending: 'text-blue-600 dark:text-blue-400',
    overdue: 'text-red-600 dark:text-red-400',
    progress: 'text-purple-600 dark:text-purple-400',
    accommodations: 'text-indigo-600 dark:text-indigo-400',
    cost: 'text-amber-600 dark:text-amber-400',
  }
  return classes[type]
}

/**
 * Tasa de finalización formateada
 */
const completionRateFormatted = computed((): string => {
  return `${props.stats.completionRate.toFixed(1)}%`
})
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Tareas Completadas -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Tareas Completadas</CardTitle>
        <component
          :is="getStatIcon('completed')"
          :class="getIconClasses('completed')"
          class="h-4 w-4"
        />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.completedTasks }}</div>
        <p class="text-xs text-muted-foreground">de {{ stats.totalTasks }} totales</p>
        <Progress :model-value="stats.completionRate" class="mt-2" />
        <p class="text-xs text-muted-foreground mt-1">{{ completionRateFormatted }} completado</p>
      </CardContent>
    </Card>

    <!-- Tareas Pendientes -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Tareas Pendientes</CardTitle>
        <component
          :is="getStatIcon('pending')"
          :class="getIconClasses('pending')"
          class="h-4 w-4"
        />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.pendingTasks }}</div>
        <div class="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{{ stats.inProgressTasks }} en progreso</Badge>
        </div>
        <p class="text-xs text-muted-foreground mt-2">
          {{ stats.highPriorityTasks }} de alta prioridad
        </p>
      </CardContent>
    </Card>

    <!-- Tareas Vencidas -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Tareas Vencidas</CardTitle>
        <component
          :is="getStatIcon('overdue')"
          :class="getIconClasses('overdue')"
          class="h-4 w-4"
        />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.overdueTasksCount }}</div>
        <p class="text-xs text-muted-foreground">requieren atención inmediata</p>
        <Badge v-if="stats.overdueTasksCount > 0" class="mt-2" variant="destructive">
          Acción requerida
        </Badge>
        <Badge
          v-else
          class="mt-2 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
          variant="outline"
        >
          Al día
        </Badge>
      </CardContent>
    </Card>

    <!-- Costos Mensuales -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Costos del Mes</CardTitle>
        <component :is="getStatIcon('cost')" :class="getIconClasses('cost')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(stats.monthlyCost) }}</div>
        <p class="text-xs text-muted-foreground">
          Promedio: {{ formatCurrency(stats.averageCostPerTask) }} por tarea
        </p>
        <div class="flex items-center gap-2 mt-2">
          <Badge variant="outline">{{ stats.totalAccommodations }} alojamientos</Badge>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
