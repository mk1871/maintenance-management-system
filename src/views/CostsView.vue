<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { FileSpreadsheet, FileText, Filter, RefreshCw, CalendarIcon } from 'lucide-vue-next'
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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

// Estados del Popover para control de cierre automático
const isStartDateOpen = ref(false)
const isEndDateOpen = ref(false)

// Filtros
const filters = ref({
  startDate: undefined as unknown,
  endDate: undefined as unknown,
  accommodationId: 'all',
  category: 'all',
  minAmount: '',
})

/**
 * Maneja cambio de fecha de inicio y cierra el popover
 */
const handleStartDateChange = (value: DateValue | undefined): void => {
  filters.value.startDate = value
  isStartDateOpen.value = false
}

/**
 * Maneja cambio de fecha de fin y cierra el popover
 */
const handleEndDateChange = (value: DateValue | undefined): void => {
  filters.value.endDate = value
  isEndDateOpen.value = false
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
    toast.error('Error al cargar datos')
  } finally {
    isLoading.value = false
  }
}

/**
 * Refresca los datos
 */
const handleRefresh = async (): Promise<void> => {
  try {
    isRefreshing.value = true
    await loadData()
    toast.success('Datos actualizados')
  } catch (error: unknown) {
    console.error(error)
    toast.error('Error al actualizar datos')
  } finally {
    isRefreshing.value = false
  }
}

/**
 * Filtra los costos según los filtros aplicados
 */
const filteredCosts = computed((): Cost[] => {
  return costs.value.filter((cost) => {
    // Filtro por fecha de inicio
    if (filters.value.startDate) {
      const startDate = (filters.value.startDate as DateValue).toDate(TIME_ZONE)
      const costDate = new Date(cost.expense_date)
      if (costDate < startDate) return false
    }

    // Filtro por fecha de fin
    if (filters.value.endDate) {
      const endDate = (filters.value.endDate as DateValue).toDate(TIME_ZONE)
      const costDate = new Date(cost.expense_date)
      if (costDate > endDate) return false
    }

    // Filtro por alojamiento
    if (filters.value.accommodationId !== 'all') {
      if (cost.accommodation_id !== filters.value.accommodationId) return false
    }

    // Filtro por categoría
    if (filters.value.category !== 'all') {
      if (cost.category !== filters.value.category) return false
    }

    // Filtro por monto mínimo
    if (filters.value.minAmount && filters.value.minAmount !== '') {
      const minAmount = parseFloat(filters.value.minAmount)
      if (!isNaN(minAmount) && cost.amount < minAmount) return false
    }

    return true
  })
})

/**
 * Calcula el total de los costos filtrados
 */
const filteredTotal = computed((): number => {
  return filteredCosts.value.reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Formatea moneda
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Formatea fecha
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Obtiene el código del alojamiento
 */
const getAccommodationCode = (accommodationId: string): string => {
  const accommodation = accommodations.value.find((a) => a.id === accommodationId)
  return accommodation?.code || 'N/A'
}

/**
 * Formatea categoría de costo
 */
const formatCostCategory = (category: string): string => {
  const categories: Record<string, string> = {
    materials: 'Materiales',
    labor: 'Mano de obra',
    tools: 'Herramientas',
    transport: 'Transporte',
    other: 'Otros',
  }
  return categories[category] || category
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Costos</h1>
        <p class="text-muted-foreground">Gestión y seguimiento de gastos</p>
      </div>
      <div class="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="isRefreshing || filteredCosts.length === 0"
                aria-label="Exportar a CSV"
                size="icon"
                variant="outline"
                @click="handleExportCSV"
              >
                <FileSpreadsheet class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exportar a CSV (Excel)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="isRefreshing || filteredCosts.length === 0"
                aria-label="Exportar a PDF"
                size="icon"
                variant="outline"
                @click="handleExportPDF"
              >
                <FileText class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exportar a PDF</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="isRefreshing"
                aria-label="Actualizar datos"
                size="icon"
                variant="outline"
                @click="handleRefresh"
              >
                <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualizar datos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Filtros -->
    <Card>
      <CardHeader>
        <CardTitle>
          <Filter class="inline-block h-5 w-5 mr-2" />
          Filtros
        </CardTitle>
        <CardDescription>Filtra los costos por fecha, alojamiento y categoría</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Fecha inicio -->
          <div class="space-y-2">
            <Label for="start-date">Fecha Inicio</Label>
            <Popover v-model:open="isStartDateOpen">
              <PopoverTrigger as-child>
                <Button
                  id="start-date"
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
            <Label for="end-date">Fecha Fin</Label>
            <Popover v-model:open="isEndDateOpen">
              <PopoverTrigger as-child>
                <Button
                  id="end-date"
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
            <Label for="accommodation-filter">Alojamiento</Label>
            <Select id="accommodation-filter" v-model="filters.accommodationId">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem
                  v-for="accommodation in accommodations"
                  :key="accommodation.id"
                  :value="accommodation.id"
                >
                  {{ accommodation.code }} - {{ accommodation.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Categoría -->
          <div class="space-y-2">
            <Label for="category-filter">Categoría</Label>
            <Select id="category-filter" v-model="filters.category">
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="materials">Materiales</SelectItem>
                <SelectItem value="labor">Mano de obra</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de Costos -->
    <Card>
      <CardHeader>
        <CardTitle>Costos Registrados</CardTitle>
        <CardDescription>
          {{ filteredCosts.length }} registro(s) - Total: {{ formatCurrency(filteredTotal) }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-4">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCosts.length === 0" class="text-center py-12 text-muted-foreground">
          <p>No se encontraron costos con los filtros aplicados</p>
        </div>

        <!-- Tabla -->
        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Alojamiento</TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead class="text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="cost in filteredCosts"
                :key="cost.id"
                class="cursor-pointer hover:bg-muted/50 transition-colors"
                @click="viewTask(cost.task_id)"
              >
                <TableCell>{{ formatDate(cost.expense_date) }}</TableCell>
                <TableCell class="font-mono text-sm">
                  {{ getAccommodationCode(cost.accommodation_id) }}
                </TableCell>
                <TableCell class="font-mono text-xs">
                  {{ cost.task_id.substring(0, 8) }}...
                </TableCell>
                <TableCell>{{ cost.description || 'Sin descripción' }}</TableCell>
                <TableCell>
                  <Badge :variant="getCategoryVariant(cost.category)">
                    {{ formatCostCategory(cost.category) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right font-semibold">
                  {{ formatCurrency(cost.amount) }}
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell class="text-right font-semibold" colspan="5">Total</TableCell>
                <TableCell class="text-right font-bold text-lg">
                  {{ formatCurrency(filteredTotal) }}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
