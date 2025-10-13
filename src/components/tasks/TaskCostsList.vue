<script lang="ts" setup>
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { DollarSign, Plus, Receipt } from 'lucide-vue-next'
import type { Cost } from '@/composables/costService'

const props = defineProps<{
  costs: Cost[]
}>()

const emit = defineEmits<{
  (e: 'add-cost'): void
}>()

const totalCost = computed(() => {
  return props.costs.reduce((sum, cost) => sum + cost.amount, 0)
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCostCategory = (category: string): string => {
  const categories: Record<string, string> = {
    materials: 'Materiales',
    labor: 'Mano de Obra',
    tools: 'Herramientas',
    transport: 'Transporte',
    other: 'Otros',
  }
  return categories[category] || category
}

const getCategoryVariant = (category: string): 'default' | 'secondary' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    materials: 'default',
    labor: 'secondary',
    tools: 'outline',
    transport: 'outline',
    other: 'outline',
  }
  return variants[category] ?? 'outline'
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <DollarSign class="h-5 w-5" />
          Costos Asociados
        </CardTitle>
        <Button size="sm" @click="emit('add-cost')">
          <Plus class="h-4 w-4 mr-2" />
          Agregar Costo
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Empty State -->
      <div v-if="costs.length === 0">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt class="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>No hay costos registrados</EmptyTitle>
            <EmptyDescription> Los costos asociados a esta tarea aparecerán aquí </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <!-- Costs Table -->
      <div v-else class="space-y-4">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead class="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cost in costs" :key="cost.id">
                <TableCell class="font-medium">{{ formatDate(cost.expense_date) }}</TableCell>
                <TableCell>{{ cost.description || 'Sin descripción' }}</TableCell>
                <TableCell>
                  <Badge :variant="getCategoryVariant(cost.category)">
                    {{ formatCostCategory(cost.category) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatCurrency(cost.amount) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span class="text-sm font-medium">Total de Costos:</span>
          <span class="text-2xl font-bold">{{ formatCurrency(totalCost) }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
