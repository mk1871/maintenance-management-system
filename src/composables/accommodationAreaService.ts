import { supabase } from '@/services/supabase'

/**
 * Área específica de un alojamiento (instancia del catálogo)
 */
export interface AccommodationArea {
  id: string
  accommodation_id: string
  area_catalog_id: string
  custom_label?: string
  room_number?: number
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
  // Relaciones
  area_catalog?: {
    key: string
    label: string
    icon?: string
  }
  elements?: AccommodationElement[]
}

/**
 * Elemento específico de un área de alojamiento
 */
export interface AccommodationElement {
  id: string
  accommodation_area_id: string
  element_catalog_id: string
  custom_name?: string
  condition?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
  // Relaciones
  element_catalog?: {
    name: string
  }
}

export const useAccommodationAreaService = () => {
  /**
   * Obtiene todas las áreas configuradas de un alojamiento
   */
  const getAreasByAccommodation = async (accommodationId: string): Promise<AccommodationArea[]> => {
    const { data, error } = await supabase
      .from('accommodation_areas')
      .select(
        `
        *,
        area_catalog(key, label, icon),
        elements:accommodation_elements(
          *,
          element_catalog(name)
        )
      `,
      )
      .eq('accommodation_id', accommodationId)
      .eq('active', true)
      .order('room_number', { nullsFirst: false })

    if (error) throw error
    return data || []
  }

  /**
   * Crea un área para un alojamiento basada en el catálogo
   */
  const createArea = async (
    accommodationId: string,
    areaCatalogId: string,
    roomNumber?: number,
    customLabel?: string,
  ): Promise<AccommodationArea> => {
    const { data, error } = await supabase
      .from('accommodation_areas')
      .insert({
        accommodation_id: accommodationId,
        area_catalog_id: areaCatalogId,
        room_number: roomNumber,
        custom_label: customLabel,
        active: true,
      })
      .select(
        `
        *,
        area_catalog(key, label, icon)
      `,
      )
      .single()

    if (error) throw error
    return data
  }

  /**
   * Agrega un elemento a un área de alojamiento
   */
  const addElement = async (
    accommodationAreaId: string,
    elementCatalogId: string,
    customName?: string,
  ): Promise<AccommodationElement> => {
    const { data, error } = await supabase
      .from('accommodation_elements')
      .insert({
        accommodation_area_id: accommodationAreaId,
        element_catalog_id: elementCatalogId,
        custom_name: customName,
        active: true,
      })
      .select(
        `
        *,
        element_catalog(name)
      `,
      )
      .single()

    if (error) throw error
    return data
  }

  /**
   * Elimina un elemento de un área de alojamiento
   */
  const deleteElement = async (elementId: string): Promise<void> => {
    const { error } = await supabase.from('accommodation_elements').delete().eq('id', elementId)

    if (error) throw error
  }

  /**
   * Elimina un área completa de un alojamiento (CASCADE elimina elementos)
   */
  const deleteArea = async (areaId: string): Promise<void> => {
    const { error } = await supabase.from('accommodation_areas').delete().eq('id', areaId)

    if (error) throw error
  }

  return {
    getAreasByAccommodation,
    createArea,
    addElement,
    deleteElement,
    deleteArea,
  }
}
