import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { taskService, type TaskWithRelations, type CreateTaskData } from '@/composables/taskService'
import { toast } from 'vue-sonner'

export const useTasksStore = defineStore('tasks', () => {
  // Estado
  const tasks = ref<TaskWithRelations[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const taskCount = computed(() => tasks.value.length)

  const pendingTasks = computed(() => tasks.value.filter((task) => task.status === 'pending'))

  const inProgressTasks = computed(() =>
    tasks.value.filter((task) => task.status === 'in_progress'),
  )

  const completedTasks = computed(() => tasks.value.filter((task) => task.status === 'completed'))

  const overdueTasks = computed(() =>
    tasks.value.filter((task) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        return false
      }
      return new Date(task.due_date) < new Date()
    }),
  )

  const stats = computed(() => ({
    total: taskCount.value,
    pending: pendingTasks.value.length,
    inProgress: inProgressTasks.value.length,
    completed: completedTasks.value.length,
    overdue: overdueTasks.value.length,
  }))

  // Actions
  const fetchTasks = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      tasks.value = await taskService.getAll()
    } catch (err: unknown) {
      error.value = 'Error al cargar tareas'
      console.error(err)
      toast.error('Error al cargar las tareas')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTask = async (taskData: CreateTaskData): Promise<TaskWithRelations> => {
    try {
      error.value = null
      const newTask = await taskService.create(taskData)
      tasks.value.unshift(newTask)
      toast.success('Tarea creada exitosamente')
      return newTask
    } catch (err: unknown) {
      error.value = 'Error al crear tarea'
      console.error(err)
      toast.error('Error al crear la tarea')
      throw err
    }
  }

  const updateTask = async (id: string, data: Partial<TaskWithRelations>): Promise<void> => {
    try {
      error.value = null
      const updated = await taskService.update({ id, ...data })
      const index = tasks.value.findIndex((task) => task.id === id)
      if (index !== -1) {
        tasks.value[index] = updated
      }
      toast.success('Tarea actualizada')
    } catch (err: unknown) {
      error.value = 'Error al actualizar tarea'
      console.error(err)
      toast.error('Error al actualizar la tarea')
      throw err
    }
  }

  const deleteTask = async (id: string): Promise<void> => {
    try {
      error.value = null
      await taskService.delete(id)
      tasks.value = tasks.value.filter((task) => task.id !== id)
      toast.success('Tarea eliminada')
    } catch (err: unknown) {
      error.value = 'Error al eliminar tarea'
      console.error(err)
      toast.error('Error al eliminar la tarea')
      throw err
    }
  }

  const getTaskById = (id: string): TaskWithRelations | undefined => {
    return tasks.value.find((task) => task.id === id)
  }

  return {
    // State
    tasks,
    isLoading,
    error,
    // Getters
    taskCount,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    stats,
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
  }
})
