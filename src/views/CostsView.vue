<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  CalendarIcon,
} from 'lucide-vue-next'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { costService, type Cost } from '@/composables/costService'
import { accommodationService, type Accommodation } from '@/composables/accommodationService'
import {
  exportToCSV,
  exportToPDF,
  formatDateForExport,
  formatCurrencyForExport,
  generateFilename,
} from '@/lib/exportUtils'

const router = useRouter()

// Configuración
const LOCALE = 'es-ES'
const TIME_ZONE = getLocalTimeZone()
const dateFormatter = new DateFormatter(LOCALE, { dateStyle: 'medium' })

// Estado de datos
const costs = ref<Cost[]>([])
const accommodations = ref<Accommodation[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)

// Filtros - usar unknown como en TaskForm
const filters = ref({
  startDate: undefined as unknown,
  endDate: undefined as unknown,
  accommodationId: 'all',
  category: 'all',
  minAmount: '',
})

/**
 * Maneja cambio de fecha de inicio
 */
const handleStartDateChange = (value: DateValue | undefined): void => {
  filters.value.startDate = value
}

/**
 * Maneja cambio de fecha de fin
 */
const handleEndDateChange = (value: DateValue | undefined): void => {
  filters.value.endDate = value
}

/**
 * Carga los datos iniciales
 */
const loadData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const [costsData, accommodationsData] = await Promise.all([
      costService.getAll(),
      accommodationService.getAll(),
    ])
    costs.value = costsData
    accommodations.value = accommodationsData
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al cargar los costos')
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresca los datos
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await loadData()
  isRefreshing.value = false
  toast.success('Costos actualizados')
}

/**
 * Limpia los filtros
 */
const clearFilters = (): void => {
  filters.value = {
    startDate: undefined,
    endDate: undefined,
    accommodationId: 'all',
    category: 'all',
    minAmount: '',
  }
}

/**
 * Costos filtrados según criterios
 */
const filteredCosts = computed(() => {
  let result = [...costs.value]

  if (filters.value.startDate) {
    const startDate = (filters.value.startDate as DateValue).toDate(TIME_ZONE)
    result = result.filter((cost) => new Date(cost.expense_date) >= startDate)
  }

  if (filters.value.endDate) {
    const endDate = (filters.value.endDate as DateValue).toDate(TIME_ZONE)
    endDate.setHours(23, 59, 59, 999)
    result = result.filter((cost) => new Date(cost.expense_date) <= endDate)
  }

  if (filters.value.accommodationId !== 'all') {
    result = result.filter((cost) => cost.accommodation_id === filters.value.accommodationId)
  }

  if (filters.value.category !== 'all') {
    result = result.filter((cost) => cost.category === filters.value.category)
  }

  if (filters.value.minAmount) {
    const minAmount = parseFloat(filters.value.minAmount)
    result = result.filter((cost) => cost.amount >= minAmount)
  }

  return result
})

/**
 * Total de todos los costos
 */
