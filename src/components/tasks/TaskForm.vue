<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { type CreateTaskData, taskService } from '@/composables/taskService'
import { type Accommodation, accommodationService } from '@/composables/accommodationService'

const router = useRouter()

interface TaskFormData {
  accommodation_id: string
  area: string
  element: string
  description: string
  priority: 'low' | 'medium' | 'high'
  due_date: string
  estimated_cost: string
}

const accommodations = ref<Accommodation[]>([])
const formData = ref<TaskFormData>({
  accommodation_id: '',
  area: '',
  element: '',
  description: '',
  priority: 'medium',
  due_date: '',
  estimated_cost: ''
})
const errors = reactive({ description: '', due_date: '' })
const isSubmitting = ref(false)

async function loadAccommodations() {
  try {
    accommodations.value = await accommodationService.getAll()
  } catch (err: unknown) {
    console.error(err)
    toast.error('Error loading accommodations')
  }
}

onMounted(async () => {
  await loadAccommodations()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  formData.value.due_date = tomorrow.toISOString().split('T')[0]
})

const areas = computed<string[]>(() => {
  const id = formData.value.accommodation_id
  if (!id) return []
  const acc = accommodations.value.find(a => a.id === id)
  return acc?.configured_areas ? Object.keys(acc.configured_areas) : []
})

const elements = computed<string[]>(() => {
  const { accommodation_id, area } = formData.value
  if (!accommodation_id || !area) return []
  const acc = accommodations.value.find(a => a.id === accommodation_id)
  return acc?.configured_areas?.[area] || []
})

const isFormValid = computed(() =>
  !!formData.value.accommodation_id &&
  !!formData.value.area &&
  !!formData.value.element &&
  formData.value.description.length >= 10 &&
  !!formData.value.due_date &&
  !errors.description &&
  !errors.due_date
)

function validateField(field: 'description' | 'due_date') {
  if (field === 'description') {
    const v = formData.value.description
    errors.description = !v
      ? 'Description required'
      : v.length < 10
        ? 'Minimum 10 characters'
        : ''
  }
  if (field === 'due_date') {
    const v = formData.value.due_date
    const date = new Date(v)
    errors.due_date = !v
      ? 'Due date required'
      : date < new Date()
        ? 'Date must be in the future'
        : ''
  }
}

async function handleCreate() {
  validateField('description')
  validateField('due_date')
  if (!isFormValid.value) return

  const data: CreateTaskData = {
    accommodation_id: formData.value.accommodation_id,
    area: formData.value.area,
    element: formData.value.element,
    description: formData.value.description,
    priority: formData.value.priority,
    due_date: formData.value.due_date,
    estimated_cost: formData.value.estimated_cost
      ? parseFloat(formData.value.estimated_cost)
      : undefined
  }

  isSubmitting.value = true
  try {
    await taskService.create(data)
    toast.success('Task created successfully')
    // reset form
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    formData.value = {
      accommodation_id: '',
      area: '',
      element: '',
      description: '',
      priority: 'medium',
      due_date: tomorrow.toISOString().split('T')[0],
      estimated_cost: ''
    }
    errors.description = ''
    errors.due_date = ''
    router.push({ name: 'Tasks' })
  } catch (err: unknown) {
    console.error(err)
    toast.error((err as Error).message || 'Error creating task')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>New Task</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Maintenance Task</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Accommodation</Label>
            <Select v-model="formData.accommodation_id">
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="acc in accommodations"
                  :key="acc.id"
                  :value="acc.id"
                >
                  {{ acc.code }} - {{ acc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Area</Label>
            <Select v-model="formData.area" :disabled="!formData.accommodation_id">
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="a in areas"
                  :key="a"
                  :value="a"
                >
                  {{ a }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Element</Label>
            <Select v-model="formData.element" :disabled="!formData.area">
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="e in elements"
                  :key="e"
                  :value="e"
                >
                  {{ e }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select v-model="formData.priority">
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            v-model="formData.description"
            :class="{ 'border-destructive': errors.description }"
            @blur="() => validateField('description')"
          />
          <p v-if="errors.description" class="text-destructive">{{ errors.description }}</p>
        </div>
        <div>
          <Label>Due Date</Label>
          <Input
            v-model="formData.due_date"
            :class="{ 'border-destructive': errors.due_date }"
            type="date"
            @blur="() => validateField('due_date')"
          />
          <p v-if="errors.due_date" class="text-destructive">{{ errors.due_date }}</p>
        </div>
      </div>
      <DialogFooter>
        <Button :disabled="!isFormValid" @click="handleCreate">
          <span v-if="!isSubmitting">Create Task</span>
          <Spinner v-else class="h-5 w-5" />
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
