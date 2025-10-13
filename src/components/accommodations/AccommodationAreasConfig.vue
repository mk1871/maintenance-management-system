<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TriangleAlert } from 'lucide-vue-next'
import AreaSelector, { type SelectedArea } from '@/components/accommodations/AreaSelector.vue'
import AreaElementsConfig, { type SelectedElement } from '@/components/accommodations/AreaElementsConfig.vue'
import type { AreaCatalog, ElementCatalog } from '@/composables/areaCatalogService'

defineProps<{
  areaCatalog: AreaCatalog[]
  elementCatalogMap: Map<string, ElementCatalog[]>
}>()

const selectedAreas = defineModel<SelectedArea[]>('selectedAreas', { required: true })
const selectedElements = defineModel<SelectedElement[]>('selectedElements', { required: true })

const showConfigSection = ref(false)

watch(selectedAreas, (newAreas) => {
  showConfigSection.value = newAreas.length > 0
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Selector de Áreas -->
    <Card>
      <CardHeader>
        <CardTitle>Áreas del Alojamiento</CardTitle>
        <CardDescription>
          Selecciona las áreas que existen en este alojamiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AreaSelector
          v-model="selectedAreas"
          :area-catalog="areaCatalog"
        />
      </CardContent>
    </Card>

    <!-- Configuración de Elementos -->
    <div v-if="showConfigSection">
      <Alert>
        <TriangleAlert class="h-4 w-4" />
        <AlertDescription>
          Configura los elementos para cada área seleccionada
        </AlertDescription>
      </Alert>

      <div class="mt-4">
        <AreaElementsConfig
          v-model="selectedElements"
          :element-catalog-map="elementCatalogMap"
          :selected-areas="selectedAreas"
        />
      </div>
    </div>
  </div>
</template>
