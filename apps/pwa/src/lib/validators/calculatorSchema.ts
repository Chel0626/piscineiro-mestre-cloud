import * as z from 'zod';

// CORREÇÃO: Removemos z.coerce.number() e usamos z.number().optional()
// para manter consistência com os tipos esperados pelo formulário
export const calculatorFormSchema = z.object({
  ph: z.number().optional(),
  cloro: z.number().optional(),
  alcalinidade: z.number().optional(),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;