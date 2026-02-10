import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

// Rate limiting storage (in-memory, use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
  
  const record = rateLimitStore.get(identifier);
  
  if (!record || record.resetAt < now) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }
  
  if (record.count >= maxRequests) {
    // Rate limit exceeded
    const resetIn = Math.ceil((record.resetAt - now) / 1000);
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
        retryAfter: resetIn,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetAt).toISOString(),
        },
      }
    );
  }
  
  // Increment count
  record.count++;
  
  return null;
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Prefer IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to user agent (less reliable)
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Extract IP address from request
 */
export function getIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * CORS headers for API routes
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  const isAllowed = origin && (
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(origin)
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Standard API response wrapper
 */
export function apiResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
) {
  return NextResponse.json(
    { success: true, data },
    { status, headers }
  );
}

/**
 * Standard API error response
 */
export function apiError(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
) {
  return NextResponse.json(
    { success: false, error: message, errors },
    { status }
  );
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid session' },
      { status: 401 }
    );
  }
}

/**
 * Super admin authentication middleware
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }
    
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid session' },
      { status: 401 }
    );
  }
}

/**
 * Validate request body
 */
export async function getRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return null;
    }
    
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Get query parameters as object
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Sanitize filename for upload
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
  
  return `${sanitizeFilename(baseName)}_${timestamp}_${random}.${extension}`;
}

/**
 * Check if request is from Vercel
 */
export function isVercelRequest(request: NextRequest): boolean {
  return request.headers.get('x-vercel-id') !== null;
}

/**
 * Get request protocol (http/https)
 */
export function getProtocol(request: NextRequest): string {
  return request.headers.get('x-forwarded-proto') || 'http';
}

/**
 * Get full URL from request
 */
export function getFullUrl(request: NextRequest): string {
  const protocol = getProtocol(request);
  const host = request.headers.get('host') || 'localhost:3000';
  return `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
}

/**
 * Log API request
 */
export function logRequest(
  request: NextRequest,
  responseStatus: number,
  duration: number
) {
  const method = request.method;
  const url = request.nextUrl.pathname;
  const ip = getIpAddress(request);
  
  console.log(
    `[${new Date().toISOString()}] ${method} ${url} ${responseStatus} ${duration}ms - ${ip}`
  );
}

/**
 * Create request logger middleware
 */
export function createRequestLogger() {
  const startTime = Date.now();
  
  return {
    startTime,
    log: (request: NextRequest, response: NextResponse) => {
      const duration = Date.now() - startTime;
      logRequest(request, response.status, duration);
    },
  };
}