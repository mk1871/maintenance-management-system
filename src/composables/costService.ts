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
 * Valida que el ID sea válido (UUID format)
 */
const validateId = (id: string): void => {
  if (!id || id.trim().length === 0) {
    throw new Error('El ID es requerido')
  }

  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error(`El ID "${id}" no es un UUID válido`)
  }
}

/**
 * Valida los datos de creación de costo
 */
const validateCreateCostData = (costData: CreateCostData): void => {
  validateId(costData.task_id)
  validateId(costData.accommodation_id)

  if (!costData.amount || costData.amount < MIN_AMOUNT) {
    throw new Error(`El importe debe ser mayor a ${MIN_AMOUNT}`)
  }

  if (!costData.category) {
    throw new Error('La categoría es requerida')
  }
}

/**
 * Valida los datos de actualización de costo
 */
const validateUpdateCostData = (costData: UpdateCostData): void => {
  validateId(costData.id)

  if (costData.amount !== undefined && costData.amount < MIN_AMOUNT) {
    throw new Error(`El importe debe ser mayor a ${MIN_AMOUNT}`)
  }
}

/**
 * Obtiene mensaje de error formateado
 */
const getErrorMessage = (error: Error, context: string): string => {
  const baseMessage = error.message || 'Error desconocido'
  return `Error al ${context}: ${baseMessage}`
}

/**
 * Obtiene timestamp actual en formato ISO
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

export const costService = {
  /**
   * Obtiene todos los costos
   */
  async getAll(): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select(COST_SELECT_QUERY)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener costos'))
    }

    return data as Cost[]
  },

  /**
   * Obtiene un costo por ID
   */
  async getById(id: string): Promise<Cost | null> {
    validateId(id)

    const { data, error } = await supabase
      .from('costs')
      .select(COST_SELECT_QUERY)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        return null
      }
      throw new Error(getErrorMessage(error, 'obtener costo'))
    }

    return data as Cost
  },

  /**
   * Obtiene costos por tarea
   */
  async getByTaskId(taskId: string): Promise<Cost[]> {
    validateId(taskId)

    const { data, error } = await supabase
      .from('costs')
      .select(COST_SELECT_QUERY)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener costos por tarea'))
    }

    return data as Cost[]
  },

  /**
   * Obtiene costos por alojamiento
   */
  async getByAccommodationId(accommodationId: string): Promise<Cost[]> {
    validateId(accommodationId)

    const { data, error } = await supabase
      .from('costs')
      .select(COST_SELECT_QUERY)
      .eq('accommodation_id', accommodationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener costos por alojamiento'))
    }

    return data as Cost[]
  },

  /**
   * Crea un nuevo costo
   */
  async create(costData: CreateCostData): Promise<Cost> {
    validateCreateCostData(costData)

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Usuario no autenticado. Por favor inicia sesión.')
    }

    const costToCreate = {
      task_id: costData.task_id,
      accommodation_id: costData.accommodation_id,
      amount: costData.amount,
      category: costData.category,
      description: costData.description,
      invoice_number: costData.invoice_number,
      provider: costData.provider,
      expense_date: costData.expense_date || getCurrentTimestamp(),
      created_by: user.id,
    }

    const { data, error } = await supabase
      .from('costs')
      .insert([costToCreate])
      .select(COST_SELECT_QUERY)
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'crear costo'))
    }

    return data as Cost
  },

  /**
   * Actualiza un costo existente
   */
  async update(costData: UpdateCostData): Promise<Cost> {
    validateUpdateCostData(costData)

    const costToUpdate = {
      ...costData,
      updated_at: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('costs')
      .update(costToUpdate)
      .eq('id', costData.id)
      .select(COST_SELECT_QUERY)
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'actualizar costo'))
    }

    return data as Cost
  },

  /**
   * Elimina un costo por ID
   */
  async delete(id: string): Promise<void> {
    validateId(id)

    const { error } = await supabase.from('costs').delete().eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error, 'eliminar costo'))
    }
  },
}
