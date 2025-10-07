// src/composables/taskService.ts
import { supabase } from '@/services/supabase'

// Tipos de prioridad y estado
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Constantes
const ERROR_CODE_NOT_FOUND = 'PGRST116'
const TASK_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name)
`
const TASK_DETAIL_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name),
  costs(*)
`

// Interfaces
export interface Task {
  id: string
  accommodation_id: string
  accommodation_code: string
  area: string
  element: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  created_at: string
  detection_date: string
  due_date: string
  start_date?: string
  completed_date?: string
  repairer_id?: string
  repairer_name?: string
  solution?: string
  time_spent_days?: number
  notes?: string
  estimated_cost?: number
  archived: boolean
  created_by: string
  updated_at: string
}

export interface CreateTaskData {
  accommodation_id: string
  area: string
  element: string
  description: string
  priority: TaskPriority
  due_date: string
  notes?: string
  estimated_cost?: number
}

export interface UpdateTaskData {
  id: string
  status?: TaskStatus
  repairer_name?: string
  start_date?: string
  completed_date?: string
  solution?: string
  notes?: string
}

/**
 * Valida que el ID de tarea sea válido
 */
const validateTaskId = (id: string): void => {
  if (!id || id.trim().length === 0) {
    throw new Error('El ID de tarea es requerido')
  }
}

/**
 * Valida los datos de creación de tarea
 */
const validateCreateTaskData = (taskData: CreateTaskData): void => {
  if (!taskData.accommodation_id) {
    throw new Error('El ID del alojamiento es requerido')
  }
  if (!taskData.area || taskData.area.trim().length === 0) {
    throw new Error('El área es requerida')
  }
  if (!taskData.element || taskData.element.trim().length === 0) {
    throw new Error('El elemento es requerido')
  }
  if (!taskData.description || taskData.description.trim().length < 10) {
    throw new Error('La descripción debe tener al menos 10 caracteres')
  }
  if (!taskData.due_date) {
    throw new Error('La fecha de vencimiento es requerida')
  }
}

/**
 * Valida los datos de actualización de tarea
 */
const validateUpdateTaskData = (taskData: UpdateTaskData): void => {
  if (!taskData.id || taskData.id.trim().length === 0) {
    throw new Error('El ID de tarea es requerido')
  }
}

/**
 * Genera mensaje de error descriptivo según el contexto
 */
const getErrorMessage = (error: Error, context: string): string => {
  const baseMessage = error.message || 'Error desconocido'
  return `Error al ${context}: ${baseMessage}`
}

/**
 * Obtiene la fecha actual en formato ISO
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

export const taskService = {
  /**
   * Obtiene todas las tareas ordenadas por fecha de creación
   */
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT_QUERY)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener tareas'))
    }

    return data as Task[]
  },

  /**
   * Obtiene una tarea específica por su ID con sus costos asociados
   */
  async getById(id: string): Promise<Task | null> {
    validateTaskId(id)

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_DETAIL_SELECT_QUERY)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        return null
      }
      throw new Error(getErrorMessage(error, 'obtener tarea'))
    }

    return data as Task
  },

  /**
   * Crea una nueva tarea con fecha de detección automática
   */
  async create(taskData: CreateTaskData): Promise<Task> {
    validateCreateTaskData(taskData)

    const taskToCreate = {
      ...taskData,
      detection_date: getCurrentTimestamp(),
    }

    const { data, error } = await supabase.from('tasks').insert([taskToCreate]).select().single()

    if (error) {
      throw new Error(getErrorMessage(error, 'crear tarea'))
    }

    return data as Task
  },

  /**
   * Actualiza una tarea existente con timestamp automático
   */
  async update(taskData: UpdateTaskData): Promise<Task> {
    validateUpdateTaskData(taskData)

    const taskToUpdate = {
      ...taskData,
      updated_at: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(taskToUpdate)
      .eq('id', taskData.id)
      .select()
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'actualizar tarea'))
    }

    return data as Task
  },

  /**
   * Elimina una tarea por su ID
   */
  async delete(id: string): Promise<void> {
    validateTaskId(id)

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error, 'eliminar tarea'))
    }
  },
}
