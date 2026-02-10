import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);

const BUCKET_NAME = 'product-images';

export async function uploadProductImage(file: File, productId?: string) {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = productId
      ? `products/${productId}/${timestamp}_${random}.${extension}`
      : `products/temp/${timestamp}_${random}.${extension}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME).upload(filename, file, { cacheControl: '3600', upsert: false });
    if (error) return null;

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } catch {
    return null;
  }
}

export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);
    return !error;
  } catch {
    return false;
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (file.size > maxSize) return { valid: false, error: 'File size must be less than 10MB' };
  if (!allowedTypes.includes(file.type)) return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF are allowed' };
  return { valid: true };
}
