<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { Receipt, ExternalLink } from 'lucide-vue-next'
import type { Cost } from '@/composables/costService'
import type { Accommodation } from '@/composables/accommodationService'

const props = defineProps<{
  costs: Cost[]
  accommodations: Accommodation[]
  isLoading: boolean
}>()

const router = useRouter()

const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const getAccommodationCode = (accommodationId: string): string => {
  const accommodation = props.accommodations.find((acc) => acc.id === accommodationId)
  return accommodation?.code ?? 'N/A'
}

const formatCostCategory = (category: string): string => {
  const categories: Record<string, string> = {
    materials: 'Materiales',
    labor: 'Mano de Obra',
    tools: 'Herramientas',
    transport: 'Transporte',
    other: 'Otros',
  }
  return categories[category] ?? category
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

const filteredTotal = computed(() => {
  return props.costs.reduce((sum, cost) => sum + cost.amount, 0)
})

const handleViewTask = (taskId: string): void => {
  router.push(`/tasks/${taskId}`)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Detalle de Costos</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
      </div>

      <!-- Empty State -->
      <div v-else-if="costs.length === 0">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt class="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>No hay costos</EmptyTitle>
            <EmptyDescription>
              No se encontraron costos con los filtros aplicados
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <!-- Table -->
      <div v-else class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Alojamiento</TableHead>
              <TableHead>Tarea</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead class="text-right">Importe</TableHead>
              <TableHead class="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="cost in costs" :key="cost.id">
              <TableCell class="font-medium">{{ formatDate(cost.expense_date) }}</TableCell>
              <TableCell>{{ getAccommodationCode(cost.accommodation_id) }}</TableCell>
              <TableCell class="font-mono text-xs">
                {{ cost.task_id.substring(0, 8) }}
              </TableCell>
              <TableCell>{{ cost.description || 'Sin descripción' }}</TableCell>
              <TableCell>
                <Badge :variant="getCategoryVariant(cost.category)">
                  {{ formatCostCategory(cost.category) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right font-medium">
                {{ formatCurrency(cost.amount) }}
              </TableCell>
              <TableCell class="text-center">
                <Button
                  aria-label="Ver tarea"
                  size="icon"
                  variant="ghost"
                  @click="handleViewTask(cost.task_id)"
                >
                  <ExternalLink class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell class="text-right font-semibold" colspan="5">Total:</TableCell>
              <TableCell class="text-right font-bold text-lg">
                {{ formatCurrency(filteredTotal) }}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
