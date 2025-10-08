import { supabase } from '@/services/supabase'

/**
 * Catálogo maestro de áreas (global, solo supervisores pueden modificar)
 */
export interface AreaCatalog {
  id: string
  key: string
  label: string
  description?: string
  icon?: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Catálogo maestro de elementos por área
 */
export interface ElementCatalog {
  id: string
  area_catalog_id: string
  name: string
  description?: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export const useAreaCatalogService = () => {
  /**
   * Obtiene todas las áreas del catálogo maestro (activas)
   */
  const getAllAreas = async (): Promise<AreaCatalog[]> => {
    const { data, error } = await supabase
      .from('area_catalog')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene elementos de un área específica del catálogo
   */
  const getElementsByArea = async (areaCatalogId: string): Promise<ElementCatalog[]> => {
    const { data, error } = await supabase
      .from('element_catalog')
      .select('*')
      .eq('area_catalog_id', areaCatalogId)
      .eq('active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene todas las áreas con sus elementos (para configuración)
   */
  const getAreasWithElements = async (): Promise<
    (AreaCatalog & { elements: ElementCatalog[] })[]
  > => {
    const { data, error } = await supabase
      .from('area_catalog')
      .select(
        `
        *,
        elements:element_catalog(*)
      `,
      )
      .eq('active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  return {
    getAllAreas,
    getElementsByArea,
    getAreasWithElements,
  }
}
