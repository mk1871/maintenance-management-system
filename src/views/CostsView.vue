<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { DateValue } from '@internationalized/date'
import { getLocalTimeZone } from '@internationalized/date'

import CostsHeader from '@/components/costs/CostsHeader.vue'
import CostsFilters from '@/components/costs/CostsFilters.vue'
import CostsStats from '@/components/costs/CostsStats.vue'
import CostsTable from '@/components/costs/CostsTable.vue'

import { useCostsStore } from '@/stores/costs'
import { useAccommodationsStore } from '@/stores/accommodations'
import {
  exportToCSV,
  exportToPDF,
  formatDateForExport,
  formatCurrencyForExport,
  generateFilename,
} from '@/lib/exportUtils'

const TIME_ZONE = getLocalTimeZone()

const costsStore = useCostsStore()
const accommodationsStore = useAccommodationsStore()

const isRefreshing = ref(false)

// Filtros
const filters = ref({
  startDate: undefined as DateValue | undefined,
  endDate: undefined as DateValue | undefined,
  accommodationId: 'all',
  category: 'all',
  minAmount: '',
})

// Computed values con type assertion correcta
const startDateValue = computed<DateValue | undefined>(() => filters.value.startDate as DateValue | undefined)
const endDateValue = computed<DateValue | undefined>(() => filters.value.endDate as DateValue | undefined)

/**
 * Refresca los datos
 */
const handleRefresh = async (): Promise<void> => {
  isRefreshing.value = true
  await costsStore.fetchCosts()
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
  let result = [...costsStore.costs]

  if (filters.value.startDate) {
    const startDate = filters.value.startDate.toDate(TIME_ZONE)
    result = result.filter((cost) => new Date(cost.expense_date) >= startDate)
  }

  if (filters.value.endDate) {
    const endDate = filters.value.endDate.toDate(TIME_ZONE)
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
 * Total de costos filtrados
 */
const filteredTotal = computed(() => {
  return filteredCosts.value.reduce((sum, cost) => sum + cost.amount, 0)
})

/**
 * Obtiene el código del alojamiento
 */
const getAccommodationCode = (accommodationId: string): string => {
  const accommodation = accommodationsStore.accommodations.find((acc) => acc.id === accommodationId)
  return accommodation?.code ?? 'N/A'
}

/**
 * Formatea la categoría del costo
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
  await Promise.all([
    costsStore.fetchCosts(),
    accommodationsStore.fetchAccommodations(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <CostsHeader
      :is-refreshing="isRefreshing"
      @refresh="handleRefresh"
      @export-csv="handleExportCSV"
      @export-pdf="handleExportPDF"
    />

    <CostsFilters
      :accommodation-id="filters.accommodationId"
      :accommodations="accommodationsStore.accommodations"
      :category="filters.category"
      :end-date="endDateValue"
      :min-amount="filters.minAmount"
      :start-date="startDateValue"
      @clear="clearFilters"
      @update:start-date="(val) => (filters.startDate = val)"
      @update:end-date="(val) => (filters.endDate = val)"
      @update:accommodation-id="(val) => (filters.accommodationId = val)"
      @update:category="(val) => (filters.category = val)"
      @update:min-amount="(val) => (filters.minAmount = String(val))"
    />

    <CostsStats :costs="costsStore.costs" />

    <CostsTable
      :accommodations="accommodationsStore.accommodations"
      :costs="filteredCosts"
      :is-loading="costsStore.isLoading"
    />
  </div>
</template>
