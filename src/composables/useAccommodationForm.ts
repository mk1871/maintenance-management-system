import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAccommodationAreaService } from './accommodationAreaService'
import type { SelectedArea } from '@/components/accommodations/AreaSelector.vue'
import type { SelectedElement } from '@/components/accommodations/AreaElementsConfig.vue'

/**
 * Composable para lógica compartida de formularios de alojamiento
 */
export const useAccommodationForm = () => {
  const { createArea, addElement } = useAccommodationAreaService()
  const isSubmitting = ref(false)

  /**
   * Guarda áreas y elementos en la base de datos
   */
  const saveAreasAndElements = async (
    accommodationId: string,
    selectedAreas: SelectedArea[],
    selectedElements: SelectedElement[],
  ): Promise<void> => {
    const areaIdMap = createAreaIdMap()

    await createAreasInDatabase(accommodationId, selectedAreas, areaIdMap)
    await createElementsInDatabase(selectedElements, areaIdMap)
  }

  /**
   * Crea un mapa para relacionar áreas temporales con IDs de DB
   */
  const createAreaIdMap = (): Map<string, string> => {
    return new Map<string, string>()
  }

  /**
   * Crea las áreas en la base de datos
   */
  const createAreasInDatabase = async (
    accommodationId: string,
    selectedAreas: SelectedArea[],
    areaIdMap: Map<string, string>,
  ): Promise<void> => {
    for (const area of selectedAreas) {
      const tempKey = buildAreaTempKey(area.area_catalog_id, area.room_number)

      const createdArea = await createArea(
        accommodationId,
        area.area_catalog_id,
        area.room_number,
        area.custom_label,
      )

      areaIdMap.set(tempKey, createdArea.id)
    }
  }

  /**
   * Crea los elementos en la base de datos
   */
  const createElementsInDatabase = async (
    selectedElements: SelectedElement[],
    areaIdMap: Map<string, string>,
  ): Promise<void> => {
    for (const element of selectedElements) {
      const tempKey = buildAreaTempKey(element.area_catalog_id, element.room_number)
      const realAreaId = areaIdMap.get(tempKey)

      if (!realAreaId) {
        logMissingAreaWarning(element)
        continue
      }

      await addElement(realAreaId, element.element_catalog_id)
    }
  }

  /**
   * Construye una clave temporal para mapear áreas
   */
  const buildAreaTempKey = (areaCatalogId: string, roomNumber?: number): string => {
    return `${areaCatalogId}-${roomNumber || 0}`
  }

  /**
   * Registra advertencia cuando no se encuentra área para elemento
   */
  const logMissingAreaWarning = (element: SelectedElement): void => {
    console.warn('No se encontró área para elemento:', element)
  }

  /**
   * Maneja errores de API de forma consistente
   */
  const handleApiError = (error: unknown, context: string): void => {
    console.error(`Error en ${context}:`, error)
    const message = (error as Error).message || `Error al ${context}`
    toast.error(message)
  }

  return {
    isSubmitting,
    saveAreasAndElements,
    handleApiError,
  }
}
