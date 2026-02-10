import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Public client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);

// Storage bucket name
const BUCKET_NAME = 'product-images';

/**
 * Initialize storage bucket (run once during setup)
 */
export async function initializeStorage() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
      
      if (error) {
        console.error('Failed to create storage bucket:', error);
        return false;
      }
      
      console.log('Storage bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Storage initialization error:', error);
    return false;
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = productId
      ? `products/${productId}/${timestamp}_${random}.${extension}`
      : `products/temp/${timestamp}_${random}.${extension}`;
    
    // Upload file
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
}

/**
 * Upload image from URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  productId?: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const blob = await response.blob();
    const extension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = productId
      ? `products/${productId}/${Date.now()}.${extension}`
      : `products/temp/${Date.now()}.${extension}`;
    
    // Upload
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Image upload from URL failed:', error);
    return null;
  }
}

/**
 * Delete image from storage
 */
export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
}

/**
 * List images for a product
 */
export async function listProductImages(productId: string) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(`products/${productId}`);
    
    if (error) {
      console.error('List error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Image listing failed:', error);
    return [];
  }
}

/**
 * Get signed URL for private images (if needed in future)
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL generation failed:', error);
    return null;
  }
}

/**
 * Move image from temp to product folder
 */
export async function moveImageToProduct(
  tempPath: string,
  productId: string
): Promise<{ url: string; path: string } | null> {
  try {
    const filename = tempPath.split('/').pop();
    const newPath = `products/${productId}/${filename}`;
    
    // Copy to new location
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .move(tempPath, newPath);
    
    if (error) {
      console.error('Move error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newPath);
    
    return {
      url: urlData.publicUrl,
      path: newPath,
    };
  } catch (error) {
    console.error('Image move failed:', error);
    return null;
  }
}

/**
 * Clean up temp images older than 24 hours
 */
export async function cleanupTempImages(): Promise<number> {
  try {
    const { data: files } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('products/temp');
    
    if (!files) return 0;
    
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldFiles = files.filter(file => {
      const createdAt = new Date(file.created_at).getTime();
      return createdAt < oneDayAgo;
    });
    
    if (oldFiles.length === 0) return 0;
    
    const paths = oldFiles.map(file => `products/temp/${file.name}`);
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(paths);
    
    if (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
    
    return oldFiles.length;
  } catch (error) {
    console.error('Temp cleanup failed:', error);
    return 0;
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats() {
  try {
    const { data: files } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('products', {
        limit: 1000,
        offset: 0,
      });
    
    if (!files) {
      return { totalFiles: 0, totalSize: 0 };
    }
    
    const totalSize = files.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
    
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error('Storage stats error:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: '0' };
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }
  
  return { valid: true };
}

/**
 * Generate thumbnail URL (Supabase transformation)
 */
export function getThumbnailUrl(publicUrl: string, width: number = 200): string {
  // Supabase image transformation
  // https://supabase.com/docs/guides/storage/image-transformations
  return `${publicUrl}?width=${width}&quality=80`;
}