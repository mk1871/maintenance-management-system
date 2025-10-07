<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Building2,
  ListTodo,
  Clock,
  Euro,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
} from 'lucide-vue-next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

import { supabase } from '@/services/supabase'

interface DashboardStats {
  accommodations: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  monthlyCost: number
  totalTasks: number
}

const router = useRouter()
const isLoading = ref(true)
const isRefreshing = ref(false)

const stats = ref<DashboardStats>({
  accommodations: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  monthlyCost: 0,
  totalTasks: 0,
})

/**
 * Carga los datos del dashboard desde Supabase
 */
const loadDashboardData = async (): Promise<void> => {
  try {
    isLoading.value = true

    const [accommodationsResult, tasksResult, costsResult] = await Promise.all([
      supabase.from('accommodations').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('status'),
      supabase
        .from('costs')
        .select('amount')
        .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    ])

    // Contar alojamientos
    stats.value.accommodations = accommodationsResult.count || 0

    // Contar tareas por estado
    if (tasksResult.data) {
      stats.value.totalTasks = tasksResult.data.length
      stats.value.pendingTasks = tasksResult.data.filter((t) => t.status === 'pending').length
      stats.value.inProgressTasks = tasksResult.data.filter(
        (t) => t.status === 'in_progress',
      ).length
      stats.value.completedTasks = tasksResult.data.filter((t) => t.status === 'completed').length
    }

    // Calcular costo mensual
    if (costsResult.data) {
      stats.value.monthlyCost = costsResult.data.reduce((sum, cost) => sum + cost.amount, 0)
    }
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al cargar los datos del dashboard')
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresca los datos del dashboard
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await loadDashboardData()
  isRefreshing.value = false
  toast.success('Dashboard actualizado')
}

/**
 * Porcentaje de tareas completadas
 */
const completionRate = computed(() => {
  if (stats.value.totalTasks === 0) return 0
  return Math.round((stats.value.completedTasks / stats.value.totalTasks) * 100)
})

/**
 * Tarjetas del dashboard
 */
const dashboardCards = computed(() => [
  {
    title: 'Alojamientos',
    description: 'Total de propiedades',
    value: stats.value.accommodations,
    icon: Building2,
    trend: 'Activos en el sistema',
    action: () => router.push('/accommodations'),
  },
  {
    title: 'Tareas Pendientes',
    description: 'Requieren atención',
    value: stats.value.pendingTasks,
    icon: ListTodo,
    trend: `${Math.round((stats.value.pendingTasks / stats.value.totalTasks) * 100)}% del total`,
    variant: 'destructive' as const,
    action: () => router.push('/tasks?status=pending'),
  },
  {
    title: 'En Progreso',
    description: 'Tareas activas',
    value: stats.value.inProgressTasks,
    icon: Clock,
    trend: 'Siendo atendidas',
    variant: 'default' as const,
    action: () => router.push('/tasks?status=in_progress'),
  },
  {
    title: 'Completadas',
    description: 'Este mes',
    value: stats.value.completedTasks,
    icon: CheckCircle2,
    trend: `${completionRate.value}% tasa de éxito`,
    variant: 'secondary' as const,
    action: () => router.push('/tasks?status=completed'),
  },
])

/**
 * Formatea moneda en EUR
 */
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

/**
 * Acciones rápidas del dashboard
 */
const quickActions = [
  {
    label: 'Ver Alojamientos',
    icon: Building2,
    route: '/accommodations',
  },
  {
    label: 'Gestionar Tareas',
    icon: ListTodo,
    route: '/tasks',
  },
  {
    label: 'Ver Costos',
    icon: Euro,
    route: '/costs',
  },
  {
    label: 'Actualizar Datos',
    icon: RefreshCw,
    action: handleRefresh,
  },
]

onMounted(async () => {
  await loadDashboardData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground mt-1">
          Resumen general del sistema de gestión de mantenimiento
        </p>
      </div>
      <Button :disabled="isRefreshing" size="icon" variant="outline" @click="handleRefresh">
        <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
      </Button>
    </div>

    <Separator />

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton v-for="i in 4" :key="i" class="h-40 w-full" />
      </div>
      <Skeleton class="h-48 w-full" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-8">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          v-for="card in dashboardCards"
          :key="card.title"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="card.action"
        >
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              {{ card.title }}
            </CardTitle>
            <component :is="card.icon" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ card.value }}</div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ card.description }}
            </p>
            <div class="mt-3">
              <Badge :variant="card.variant || 'outline'" class="text-xs">
                {{ card.trend }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Monthly Cost Card -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Costo Mensual</CardTitle>
              <CardDescription>Gastos acumulados del mes actual</CardDescription>
            </div>
            <Euro class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-bold text-primary">
            {{ formatCurrency(stats.monthlyCost) }}
          </div>
          <p class="text-sm text-muted-foreground mt-2">
            Basado en {{ stats.completedTasks }} tareas completadas este mes
          </p>
          <Separator class="my-4" />
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold">{{ stats.totalTasks }}</p>
              <p class="text-xs text-muted-foreground">Total Tareas</p>
            </div>
            <div>
              <p class="text-2xl font-bold">{{ completionRate }}%</p>
              <p class="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stats.monthlyCost > 0 ? formatCurrency(stats.monthlyCost / stats.completedTasks) : '€0.00' }}
              </p>
              <p class="text-xs text-muted-foreground">Promedio/Tarea</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del sistema</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <component
            :is="action.route ? 'RouterLink' : 'button'"
            v-for="action in quickActions"
            :key="action.label"
            :to="action.route"
            class="flex flex-col items-center justify-center p-6 rounded-lg border border-border hover:bg-muted transition-colors"
            @click="action.action"
          >
            <component :is="action.icon" class="h-8 w-8 mb-2 text-primary" />
            <span class="text-sm font-medium text-center">{{ action.label }}</span>
          </component>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
