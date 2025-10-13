import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  accommodationService,
  type Accommodation,
  type CreateAccommodationData,
} from '@/composables/accommodationService'
import { toast } from 'vue-sonner'

export const useAccommodationsStore = defineStore('accommodations', () => {
  // Estado
  const accommodations = ref<Accommodation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeAccommodations = computed(() =>
    accommodations.value.filter((acc) => acc.status === 'active'),
  )

  const accommodationCount = computed(() => accommodations.value.length)

  // Actions
  const fetchAccommodations = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      accommodations.value = await accommodationService.getAll()
    } catch (err: unknown) {
      error.value = 'Error al cargar alojamientos'
      console.error(err)
      toast.error('Error al cargar los alojamientos')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createAccommodation = async (data: CreateAccommodationData): Promise<Accommodation> => {
    try {
      isLoading.value = true
      error.value = null
      const newAccommodation = await accommodationService.create(data)
      accommodations.value.unshift(newAccommodation)
      toast.success('Alojamiento creado exitosamente')
      return newAccommodation
    } catch (err: unknown) {
      error.value = 'Error al crear alojamiento'
      console.error(err)
      toast.error('Error al crear el alojamiento')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateAccommodation = async (id: string, data: Partial<Accommodation>): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      const updated = await accommodationService.update({ id, ...data })
      const index = accommodations.value.findIndex((acc) => acc.id === id)
      if (index !== -1) {
        accommodations.value[index] = updated
      }
      toast.success('Alojamiento actualizado')
    } catch (err: unknown) {
      error.value = 'Error al actualizar alojamiento'
      console.error(err)
      toast.error('Error al actualizar el alojamiento')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteAccommodation = async (id: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      await accommodationService.delete(id)
      accommodations.value = accommodations.value.filter((acc) => acc.id !== id)
      toast.success('Alojamiento eliminado')
    } catch (err: unknown) {
      error.value = 'Error al eliminar alojamiento'
      console.error(err)
      toast.error('Error al eliminar el alojamiento')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    accommodations,
    isLoading,
    error,
    // Getters
    activeAccommodations,
    accommodationCount,
    // Actions
    fetchAccommodations,
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
  }
})
