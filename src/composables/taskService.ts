// src/composables/taskService.ts
import { supabase } from '@/services/supabase'
import type { AccommodationArea, AccommodationElement } from './accommodationAreaService'

// Tipos de prioridad y estado
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Constantes
const ERROR_CODE_NOT_FOUND = 'PGRST116'

// ACTUALIZADO: Query con nuevas relaciones
const TASK_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name),
  area:accommodation_areas(
    id,
    custom_label,
    room_number,
    area_catalog(key, label, icon)
  ),
  element:accommodation_elements(
    id,
    custom_name,
    condition,
    element_catalog(name)
  )
`

const TASK_DETAIL_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name),
  area:accommodation_areas(
    id,
    custom_label,
    room_number,
    area_catalog(key, label, icon)
  ),
  element:accommodation_elements(
    id,
    custom_name,
    condition,
    element_catalog(name)
  ),
  costs(*)
`

// Interfaces
export interface Task {
  id: string
  accommodation_id: string
  accommodation_code: string

  // CAMBIO: Reemplazar strings por FKs relacionales
  accommodation_area_id: string // NUEVO: antes era "area: string"
  accommodation_element_id: string // NUEVO: antes era "element: string"

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
  assigned_to?: string // NUEVO: agregado en migración
  updated_at: string

  // Relaciones expandidas (solo cuando se usa SELECT con joins)
  accommodation?: {
    code: string
    name: string
  }
  area?: AccommodationArea // NUEVO: datos completos del área
  element?: AccommodationElement // NUEVO: datos completos del elemento
}

export interface CreateTaskData {
  accommodation_id: string
  accommodation_area_id: string // CAMBIO: antes era "area: string"
  accommodation_element_id: string // CAMBIO: antes era "element: string"
  description: string
  priority: TaskPriority
  due_date: string
  notes?: string
  estimated_cost?: number
  assigned_to?: string // NUEVO: opcional para asignar a otro supervisor
}

export interface UpdateTaskData {
  id: string
  status?: TaskStatus
  accommodation_area_id?: string // NUEVO: permitir cambio de área
  accommodation_element_id?: string // NUEVO: permitir cambio de elemento
  repairer_name?: string
  start_date?: string
  completed_date?: string
  solution?: string
  notes?: string
  assigned_to?: string // NUEVO: reasignar tarea
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

  // CAMBIO: Validar IDs en lugar de strings
  if (!taskData.accommodation_area_id || taskData.accommodation_area_id.trim().length === 0) {
    throw new Error('El área es requerida')
  }
  if (!taskData.accommodation_element_id || taskData.accommodation_element_id.trim().length === 0) {
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

    // CAMBIO: Usar nuevos campos relacionales
    const taskToCreate = {
      accommodation_id: taskData.accommodation_id,
      accommodation_area_id: taskData.accommodation_area_id,
      accommodation_element_id: taskData.accommodation_element_id,
      description: taskData.description,
      priority: taskData.priority,
      due_date: taskData.due_date,
      notes: taskData.notes,
      estimated_cost: taskData.estimated_cost,
      assigned_to: taskData.assigned_to,
      detection_date: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskToCreate])
      .select(TASK_SELECT_QUERY) // CAMBIO: Traer datos relacionados
      .single()

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
      .select(TASK_SELECT_QUERY) // CAMBIO: Traer datos relacionados
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
