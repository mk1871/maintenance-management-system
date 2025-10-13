import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAreaCatalogService } from '@/composables/areaCatalogService'
import type { AreaCatalog, ElementCatalog } from '@/composables/areaCatalogService'
import { toast } from 'vue-sonner'

// Tipo extendido que incluye elements
interface AreaWithElements extends AreaCatalog {
  elements?: ElementCatalog[]
}

export const useAreaCatalogStore = defineStore('areaCatalog', () => {
  const { getAreasWithElements } = useAreaCatalogService()

  // Estado
  const areas = ref<AreaWithElements[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const elementsByArea = computed((): Map<string, ElementCatalog[]> => {
    const map = new Map<string, ElementCatalog[]>()
    areas.value.forEach((area) => {
      if (area.elements && area.elements.length > 0) {
        map.set(area.key, area.elements)
      }
    })
    return map
  })

  const areaCount = computed(() => areas.value.length)

  const getElementsForArea = (areaKey: string): ElementCatalog[] => {
    return elementsByArea.value.get(areaKey) ?? []
  }

  // Actions
  const fetchAreas = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      const result = await getAreasWithElements()
      areas.value = result as AreaWithElements[]
    } catch (err: unknown) {
      error.value = 'Error al cargar áreas'
      console.error(err)
      toast.error('Error al cargar el catálogo de áreas')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    areas,
    isLoading,
    error,
    // Getters
    elementsByArea,
    areaCount,
    getElementsForArea,
    // Actions
    fetchAreas,
  }
})
