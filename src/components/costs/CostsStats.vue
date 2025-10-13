<script lang="ts" setup>
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, DollarSign, BarChart3 } from 'lucide-vue-next'
import type { Cost } from '@/composables/costService'

const props = defineProps<{
  costs: Cost[]
}>()

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const totalCosts = computed(() => {
  return props.costs.reduce((sum, cost) => sum + cost.amount, 0)
})

const monthlyCosts = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return props.costs
    .filter((cost) => {
      const costDate = new Date(cost.expense_date)
      return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

const annualCosts = computed(() => {
  const currentYear = new Date().getFullYear()

  return props.costs
    .filter((cost) => {
      const costDate = new Date(cost.expense_date)
      return costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

const averagePerTask = computed(() => {
  if (props.costs.length === 0) return 0
  const uniqueTasks = new Set(props.costs.map((cost) => cost.task_id))
  return totalCosts.value / uniqueTasks.size
})
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Total General -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total General</CardTitle>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(totalCosts) }}</div>
        <p class="text-xs text-muted-foreground mt-1">
          {{ costs.length }} {{ costs.length === 1 ? 'registro' : 'registros' }}
        </p>
      </CardContent>
    </Card>

    <!-- Mes Actual -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Mes Actual</CardTitle>
        <Calendar class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(monthlyCosts) }}</div>
        <p class="text-xs text-muted-foreground mt-1">
          {{ new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
        </p>
      </CardContent>
    </Card>

    <!-- Año Actual -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Año Actual</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(annualCosts) }}</div>
        <p class="text-xs text-muted-foreground mt-1">
          {{ new Date().getFullYear() }}
        </p>
      </CardContent>
    </Card>

    <!-- Promedio por Tarea -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Promedio por Tarea</CardTitle>
        <BarChart3 class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(averagePerTask) }}</div>
        <p class="text-xs text-muted-foreground mt-1">Por tarea única</p>
      </CardContent>
    </Card>
  </div>
</template>