const totalCosts = computed(() => {
  return costs.value.reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Costos del mes actual
 */
const monthlyCosts = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return costs.value
    .filter((cost) => {
      const costDate = new Date(cost.expense_date)
      return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Costos del año actual
 */
const annualCosts = computed(() => {
  const currentYear = new Date().getFullYear()

  return costs.value
    .filter((cost) => {
      const costDate = new Date(cost.expense_date)
      return costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Promedio de costo por tarea única
 */
const averagePerTask = computed(() => {
  if (costs.value.length === 0) return 0
  const uniqueTasks = new Set(costs.value.map((cost) => cost.task_id))
  return totalCosts.value / uniqueTasks.size
})

/**
 * Total de costos filtrados
 */
const filteredTotal = computed(() => {
  return filteredCosts.value.reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Formatea fecha a texto local
 */
const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Obtiene el código del alojamiento
 */
const getAccommodationCode = (accommodationId: string): string => {
  const accommodation = accommodations.value.find((acc) => acc.id === accommodationId)
  return accommodation?.code ?? 'N/A'
}

/**
 * Formatea la categoría del costo a español
 */
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

/**
 * Retorna variante de badge según categoría
 */
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

/**
 * Navega al detalle de la tarea
 */
const viewTask = (taskId: string): void => {
  router.push(`/tasks/${taskId}`)
}

/**
 * Exporta los costos filtrados a CSV
 */
const handleExportCSV = (): void => {
  try {
    if (filteredCosts.value.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const exportData = filteredCosts.value.map((cost) => ({
      fecha: formatDateForExport(cost.expense_date),
      alojamiento: getAccommodationCode(cost.accommodation_id),
      tarea: cost.task_id.substring(0, 8),
      descripcion: cost.description || 'Sin descripción',
      cantidad: formatCurrencyForExport(cost.amount),
      categoria: formatCostCategory(cost.category),
    }))

    const headers = {
      fecha: 'Fecha',
      alojamiento: 'Alojamiento',
      tarea: 'Tarea ID',
      descripcion: 'Descripción',
      cantidad: 'Cantidad (€)',
      categoria: 'Categoría',
    }

    const filename = generateFilename('costos')
    exportToCSV(exportData, filename, headers)

    toast.success('CSV exportado exitosamente')
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al exportar CSV')
  }
}

/**
 * Exporta los costos filtrados a PDF
 */
const handleExportPDF = (): void => {
  try {
    if (filteredCosts.value.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const exportData = filteredCosts.value.map((cost) => ({
      fecha: formatDateForExport(cost.expense_date),
      alojamiento: getAccommodationCode(cost.accommodation_id),
      tarea: cost.task_id.substring(0, 8),
      descripcion: cost.description || 'Sin descripción',
      cantidad: `€${formatCurrencyForExport(cost.amount)}`,
      categoria: formatCostCategory(cost.category),
    }))

    const headers = ['Fecha', 'Alojamiento', 'Tarea', 'Descripción', 'Cantidad', 'Categoría']
    const columns = ['fecha', 'alojamiento', 'tarea', 'descripcion', 'cantidad', 'categoria']
    const title = 'Reporte de Costos'
    const subtitle = `Total de registros: ${filteredCosts.value.length}`
    const filename = generateFilename('costos')

    exportToPDF(exportData, filename, title, headers, columns, filteredTotal.value, subtitle)

    toast.success('PDF exportado exitosamente')
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al exportar PDF')
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="container mx-auto py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Costos</h1>
        <p class="text-muted-foreground mt-1">
          Gestiona y analiza todos los costos de mantenimiento
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button :disabled="isRefreshing" size="icon" variant="outline" @click="handleRefresh">
          <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
        </Button>
        <Button variant="outline" @click="handleExportCSV">
          <FileSpreadsheet class="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button variant="outline" @click="handleExportPDF">
          <FileText class="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>
    </div>

    <!-- Filtros -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Filter class="h-5 w-5" />
          Filtros
        </CardTitle>
        <CardDescription>Filtra los costos según tus criterios</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Fecha inicio -->
          <div class="space-y-2">
            <Label>Fecha Inicio</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !filters.startDate && 'text-muted-foreground',
                    )
                  "
                  type="button"
                  variant="outline"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    filters.startDate
                      ? dateFormatter.format((filters.startDate as DateValue).toDate(TIME_ZONE))
                      : 'Seleccionar fecha'
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" class="w-auto p-0">
                <Calendar
                  :locale="'es'"
                  :model-value="filters.startDate as DateValue"
                  initial-focus
                  @update:model-value="handleStartDateChange"
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Fecha fin -->
          <div class="space-y-2">
            <Label>Fecha Fin</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !filters.endDate && 'text-muted-foreground',
                    )
                  "
                  type="button"
                  variant="outline"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    filters.endDate
                      ? dateFormatter.format((filters.endDate as DateValue).toDate(TIME_ZONE))
                      : 'Seleccionar fecha'
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" class="w-auto p-0">
                <Calendar
                  :locale="'es'"
                  :model-value="filters.endDate as DateValue"
                  initial-focus
                  @update:model-value="handleEndDateChange"
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Alojamiento -->
          <div class="space-y-2">
            <Label>Alojamiento</Label>
            <Select v-model="filters.accommodationId">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem v-for="acc in accommodations" :key="acc.id" :value="acc.id">
                  {{ acc.code }} - {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Categoría -->
          <div class="space-y-2">
            <Label>Categoría</Label>
            <Select v-model="filters.category">
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="materials">Materiales</SelectItem>
                <SelectItem value="labor">Mano de Obra</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Monto mínimo y botones -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div class="space-y-2">
            <Label>Monto Mínimo (€)</Label>
            <Input v-model="filters.minAmount" placeholder="0.00" step="0.01" type="number" />
          </div>
          <div class="md:col-span-3 flex items-end justify-end gap-2">
            <Button variant="ghost" @click="clearFilters">Limpiar filtros</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton v-for="i in 4" :key="i" class="h-32 w-full" />
      </div>
      <Skeleton class="h-96 w-full" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Tarjetas resumen -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">€{{ totalCosts.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Todos los tiempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">€{{ monthlyCosts.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Mes actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">Este Año</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">€{{ annualCosts.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Año actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">
              Promedio/Tarea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">€{{ averagePerTask.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">Por reparación</p>
          </CardContent>
        </Card>
      </div>

      <!-- Tabla de costos -->
      <Card>
        <CardHeader>
          <CardTitle>Lista de Costos</CardTitle>
          <CardDescription>{{ filteredCosts.length }} costo(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="filteredCosts.length > 0" class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Alojamiento</TableHead>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead class="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="cost in filteredCosts" :key="cost.id" class="hover:bg-muted/50">
                  <TableCell>{{ formatDate(cost.expense_date) }}</TableCell>
                  <TableCell class="font-medium">
                    {{ getAccommodationCode(cost.accommodation_id) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      class="p-0 h-auto"
                      size="sm"
                      variant="link"
                      @click="viewTask(cost.task_id)"
                    >
                      #{{ cost.task_id.substring(0, 8) }}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="getCategoryVariant(cost.category)">
                      {{ formatCostCategory(cost.category) }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div :title="cost.description" class="max-w-xs truncate">
                      {{ cost.description || 'Sin descripción' }}
                    </div>
                  </TableCell>
                  <TableCell class="text-right font-medium"
                    >€{{ cost.amount.toFixed(2) }}</TableCell
                  >
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell class="text-right font-bold" colspan="5">Total Filtrado:</TableCell>
                  <TableCell class="text-right font-bold"
                    >€{{ filteredTotal.toFixed(2) }}</TableCell
                  >
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <div v-else class="text-center py-12 text-muted-foreground">
            <Download class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No hay costos con los filtros aplicados</p>
            <Button class="mt-4" variant="outline" @click="clearFilters">Limpiar filtros</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
