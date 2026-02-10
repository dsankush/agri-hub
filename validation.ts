import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']).default('admin'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const productSchema = z.object({
  // Required fields
  company_name: z.string().min(1, 'Company name is required').max(255),
  product_name: z.string().min(1, 'Product name is required').max(255),
  
  // Optional fields
  brand_name: z.string().max(255).optional().nullable(),
  product_description: z.string().optional().nullable(),
  product_type: z.string().max(255).optional().nullable(),
  sub_type: z.string().max(255).optional().nullable(),
  
  // Array fields
  applied_seasons: z.array(z.string()).optional().nullable(),
  suitable_crops: z.array(z.string()).optional().nullable(),
  pack_sizes: z.array(z.string()).optional().nullable(),
  available_states: z.array(z.string()).optional().nullable(),
  
  // Text fields
  benefits: z.string().optional().nullable(),
  dosage: z.string().max(255).optional().nullable(),
  application_method: z.string().max(255).optional().nullable(),
  price_range: z.string().max(100).optional().nullable(),
  
  // Boolean fields
  organic_certified: z.boolean().default(false),
  iso_certified: z.boolean().default(false),
  govt_approved: z.boolean().default(false),
  
  // URL fields
  product_image_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  source_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  
  // Metadata
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  
  // Dynamic fields
  custom_fields: z.record(z.any()).optional(),
});

export const updateProductSchema = productSchema.partial();

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const productFilterSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  
  // Search
  search: z.string().optional(),
  
  // Exact match filters
  company_name: z.string().optional(),
  product_type: z.string().optional(),
  brand_name: z.string().optional(),
  
  // Array filters (comma-separated)
  suitable_crops: z.string().optional(), // "Maize,Wheat"
  applied_seasons: z.string().optional(),
  available_states: z.string().optional(),
  
  // Boolean filters
  organic_certified: z.enum(['true', 'false', 'all']).optional(),
  iso_certified: z.enum(['true', 'false', 'all']).optional(),
  govt_approved: z.enum(['true', 'false', 'all']).optional(),
  
  // Sorting
  sort_by: z.enum(['company_name', 'product_name', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  
  // Active only
  active_only: z.boolean().default(true),
});

// ============================================================================
// COLUMN SCHEMAS
// ============================================================================

export const productColumnSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Must be lowercase with underscores'),
  label: z.string().min(1).max(255),
  type: z.enum(['text', 'number', 'boolean', 'array', 'json', 'date', 'url']),
  visible: z.boolean().default(true),
  filterable: z.boolean().default(false),
  required: z.boolean().default(false),
  default_value: z.string().optional().nullable(),
  validation_rules: z.record(z.any()).optional().nullable(),
  display_order: z.number().int().default(999),
});

export const updateColumnSchema = productColumnSchema.partial();

// ============================================================================
// UPLOAD SCHEMAS
// ============================================================================

export const uploadConfigSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  validateOnly: z.boolean().default(false),
});

// ============================================================================
// AUDIT LOG SCHEMA
// ============================================================================

export const auditLogSchema = z.object({
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().optional(),
  old_values: z.record(z.any()).optional(),
  new_values: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
export type ProductColumnInput = z.infer<typeof productColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type UploadConfig = z.infer<typeof uploadConfigSchema>;
export type AuditLogInput = z.infer<typeof auditLogSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string[]> = {};
  
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });
  
  return { success: false, errors };
}

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}