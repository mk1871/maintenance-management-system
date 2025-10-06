<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { accommodationService, type CreateAccommodationData } from '@/composables/accommodationService'

const emit = defineEmits<{
  (e: 'accommodation-created'): void
}>()
const router = useRouter()

interface FormData {
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
  areas: Record<string, boolean>
}

const areaOptions = [
  { value: 'living_room', label: 'Sala de Estar' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'bathroom_1', label: 'Baño Principal' },
  { value: 'bathroom_2', label: 'Segundo Baño' },
  { value: 'bedroom_1', label: 'Dormitorio Principal' },
  { value: 'bedroom_2', label: 'Segundo Dormitorio' },
  { value: 'bedroom_3', label: 'Tercer Dormitorio' },
  { value: 'terrace', label: 'Terraza' },
  { value: 'garage', label: 'Garaje' },
]

const formData = ref<FormData>({
  code: '',
  name: '',
  address: '',
  status: 'active',
  areas: areaOptions.reduce((acc, cur) => ({ ...acc, [cur.value]: false }), {} as Record<string, boolean>)
})
const errors = reactive({ code: '', name: '' })
const isSubmitting = ref(false)

function validateField(field: 'code' | 'name') {
  if (field === 'code') {
    const v = formData.value.code
    errors.code = !v
      ? 'Code required'
      : v.length < 2 || v.length > 4
        ? '2–4 chars'
        : /^[A-Z0-9]+$/.test(v)
          ? ''
          : 'Only A–Z0–9'
  }
  if (field === 'name') {
    const v = formData.value.name
    errors.name = !v ? 'Name required' : v.length < 3 ? 'Min 3 chars' : ''
  }
}

async function handleCreate() {
  validateField('code')
  validateField('name')
  if (Object.values(errors).some(e => e)) return
  if (!Object.values(formData.value.areas).some(v => v)) {
    toast.error('Select at least one area')
    return
  }

  isSubmitting.value = true
  const data: CreateAccommodationData = {
    code: formData.value.code.toUpperCase(),
    name: formData.value.name,
    address: formData.value.address,
    status: formData.value.status,
    configured_areas: Object.fromEntries(
      Object.entries(formData.value.areas)
        .filter(([, v]) => v)
        .map(([key]) => [key, []])
    )
  }

  try {
    await accommodationService.create(data)
    toast.success('Accommodation created')
    emit('accommodation-created')
    router.push({ name: 'Accommodations' })
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Error creating accommodation')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>New Accommodation</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create Accommodation</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Code</Label>
          <Input
            v-model="formData.code"
            :class="{ 'border-destructive': errors.code }"
            class="col-span-3"
            @blur="() => validateField('code')"
          />
          <p v-if="errors.code" class="col-span-4 text-sm text-destructive text-right">
            {{ errors.code }}
          </p>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Name</Label>
          <Input
            v-model="formData.name"
            :class="{ 'border-destructive': errors.name }"
            class="col-span-3"
            @blur="() => validateField('name')"
          />
          <p v-if="errors.name" class="col-span-4 text-sm text-destructive text-right">
            {{ errors.name }}
          </p>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Address</Label>
          <Input v-model="formData.address" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Status</Label>
          <Select v-model="formData.status">
            <SelectTrigger class="w-[180px]"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-4 items-start gap-4">
          <Label class="text-right">Areas</Label>
          <div class="col-span-3 grid grid-cols-2 gap-2">
            <div
              v-for="opt in areaOptions"
              :key="opt.value"
              class="flex items-center"
            >
              <Checkbox v-model="formData.areas[opt.value]" />
              <Label class="ml-2">{{ opt.label }}</Label>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button :disabled="isSubmitting" @click="handleCreate">
          <span v-if="!isSubmitting">Create Accommodation</span>
          <Spinner v-else class="h-5 w-5"/>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
