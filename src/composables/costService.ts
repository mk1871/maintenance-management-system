// src/composables/costService.ts
import { supabase } from '@/services/supabase'

// Tipos
export type CostCategory = 'materials' | 'labor' | 'tools' | 'transport' | 'other'

// Constantes
const ERROR_CODE_NOT_FOUND = 'PGRST116'
const MIN_AMOUNT = 0.01
const COST_SELECT_QUERY = `
  *,
  task:tasks(description),
  accommodation:accommodations(code, name)
`

// Interfaces
export interface Cost {
  id: string
  task_id: string
  accommodation_id: string
  amount: number
  category: CostCategory
  description?: string
  invoice_number?: string
  provider?: string
  expense_date: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateCostData {
  task_id: string
  accommodation_id: string
  amount: number
  category: CostCategory
  description?: string
  invoice_number?: string
  provider?: string
  expense_date?: string
}

export interface UpdateCostData {
  id: string
  amount?: number
  category?: CostCategory
  description?: string
  invoice_number?: string
  provider?: string
  expense_date?: string
}

/**
 * Valida que el ID sea válido
 */
const validateId = (id: string): void => {
  if (!id || id.trim().length === 0) {
    throw new Error('El ID del costo es requerido')
  }
}

/**
 * Valida que el monto sea válido
 */
const validateAmount = (amount: number): void => {
  if (amount < MIN_AMOUNT) {
    throw new Error(`El monto debe ser mayor a ${MIN_AMOUNT}`)
  }

  if (!Number.isFinite(amount)) {
    throw new Error('El monto debe ser un número válido')
  }
}

/**
 * Valida los datos de creación de costo
 */
const validateCreateData = (data: CreateCostData): void => {
  if (!data.task_id || data.task_id.trim().length === 0) {
    throw new Error('El ID de la tarea es requerido')
  }

  if (!data.accommodation_id || data.accommodation_id.trim().length === 0) {
    throw new Error('El ID del alojamiento es requerido')
  }

  validateAmount(data.amount)

  if (!data.category) {
    throw new Error('La categoría es requerida')
  }
}

/**
 * Valida los datos de actualización de costo
 */
const validateUpdateData = (data: UpdateCostData): void => {
  validateId(data.id)

  if (data.amount !== undefined) {
    validateAmount(data.amount)
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

/**
 * Normaliza los datos opcionales de un costo
 */
const normalizeOptionalFields = (
  description?: string,
  invoiceNumber?: string,
  provider?: string,
): { description?: string; invoice_number?: string; provider?: string } => {
  return {
    description: description?.trim(),
    invoice_number: invoiceNumber?.trim(),
    provider: provider?.trim(),
  }
}

export const costService = {
  /**
   * Obtiene todos los costos con información de tareas y alojamientos
   */
  async getAll(): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select(COST_SELECT_QUERY)
      .order('expense_date', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener costos'))
    }

    return data as Cost[]
  },

  /**
   * Obtiene todos los costos asociados a una tarea específica
   */
  async getByTaskId(taskId: string): Promise<Cost[]> {
    validateId(taskId)

    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener costos por tarea'))
    }

    return data as Cost[]
  },

  /**
   * Obtiene un costo específico por su ID
   */
  async getById(id: string): Promise<Cost | null> {
    validateId(id)

    const { data, error } = await supabase.from('costs').select('*').eq('id', id).single()

    if (error) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        return null
      }
      throw new Error(getErrorMessage(error, 'obtener costo'))
    }

    return data as Cost
  },

  /**
   * Crea un nuevo costo con fecha de gasto automática si no se proporciona
   */
  async create(costData: CreateCostData): Promise<Cost> {
    validateCreateData(costData)

    const dataToCreate = {
      task_id: costData.task_id.trim(),
      accommodation_id: costData.accommodation_id.trim(),
      amount: costData.amount,
      category: costData.category,
      expense_date: costData.expense_date || getCurrentTimestamp(),
      ...normalizeOptionalFields(costData.description, costData.invoice_number, costData.provider),
    }

    const { data, error } = await supabase.from('costs').insert([dataToCreate]).select().single()

    if (error) {
      throw new Error(getErrorMessage(error, 'crear costo'))
    }

    return data as Cost
  },

  /**
   * Actualiza un costo existente con timestamp automático
   */
  async update(costData: UpdateCostData): Promise<Cost> {
    validateUpdateData(costData)

    const dataToUpdate = {
      ...costData,
      ...normalizeOptionalFields(costData.description, costData.invoice_number, costData.provider),
      updated_at: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('costs')
      .update(dataToUpdate)
      .eq('id', costData.id)
      .select()
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'actualizar costo'))
    }

    return data as Cost
  },

  /**
   * Elimina un costo por su ID
   */
  async delete(id: string): Promise<void> {
    validateId(id)

    const { error } = await supabase.from('costs').delete().eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error, 'eliminar costo'))
    }
  },
}
