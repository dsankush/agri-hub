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
  
  // Company & Product Info
  company_name: string;
  product_name: string;
  brand_name: string | null;
  product_description: string | null;
  
  // Classification
  product_type: string | null;
  sub_type: string | null;
  
  // Application Info
  applied_seasons: string[] | null;
  suitable_crops: string[] | null;
  benefits: string | null;
  dosage: string | null;
  application_method: string | null;
  pack_sizes: string[] | null;
  price_range: string | null;
  available_states: string[] | null;
  
  // Certifications
  organic_certified: boolean;
  iso_certified: boolean;
  govt_approved: boolean;
  
  // Media
  product_image_url: string | null;
  source_url: string | null;
  
  // Metadata
  notes: string | null;
  is_active: boolean;
  view_count: number;
  
  // Dynamic fields
  custom_fields: Record<string, any>;
  
  // Audit
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

export interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
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

export interface ColumnFormData {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'json' | 'date' | 'url';
  visible?: boolean;
  filterable?: boolean;
  required?: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface UploadResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: UploadError[];
}

export interface UploadError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface UploadPreview {
  headers: string[];
  rows: any[];
  mapping: Record<string, string>;
  validationErrors: UploadError[];
}

// ============================================================================
// CHART/STATS TYPES
// ============================================================================

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCompanies: number;
  totalUploads: number;
  recentActivity: AuditLog[];
  productsByType: { type: string; count: number }[];
  productsByCrop: { crop: string; count: number }[];
}

export interface AuditStats {
  total: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity_type: string; count: number }[];
  byUser: { email: string; full_name: string; count: number }[];
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'date' | 'range';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: string | number;
  children?: MenuItem[];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// ============================================================================
// THEME TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor?: string;
  accentColor?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ValueOf<T> = T[keyof T];

export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowed: boolean;
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'json';
  columns?: string[];
  filters?: Record<string, any>;
  filename?: string;
}

// ============================================================================
// IMPORT GUARD HELPERS
// ============================================================================

export function isProduct(obj: any): obj is Product {
  return obj && typeof obj.id === 'string' && typeof obj.product_name === 'string';
}

export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isAuditLog(obj: any): obj is AuditLog {
  return obj && typeof obj.id === 'string' && typeof obj.action === 'string';
}