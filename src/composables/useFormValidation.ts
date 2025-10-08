import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { z } from 'zod'

/**
 * Composable genérico para formularios con vee-validate
 */
export const useFormValidation = <TSchema extends z.ZodType>(
  schema: TSchema,
  initialValues?: Partial<z.infer<TSchema>>,
) => {
  return useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: initialValues as Record<string, unknown>,
  })
}
