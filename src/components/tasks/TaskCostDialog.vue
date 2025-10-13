<script lang="ts" setup>
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { costService, type CreateCostData, type Cost } from '@/composables/costService'

const props = defineProps<{
  open: boolean
  taskId: string
  accommodationId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cost-added', cost: Cost): void
}>()

const isSaving = ref(false)
const formData = ref<CreateCostData>({
  task_id: props.taskId,
  amount: 0,
  category: 'materials',
  description: '',
  accommodation_id: props.accommodationId,
})

const errors = ref({
  amount: '',
  description: '',
})

const resetForm = (): void => {
  formData.value = {
    task_id: props.taskId,
    amount: 0,
    category: 'materials',
    description: '',
    accommodation_id: props.accommodationId,
  }
  errors.value = {
    amount: '',
    description: '',
  }
}

const validateForm = (): boolean => {
  errors.value = { amount: '', description: '' }
  let isValid = true

  if (!formData.value.amount || formData.value.amount <= 0) {
    errors.value.amount = 'El importe debe ser mayor a 0'
    isValid = false
  }

  if (!formData.value.description?.trim()) {
    errors.value.description = 'La descripción es requerida'
    isValid = false
  }

  return isValid
}

const handleSave = async (): Promise<void> => {
  if (!validateForm()) {
    toast.error('Por favor, corrige los errores del formulario')
    return
  }

  try {
    isSaving.value = true
    const createdCost = await costService.create({
      ...formData.value,
      task_id: props.taskId,
      accommodation_id: props.accommodationId,
    })

    toast.success('Costo registrado exitosamente')
    emit('cost-added', createdCost)
    resetForm()
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error al registrar el costo')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="(value) => !value && emit('close')">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Agregar Costo</DialogTitle>
        <DialogDescription> Registra un nuevo costo asociado a esta tarea </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Importe -->
        <div class="space-y-2">
          <Label for="amount">Importe (€) *</Label>
          <Input
            id="amount"
            v-model.number="formData.amount"
            :class="{ 'border-destructive': errors.amount }"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
          />
          <p v-if="errors.amount" class="text-sm font-medium text-destructive">
            {{ errors.amount }}
          </p>
        </div>

        <!-- Categoría -->
        <div class="space-y-2">
          <Label for="category">Categoría *</Label>
          <Select id="category" v-model="formData.category">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materials">Materiales</SelectItem>
              <SelectItem value="labor">Mano de Obra</SelectItem>
              <SelectItem value="tools">Herramientas</SelectItem>
              <SelectItem value="transport">Transporte</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Descripción -->
        <div class="space-y-2">
          <Label for="description">Descripción *</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            placeholder="Describe el concepto del costo..."
            rows="3"
          />
          <p v-if="errors.description" class="text-sm font-medium text-destructive">
            {{ errors.description }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button :disabled="isSaving" type="button" variant="outline" @click="emit('close')">
          Cancelar
        </Button>
        <Button :disabled="isSaving" type="submit" @click="handleSave">
          <Spinner v-if="isSaving" class="h-4 w-4 mr-2" />
          {{ isSaving ? 'Guardando...' : 'Guardar Costo' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
