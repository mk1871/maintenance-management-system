import { ref } from 'vue'
import { toast } from 'vue-sonner'

export function useDataLoader<T>() {
  const data = ref<T[] | null>(null)
  const isLoading = ref(false)

  async function load(fetcher: () => Promise<T[]>) {
    isLoading.value = true
    try {
      data.value = await fetcher()
    } catch (e: unknown) {
      console.error(e)
      toast.error('Error loading data')
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, load }
}
