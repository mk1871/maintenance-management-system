import { ref, computed } from 'vue'
import { taskService } from './taskService'
import { accommodationService } from './accommodationService'
import { costService } from './costService'
import type { Task } from './taskService'
import type { Accommodation } from './accommodationService'

/**
 * Interface para estadísticas del dashboard
 */
export interface DashboardStats {
  totalTasks: number
  pendingTasks: number
  completedTasks: number
  inProgressTasks: number
  completionRate: number
  totalAccommodations: number
  activeAccommodations: number
  monthlyCost: number
  averageCostPerTask: number
  highPriorityTasks: number
  overdueTasksCount: number
}

/**
 * Interface para tarea con detalles de accommodation
 */
interface TaskWithAccommodation extends Task {
  accommodation?: {
    code: string
    name: string
  }
}

/**
 * Composable para estadísticas del dashboard
 */
export const useDashboardStats = () => {
  const stats = ref<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    totalAccommodations: 0,
    activeAccommodations: 0,
    monthlyCost: 0,
    averageCostPerTask: 0,
    highPriorityTasks: 0,
    overdueTasksCount: 0,
  })

  const isLoading = ref(false)
  const recentTasks = ref<TaskWithAccommodation[]>([])
  const accommodations = ref<Accommodation[]>([])

  /**
   * Tareas vencidas (overdue)
   */
  const overdueTasks = computed((): TaskWithAccommodation[] => {
    return filterOverdueTasks()
  })

  /**
   * Carga todas las estadísticas del dashboard
   */
  const loadDashboardData = async (): Promise<void> => {
    isLoading.value = true
    try {
      await Promise.all([loadTasks(), loadAccommodations(), loadCosts()])

      calculateStats()
    } catch (error: unknown) {
      console.error('Error loading dashboard data:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Carga todas las tareas
   */
  const loadTasks = async (): Promise<void> => {
    const tasks = await taskService.getAll()
    recentTasks.value = tasks.slice(0, 10) as TaskWithAccommodation[]
  }

  /**
   * Carga todos los accommodations
   */
  const loadAccommodations = async (): Promise<void> => {
    accommodations.value = await accommodationService.getAll()
  }

  /**
   * Carga costos del mes actual
   */
  const loadCosts = async (): Promise<void> => {
    const allCosts = await costService.getAll()
    const { startDate, endDate } = getCurrentMonthRange()

    // Filtrar costos del mes actual
    const monthlyCosts = filterCostsByDateRange(allCosts, startDate, endDate)

    stats.value.monthlyCost = calculateTotalCost(monthlyCosts)
  }

  /**
   * Filtra costos por rango de fechas
   */
  const filterCostsByDateRange = (
    costs: Array<{ created_at: string; amount: number }>,
    startDate: string,
    endDate: string,
  ): Array<{ amount: number }> => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return costs.filter((cost) => {
      const costDate = new Date(cost.created_at)
      return costDate >= start && costDate <= end
    })
  }

  /**
   * Calcula todas las estadísticas
   */
  const calculateStats = (): void => {
    calculateTaskStats()
    calculateAccommodationStats()
    calculateCostStats()
  }

  /**
   * Calcula estadísticas de tareas
   */
  const calculateTaskStats = (): void => {
    const tasks = recentTasks.value

    stats.value.totalTasks = tasks.length
    stats.value.pendingTasks = countTasksByStatus(tasks, 'pending')
    stats.value.completedTasks = countTasksByStatus(tasks, 'completed')
    stats.value.inProgressTasks = countTasksByStatus(tasks, 'in_progress')
    stats.value.highPriorityTasks = countTasksByPriority(tasks, 'high')
    stats.value.overdueTasksCount = filterOverdueTasks().length
    stats.value.completionRate = calculateCompletionRate()
  }

  /**
   * Calcula estadísticas de accommodations
   */
  const calculateAccommodationStats = (): void => {
    stats.value.totalAccommodations = accommodations.value.length
    stats.value.activeAccommodations = countActiveAccommodations()
  }

  /**
   * Calcula estadísticas de costos
   */
  const calculateCostStats = (): void => {
    const completed = stats.value.completedTasks
    stats.value.averageCostPerTask = completed > 0 ? stats.value.monthlyCost / completed : 0
  }

  /**
   * Cuenta tareas por estado
   */
  const countTasksByStatus = (tasks: Task[], status: string): number => {
    return tasks.filter((task) => task.status === status).length
  }

  /**
   * Cuenta tareas por prioridad
   */
  const countTasksByPriority = (tasks: Task[], priority: string): number => {
    return tasks.filter((task) => task.priority === priority).length
  }

  /**
   * Cuenta accommodations activos
   */
  const countActiveAccommodations = (): number => {
    return accommodations.value.filter((acc) => acc.status === 'active').length
  }

  /**
   * Calcula tasa de completitud
   */
  const calculateCompletionRate = (): number => {
    const total = stats.value.totalTasks
    if (total === 0) return 0

    return Math.round((stats.value.completedTasks / total) * 100)
  }

  /**
   * Filtra tareas vencidas
   */
  const filterOverdueTasks = (): TaskWithAccommodation[] => {
    const now = new Date()

    return recentTasks.value.filter((task) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        return false
      }

      const dueDate = new Date(task.due_date)
      return dueDate < now
    })
  }

  /**
   * Obtiene rango del mes actual
   */
  const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      startDate: formatDateToISO(startDate),
      endDate: formatDateToISO(endDate),
    }
  }

  /**
   * Formatea fecha a ISO string (YYYY-MM-DD)
   */
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  /**
   * Calcula costo total de un array de costos
   */
  const calculateTotalCost = (costs: Array<{ amount: number }>): number => {
    return costs.reduce((sum, cost) => sum + cost.amount, 0)
  }

  /**
   * Formatea moneda a EUR
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return {
    stats,
    isLoading,
    recentTasks,
    overdueTasks,
    accommodations,
    loadDashboardData,
    formatCurrency,
  }
}
