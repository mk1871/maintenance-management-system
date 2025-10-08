// src/composables/taskService.ts
import { supabase } from '@/services/supabase'
import type { AccommodationArea, AccommodationElement } from './accommodationAreaService'

// Tipos de prioridad y estado
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Constantes
const ERROR_CODE_NOT_FOUND = 'PGRST116'

// Query con relaciones optimizadas
const TASK_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name),
  accommodation_area:accommodation_areas(
    id,
    custom_label,
    room_number,
    area_catalog:area_catalog(key, label, icon)
  ),
  accommodation_element:accommodation_elements(
    id,
    custom_name,
    condition,
    element_catalog:element_catalog(name)
  )
`

const TASK_DETAIL_SELECT_QUERY = `
  *,
  accommodation:accommodations(code, name),
  accommodation_area:accommodation_areas(
    id,
    custom_label,
    room_number,
    area_catalog:area_catalog(key, label, icon)
  ),
  accommodation_element:accommodation_elements(
    id,
    custom_name,
    condition,
    element_catalog:element_catalog(name)
  ),
  costs(*)
`

// Interfaces
export interface Task {
  id: string
  accommodation_id: string
  accommodation_code: string
  accommodation_area_id: string
  accommodation_element_id: string
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
  assigned_to?: string
  updated_at: string
  accommodation?: {
    code: string
    name: string
  }
  accommodation_area?: AccommodationArea
  accommodation_element?: AccommodationElement
}

export interface TaskWithRelations extends Task {
  area_label?: string
  element_name?: string
}

export interface CreateTaskData {
  accommodation_id: string
  accommodation_area_id: string
  accommodation_element_id: string
  description: string
  priority: TaskPriority
  due_date: string
  notes?: string
  estimated_cost?: number
  assigned_to?: string
}

export interface UpdateTaskData {
  id: string
  status?: TaskStatus
  accommodation_area_id?: string
  accommodation_element_id?: string
  repairer_name?: string
  start_date?: string
  completed_date?: string
  solution?: string
  notes?: string
  assigned_to?: string
}

const validateTaskId = (id: string): void => {
  if (!id || id.trim().length === 0) {
    throw new Error('El ID de tarea es requerido')
  }
}

const validateCreateTaskData = (taskData: CreateTaskData): void => {
  if (!taskData.accommodation_id) {
    throw new Error('El ID del alojamiento es requerido')
  }
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

const validateUpdateTaskData = (taskData: UpdateTaskData): void => {
  if (!taskData.id || taskData.id.trim().length === 0) {
    throw new Error('El ID de tarea es requerido')
  }
}

const getErrorMessage = (error: Error, context: string): string => {
  const baseMessage = error.message || 'Error desconocido'
  return `Error al ${context}: ${baseMessage}`
}

const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

const extractAreaLabel = (task: Task): string => {
  if (!task.accommodation_area) return 'N/A'
  const customLabel = task.accommodation_area.custom_label
  const catalogLabel = task.accommodation_area.area_catalog?.label
  const roomNumber = task.accommodation_area.room_number
  const baseLabel = customLabel || catalogLabel || 'Área'
  return roomNumber ? `${baseLabel} ${roomNumber}` : baseLabel
}

const extractElementName = (task: Task): string => {
  if (!task.accommodation_element) return 'N/A'
  return (
    task.accommodation_element.custom_name ||
    task.accommodation_element.element_catalog?.name ||
    'Elemento'
  )
}

const transformTaskWithLabels = (task: Task): TaskWithRelations => {
  return {
    ...task,
    area_label: extractAreaLabel(task),
    element_name: extractElementName(task),
  }
}

export const taskService = {
  async getAll(): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT_QUERY)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener tareas'))
    }

    return (data as Task[]).map(transformTaskWithLabels)
  },

  async getById(id: string): Promise<TaskWithRelations | null> {
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

    return transformTaskWithLabels(data as Task)
  },

  async create(taskData: CreateTaskData): Promise<TaskWithRelations> {
    validateCreateTaskData(taskData)

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
      .select(TASK_SELECT_QUERY)
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'crear tarea'))
    }

    return transformTaskWithLabels(data as Task)
  },

  async update(taskData: UpdateTaskData): Promise<TaskWithRelations> {
    validateUpdateTaskData(taskData)

    const taskToUpdate = {
      ...taskData,
      updated_at: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(taskToUpdate)
      .eq('id', taskData.id)
      .select(TASK_SELECT_QUERY)
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'actualizar tarea'))
    }

    return transformTaskWithLabels(data as Task)
  },

  async delete(id: string): Promise<void> {
    validateTaskId(id)

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error, 'eliminar tarea'))
    }
  },
}
