import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const VALIDATION_RULES = {
  CODE: {
    MIN: 1,
    MAX: 4,
    PATTERN: /^[A-Z0-9]+$/,
  },
  NAME: {
    MIN: 3,
    MAX: 100,
  },
  ADDRESS: {
    MAX: 255,
  },
  NOTES: {
    MAX: 500,
  },
} as const

/**
 * Schema de Zod para SelectedArea (tipado estricto)
 */
const selectedAreaSchema = z.object({
  area_catalog_id: z.string(),
  key: z.string(),
  label: z.string(),
  room_number: z.number().optional(),
  custom_label: z.string().optional(),
})

/**
 * Schema de Zod para SelectedElement (tipado estricto)
 */
const selectedElementSchema = z.object({
  accommodation_area_id: z.string(),
  area_catalog_id: z.string(),
  element_catalog_id: z.string(),
  element_name: z.string(),
  room_number: z.number().optional(),
})

/**
 * Schema para campos básicos del alojamiento
 */
export const accommodationBasicSchema = z.object({
  code: z
    .string()
    .min(VALIDATION_RULES.CODE.MIN, 'El código es requerido')
    .max(
      VALIDATION_RULES.CODE.MAX,
      `El código debe tener máximo ${VALIDATION_RULES.CODE.MAX} caracteres`,
    )
    .regex(
      VALIDATION_RULES.CODE.PATTERN,
      'El código solo puede contener letras mayúsculas y números',
    )
    .transform((val) => val.toUpperCase()),

  name: z
    .string()
    .min(
      VALIDATION_RULES.NAME.MIN,
      `El nombre debe tener al menos ${VALIDATION_RULES.NAME.MIN} caracteres`,
    )
    .max(
      VALIDATION_RULES.NAME.MAX,
      `El nombre debe tener máximo ${VALIDATION_RULES.NAME.MAX} caracteres`,
    )
    .trim(),

  address: z
    .string()
    .max(
      VALIDATION_RULES.ADDRESS.MAX,
      `La dirección debe tener máximo ${VALIDATION_RULES.ADDRESS.MAX} caracteres`,
    )
    .trim()
    .optional()
    .or(z.literal('')),

  status: z.enum(['active', 'inactive']),

  notes: z
    .string()
    .max(
      VALIDATION_RULES.NOTES.MAX,
      `Las notas deben tener máximo ${VALIDATION_RULES.NOTES.MAX} caracteres`,
    )
    .trim()
    .optional()
    .or(z.literal('')),
})

/**
 * Schema completo del formulario con validación cross-field
 * ✅ SIN .default() - los defaults se manejan en initialValues de useForm
 */
export const accommodationFullSchema = accommodationBasicSchema
  .extend({
    selectedAreas: z.array(selectedAreaSchema),
    selectedElements: z.array(selectedElementSchema),
  })
  .superRefine((data, ctx) => {
    // Validación: Si hay áreas, debe haber elementos
    if (data.selectedAreas.length > 0 && data.selectedElements.length === 0) {
      ctx.issues.push({
        code: 'custom',
        message: 'Debes seleccionar al menos un elemento para las áreas configuradas',
        path: ['selectedElements'],
        input: data.selectedElements,
      })
      return z.NEVER
    }

    // Validación adicional: Cada área debe tener al menos 1 elemento
    if (data.selectedAreas.length > 0 && data.selectedElements.length > 0) {
      const areasWithoutElements = data.selectedAreas.filter((area) => {
        const areaKey = `${area.area_catalog_id}-${area.room_number || 0}`
        return !data.selectedElements.some((element) => {
          const elementKey = `${element.area_catalog_id}-${element.room_number || 0}`
          return elementKey === areaKey
        })
      })

      if (areasWithoutElements.length > 0) {
        ctx.issues.push({
          code: 'custom',
          message: `Hay ${areasWithoutElements.length} área(s) sin elementos seleccionados`,
          path: ['selectedElements'],
          input: data.selectedElements,
        })
        return z.NEVER
      }
    }
  })

/**
 * Tipos inferidos desde Zod
 */
export type SelectedAreaType = z.infer<typeof selectedAreaSchema>
export type SelectedElementType = z.infer<typeof selectedElementSchema>
export type AccommodationBasicFormValues = z.infer<typeof accommodationBasicSchema>
export type AccommodationFullFormValues = z.infer<typeof accommodationFullSchema>

/**
 * Schema para vee-validate (solo campos básicos)
 */
export const accommodationValidationSchema = toTypedSchema(accommodationBasicSchema)

/**
 * Schema para validación manual completa (incluye áreas/elementos)
 */
export const accommodationFullValidationSchema = accommodationFullSchema
