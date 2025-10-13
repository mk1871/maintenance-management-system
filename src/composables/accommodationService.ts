// src/composables/accommodationService.ts
import { supabase } from '@/services/supabase'

// Tipos
export type AccommodationStatus = 'active' | 'inactive'

// Constantes
const ERROR_CODE_NOT_FOUND = 'PGRST116'
const MIN_CODE_LENGTH = 2
const MAX_CODE_LENGTH = 4
const MIN_NAME_LENGTH = 3
const CODE_PATTERN = /^[A-Z0-9]+$/

// Interfaces
export interface Accommodation {
  id: string
  code: string
  name: string
  address?: string
  notes?: string
  status: AccommodationStatus
  configured_areas: Record<string, string[]>
  created_by: string
  created_at: string
  updated_at: string
}

// ✅ CORRECCIÓN 1: configured_areas ahora es opcional
export interface CreateAccommodationData {
  code: string
  name: string
  address?: string
  notes?: string
  status?: AccommodationStatus
  configured_areas?: Record<string, string[]> // ← Cambiado a opcional
}

export interface UpdateAccommodationData {
  id: string
  name?: string
  address?: string
  notes?: string
  status?: AccommodationStatus
  configured_areas?: Record<string, string[]>
}

/**
 * Valida que el ID sea válido
 */
const validateId = (id: string): void => {
  if (!id || id.trim().length === 0) {
    throw new Error('El ID del alojamiento es requerido')
  }
}

/**
 * Valida que el código sea válido
 */
const validateCode = (code: string): void => {
  if (!code || code.trim().length === 0) {
    throw new Error('El código es requerido')
  }

  const trimmedCode = code.trim()
  if (trimmedCode.length < MIN_CODE_LENGTH || trimmedCode.length > MAX_CODE_LENGTH) {
    throw new Error(`El código debe tener entre ${MIN_CODE_LENGTH} y ${MAX_CODE_LENGTH} caracteres`)
  }

  if (!CODE_PATTERN.test(trimmedCode)) {
    throw new Error('El código solo puede contener letras mayúsculas y números')
  }
}

/**
 * Valida los datos de creación de alojamiento
 */
const validateCreateData = (data: CreateAccommodationData): void => {
  validateCode(data.code)

  if (!data.name || data.name.trim().length < MIN_NAME_LENGTH) {
    throw new Error(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
  }

  // ✅ CORRECCIÓN 2: Eliminada validación de configured_areas
  // Las áreas se manejan en accommodation_areas (tabla separada)
}

/**
 * Valida los datos de actualización de alojamiento
 */
const validateUpdateData = (data: UpdateAccommodationData): void => {
  validateId(data.id)

  if (data.name && data.name.trim().length < MIN_NAME_LENGTH) {
    throw new Error(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
  }

  // ✅ CORRECCIÓN 3: Validación de configured_areas ahora permite undefined
  if (data.configured_areas !== undefined && Object.keys(data.configured_areas).length === 0) {
    throw new Error('Debe configurar al menos un área')
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
 * Obtiene el ID del usuario autenticado
 */
const getCurrentUserId = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  return user.id
}

export const accommodationService = {
  /**
   * Obtiene todos los alojamientos ordenados por fecha de creación
   */
  async getAll(): Promise<Accommodation[]> {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessage(error, 'obtener alojamientos'))
    }

    return data as Accommodation[]
  },

  /**
   * Obtiene un alojamiento específico por su ID
   */
  async getById(id: string): Promise<Accommodation | null> {
    validateId(id)

    const { data, error } = await supabase.from('accommodations').select('*').eq('id', id).single()

    if (error) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        return null
      }
      throw new Error(getErrorMessage(error, 'obtener alojamiento'))
    }

    return data as Accommodation
  },

  /**
   * Obtiene un alojamiento específico por su código
   */
  async getByCode(code: string): Promise<Accommodation | null> {
    validateCode(code)

    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error) {
      if (error.code === ERROR_CODE_NOT_FOUND) {
        return null
      }
      throw new Error(getErrorMessage(error, 'obtener alojamiento por código'))
    }

    return data as Accommodation
  },

  /**
   * Crea un nuevo alojamiento con código en mayúsculas y usuario autenticado
   */
  async create(accommodationData: CreateAccommodationData): Promise<Accommodation> {
    validateCreateData(accommodationData)

    // Obtener usuario autenticado
    const userId = await getCurrentUserId()

    const dataToCreate = {
      ...accommodationData,
      code: accommodationData.code.trim().toUpperCase(),
      name: accommodationData.name.trim(),
      address: accommodationData.address?.trim(),
      notes: accommodationData.notes?.trim(),
      status: accommodationData.status || ('active' as AccommodationStatus),
      configured_areas: accommodationData.configured_areas || {}, // ✅ Default a objeto vacío
      created_by: userId,
    }

    const { data, error } = await supabase
      .from('accommodations')
      .insert([dataToCreate])
      .select()
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'crear alojamiento'))
    }

    return data as Accommodation
  },

  /**
   * Actualiza un alojamiento existente con timestamp automático
   */
  async update(accommodationData: UpdateAccommodationData): Promise<Accommodation> {
    validateUpdateData(accommodationData)

    const dataToUpdate = {
      ...accommodationData,
      name: accommodationData.name?.trim(),
      address: accommodationData.address?.trim(),
      notes: accommodationData.notes?.trim(),
      updated_at: getCurrentTimestamp(),
    }

    const { data, error } = await supabase
      .from('accommodations')
      .update(dataToUpdate)
      .eq('id', accommodationData.id)
      .select()
      .single()

    if (error) {
      throw new Error(getErrorMessage(error, 'actualizar alojamiento'))
    }

    return data as Accommodation
  },

  /**
   * Elimina un alojamiento por su ID
   */
  async delete(id: string): Promise<void> {
    validateId(id)

    const { error } = await supabase.from('accommodations').delete().eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error, 'eliminar alojamiento'))
    }
  },
}
