// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  company_name: string;
  product_name: string;
  brand_name: string | null;
  product_description: string | null;
  product_type: string | null;
  sub_type: string | null;
  applied_seasons: string[] | null;
  suitable_crops: string[] | null;
  benefits: string | null;
  dosage: string | null;
  application_method: string | null;
  pack_sizes: string[] | null;
  price_range: string | null;
  available_states: string[] | null;
  organic_certified: boolean;
  iso_certified: boolean;
  govt_approved: boolean;
  product_image_url: string | null;
  source_url: string | null;
  notes: string | null;
  is_active: boolean;
  view_count: number;
  custom_fields: Record<string, any>;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductColumn {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'json' | 'date' | 'url';
  visible: boolean;
  filterable: boolean;
  required: boolean;
  default_value: string | null;
  validation_rules: Record<string, any> | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  user_email?: string;
  user_name?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  created_at: Date;
}

export interface UploadHistory {
  id: string;
  user_id: string;
  filename: string;
  file_type: 'csv' | 'xlsx';
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_log: Record<string, any> | null;
  created_at: Date;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProductFormData {
  company_name: string;
  product_name: string;
  brand_name?: string;
  product_description?: string;
  product_type?: string;
  sub_type?: string;
  applied_seasons?: string[];
  suitable_crops?: string[];
  benefits?: string;
  dosage?: string;
  application_method?: string;
  pack_sizes?: string[];
  price_range?: string;
  available_states?: string[];
  organic_certified?: boolean;
  iso_certified?: boolean;
  govt_approved?: boolean;
  product_image_url?: string;
  source_url?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCompanies: number;
  totalUploads: number;
  recentActivity: AuditLog[];
  productsByType: { type: string; count: number }[];
  productsByCrop: { crop: string; count: number }[];
}
