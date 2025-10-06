<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  Building2Icon,
  ListTodoIcon,
  ClockIcon,
  EuroIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircle2Icon,
} from 'lucide-vue-next'

interface DashboardStats {
  accommodations: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  monthlyCost: number
}

const isLoading = ref(true)
const stats = ref<DashboardStats>({
  accommodations: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  monthlyCost: 0,
})

const loadDashboardData = async () => {
  isLoading.value = true
  try {
    // Obtener estadísticas reales de la base de datos
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
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

const dashboardCards = [
  {
    title: 'Alojamientos',
    description: 'Total de propiedades',
    value: () => stats.value.accommodations,
    icon: Building2Icon,
    trend: '+2 este mes',
    trendUp: true,
  },
  {
    title: 'Tareas Pendientes',
    description: 'Requieren atención',
    value: () => stats.value.pendingTasks,
    icon: ListTodoIcon,
    trend: '-3 vs semana pasada',
    trendUp: false,
  },
  {
    title: 'En Progreso',
    description: 'Tareas activas',
    value: () => stats.value.inProgressTasks,
    icon: ClockIcon,
    trend: '+2 hoy',
    trendUp: true,
  },
  {
    title: 'Completadas',
    description: 'Este mes',
    value: () => stats.value.completedTasks,
    icon: CheckCircle2Icon,
    trend: '+12 vs mes anterior',
    trendUp: true,
  },
]
</script>

<template>
  <div class="container mx-auto py-6 space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
      <p class="text-muted-foreground mt-2">
        Resumen general del sistema de gestión de mantenimiento
      </p>
    </div>

    <Separator />

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner class="h-8 w-8" />
    </div>

    <div v-else class="space-y-8">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card v-for="card in dashboardCards" :key="card.title">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              {{ card.title }}
            </CardTitle>
            <component :is="card.icon" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ card.value() }}</div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ card.description }}
            </p>
            <div class="flex items-center gap-2 mt-3">
              <Badge :variant="card.trendUp ? 'default' : 'secondary'" class="text-xs">
                <component
                  :is="card.trendUp ? TrendingUpIcon : TrendingDownIcon"
                  class="h-3 w-3 mr-1"
                />
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
            <EuroIcon class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-bold text-primary">
            {{ stats.monthlyCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) }}
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            Basado en {{ stats.completedTasks }} tareas completadas
          </p>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del sistema</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RouterLink
            class="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            to="/accommodations"
          >
            <Building2Icon class="h-8 w-8 mb-2 text-primary" />
            <span class="text-sm font-medium">Ver Alojamientos</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            to="/tasks"
          >
            <ListTodoIcon class="h-8 w-8 mb-2 text-primary" />
            <span class="text-sm font-medium">Gestionar Tareas</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            to="/costs"
          >
            <EuroIcon class="h-8 w-8 mb-2 text-primary" />
            <span class="text-sm font-medium">Ver Costos</span>
          </RouterLink>
          <button
            class="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            @click="loadDashboardData"
          >
            <CheckCircle2Icon class="h-8 w-8 mb-2 text-primary" />
            <span class="text-sm font-medium">Actualizar Datos</span>
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
