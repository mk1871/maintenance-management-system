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
 * Obtiene el color según el tipo de estadística
 */
const getStatColor = (type: IconType): string => {
  const colors: Record<IconType, string> = {
    completed: 'text-green-600',
    pending: 'text-blue-600',
    overdue: 'text-red-600',
    progress: 'text-purple-600',
    accommodations: 'text-indigo-600',
    cost: 'text-orange-600',
  }
  return colors[type]
}

/**
 * Determina si mostrar badge de alerta en tareas vencidas
 */
const showOverdueAlert = computed((): boolean => {
  return props.stats.overdueTasksCount > 0
})
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Total Tareas -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Tareas</CardTitle>
        <component :is="getStatIcon('progress')" :class="getStatColor('progress')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.totalTasks }}</div>
        <div class="flex items-center gap-2 mt-2">
          <Badge class="text-xs" variant="secondary">
            {{ stats.completedTasks }} completadas
          </Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Tasa de Completitud -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Completitud</CardTitle>
        <component :is="getStatIcon('completed')" :class="getStatColor('completed')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.completionRate }}%</div>
        <Progress :model-value="stats.completionRate" class="mt-2" />
      </CardContent>
    </Card>

    <!-- Tareas Pendientes -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Pendientes</CardTitle>
        <component :is="getStatIcon('pending')" :class="getStatColor('pending')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.pendingTasks }}</div>
        <p class="text-xs text-muted-foreground mt-2">
          {{ stats.inProgressTasks }} en progreso
        </p>
      </CardContent>
    </Card>

    <!-- Tareas Vencidas -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Vencidas</CardTitle>
        <component :is="getStatIcon('overdue')" :class="getStatColor('overdue')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.overdueTasksCount }}</div>
        <Badge
          v-if="showOverdueAlert"
          class="text-xs mt-2"
          variant="destructive"
        >
          Requieren atención
        </Badge>
      </CardContent>
    </Card>

    <!-- Alojamientos Activos -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Alojamientos</CardTitle>
        <component :is="getStatIcon('accommodations')" :class="getStatColor('accommodations')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.activeAccommodations }}</div>
        <p class="text-xs text-muted-foreground mt-2">
          {{ stats.totalAccommodations }} total
        </p>
      </CardContent>
    </Card>

    <!-- Costo Mensual -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Costo Mensual</CardTitle>
        <component :is="getStatIcon('cost')" :class="getStatColor('cost')" class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(stats.monthlyCost) }}</div>
        <p class="text-xs text-muted-foreground mt-2">
          {{ formatCurrency(stats.averageCostPerTask) }}/tarea
        </p>
      </CardContent>
    </Card>

    <!-- Prioridad Alta -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Alta Prioridad</CardTitle>
        <AlertTriangle class="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.highPriorityTasks }}</div>
        <p class="text-xs text-muted-foreground mt-2">
          Requieren seguimiento
        </p>
      </CardContent>
    </Card>

    <!-- Placeholder Card (para mantener grid par) -->
    <Card class="hidden lg:block">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Eficiencia</CardTitle>
        <TrendingUp class="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {{ stats.completedTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0 }}%
        </div>
        <p class="text-xs text-muted-foreground mt-2">
          Tareas completadas vs total
        </p>
      </CardContent>
    </Card>
  </div>
</template>
