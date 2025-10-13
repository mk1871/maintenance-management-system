import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { costService, type Cost } from '@/composables/costService'
import { toast } from 'vue-sonner'

export const useCostsStore = defineStore('costs', () => {
  // Estado
  const costs = ref<Cost[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalCosts = computed(() => {
    return costs.value.reduce((sum, cost) => sum + cost.amount, 0)
  })

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

  const annualCosts = computed(() => {
    const currentYear = new Date().getFullYear()

    return costs.value
      .filter((cost) => {
        const costDate = new Date(cost.expense_date)
        return costDate.getFullYear() === currentYear
      })
      .reduce((sum, cost) => sum + cost.amount, 0)
  })

  const averagePerTask = computed(() => {
    if (costs.value.length === 0) return 0
    const uniqueTasks = new Set(costs.value.map((cost) => cost.task_id))
    return totalCosts.value / uniqueTasks.size
  })

  const costCount = computed(() => costs.value.length)

  // Actions
  const fetchCosts = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      costs.value = await costService.getAll()
    } catch (err: unknown) {
      error.value = 'Error al cargar costos'
      console.error(err)
      toast.error('Error al cargar los costos')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createCost = async (
    costData: Omit<Cost, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Cost> => {
    try {
      error.value = null
      const newCost = await costService.create(costData)
      costs.value.unshift(newCost)
      toast.success('Costo registrado exitosamente')
      return newCost
    } catch (err: unknown) {
      error.value = 'Error al crear costo'
      console.error(err)
      toast.error('Error al registrar el costo')
      throw err
    }
  }

  const updateCost = async (id: string, data: Partial<Cost>): Promise<void> => {
    try {
      error.value = null
      const updated = await costService.update({ id, ...data })
      const index = costs.value.findIndex((cost) => cost.id === id)
      if (index !== -1) {
        costs.value[index] = updated
      }
      toast.success('Costo actualizado')
    } catch (err: unknown) {
      error.value = 'Error al actualizar costo'
      console.error(err)
      toast.error('Error al actualizar el costo')
      throw err
    }
  }

  const deleteCost = async (id: string): Promise<void> => {
    try {
      error.value = null
      await costService.delete(id)
      costs.value = costs.value.filter((cost) => cost.id !== id)
      toast.success('Costo eliminado')
    } catch (err: unknown) {
      error.value = 'Error al eliminar costo'
      console.error(err)
      toast.error('Error al eliminar el costo')
      throw err
    }
  }

  return {
    // State
    costs,
    isLoading,
    error,
    // Getters
    totalCosts,
    monthlyCosts,
    annualCosts,
    averagePerTask,
    costCount,
    // Actions
    fetchCosts,
    createCost,
    updateCost,
    deleteCost,
  }
})
