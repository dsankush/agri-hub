import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const productSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  product_name: z.string().min(1, 'Product name is required').max(255),
  brand_name: z.string().max(255).optional().nullable(),
  product_description: z.string().optional().nullable(),
  product_type: z.string().max(255).optional().nullable(),
  sub_type: z.string().max(255).optional().nullable(),
  applied_seasons: z.array(z.string()).optional().nullable(),
  suitable_crops: z.array(z.string()).optional().nullable(),
  pack_sizes: z.array(z.string()).optional().nullable(),
  available_states: z.array(z.string()).optional().nullable(),
  benefits: z.string().optional().nullable(),
  dosage: z.string().max(255).optional().nullable(),
  application_method: z.string().max(255).optional().nullable(),
  price_range: z.string().max(100).optional().nullable(),
  organic_certified: z.boolean().default(false),
  iso_certified: z.boolean().default(false),
  govt_approved: z.boolean().default(false),
  product_image_url: z.string().url().optional().nullable().or(z.literal('')),
  source_url: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

export const productFilterSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  search: z.string().optional(),
  company_name: z.string().optional(),
  product_type: z.string().optional(),
  brand_name: z.string().optional(),
  suitable_crops: z.string().optional(),
  applied_seasons: z.string().optional(),
  available_states: z.string().optional(),
  organic_certified: z.string().optional(),
  iso_certified: z.string().optional(),
  govt_approved: z.string().optional(),
  sort_by: z.enum(['company_name', 'product_name', 'created_at', 'updated_at']).catch('created_at'),
  sort_order: z.enum(['asc', 'desc']).catch('desc'),
});

export const columnSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Must be lowercase with underscores'),
  label: z.string().min(1).max(255),
  type: z.enum(['text', 'number', 'boolean', 'array', 'json', 'date', 'url']),
  visible: z.boolean().default(true),
  filterable: z.boolean().default(false),
  required: z.boolean().default(false),
  default_value: z.string().optional().nullable(),
  display_order: z.number().int().default(999),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  
  const errors: Record<string, string[]> = {};
  const zodError = result.error as z.ZodError;
  zodError.issues.forEach((issue: z.ZodIssue) => {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  });
  return { success: false, errors };
}

export type ProductInput = z.infer<typeof productSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
