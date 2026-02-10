import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';
import crypto from 'crypto';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars';
const JWT_EXPIRES_IN = '7d'; // 7 days
const COOKIE_NAME = 'auth_token';

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export interface SessionUser extends User {
  sessionId: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'sessionId'>, sessionId: string): string {
  return jwt.sign(
    { ...payload, sessionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Hash token for database storage (SHA256)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Get user info for token
  const user = await db.getOne<User>(
    'SELECT id, email, role FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Generate token
  const token = generateToken(
    { userId: user.id, email: user.email, role: user.role },
    sessionId
  );

  const tokenHash = hashToken(token);

  // Store session in database
  await db.query(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, tokenHash, ipAddress, userAgent, expiresAt]
  );

  return token;
}

/**
 * Validate session and return user
 */
export async function validateSession(token: string): Promise<SessionUser | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);

  // Check if session exists and is valid
  const session = await db.getOne(
    `SELECT s.*, u.id, u.email, u.full_name, u.role, u.is_active
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.token_hash = $2 AND s.expires_at > NOW()`,
    [payload.sessionId, tokenHash]
  );

  if (!session || !session.is_active) {
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    full_name: session.full_name,
    role: session.role,
    is_active: session.is_active,
    created_at: session.created_at,
    sessionId: payload.sessionId,
  };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
}

/**
 * Set auth cookie (HttpOnly)
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get auth cookie
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Delete auth cookie
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get current user from cookie
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  return validateSession(token);
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

/**
 * Login user and create session
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: User; token: string } | null> {
  // Get user with password hash
  const user = await db.getOne<User & { password_hash: string }>(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (!user) return null;

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  // Update last login
  await db.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Create session
  const token = await createSession(user.id, ipAddress, userAgent);

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user && user.sessionId) {
    await deleteSession(user.sessionId);
  }
  
  await deleteAuthCookie();
}

/**
 * Create a new user (admin only)
 */
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: string = 'admin'
): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const user = await db.insert<User>('users', {
    email,
    password_hash: passwordHash,
    full_name: fullName,
    role,
  });

  return user;
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );

  // Invalidate all sessions
  await deleteAllUserSessions(userId);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}