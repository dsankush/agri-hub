import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';
import crypto from 'crypto';
import type { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars';
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'auth_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: Omit<JWTPayload, 'sessionId'>, sessionId: string): string {
  return jwt.sign({ ...payload, sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const user = await db.getOne<User>('SELECT id, email, role FROM users WHERE id = $1', [userId]);
  if (!user) throw new Error('User not found');

  const token = generateToken({ userId: user.id, email: user.email, role: user.role }, sessionId);
  const tokenHash = hashToken(token);

  await db.query(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, tokenHash, ipAddress, userAgent, expiresAt]
  );

  return token;
}

export async function validateSession(token: string): Promise<SessionUser | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);
  const session = await db.getOne(
    `SELECT s.*, u.id as user_id, u.email, u.full_name, u.role, u.is_active
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.token_hash = $2 AND s.expires_at > NOW()`,
    [payload.sessionId, tokenHash]
  );

  if (!session || !session.is_active) return null;

  return {
    id: session.user_id,
    email: session.email,
    full_name: session.full_name,
    role: session.role,
    is_active: session.is_active,
    created_at: session.created_at,
    sessionId: payload.sessionId,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return validateSession(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) throw new Error('Forbidden');
  return user;
}

export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  const user = await db.getOne<User & { password_hash: string }>(
    'SELECT * FROM users WHERE email = $1 AND is_active = true', [email]
  );
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  const token = await createSession(user.id, ipAddress, userAgent);

  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  if (user?.sessionId) await deleteSession(user.sessionId);
  await deleteAuthCookie();
}

export async function createUser(email: string, password: string, fullName: string, role: string = 'admin') {
  const passwordHash = await hashPassword(password);
  return db.insert('users', { email, password_hash: passwordHash, full_name: fullName, role });
}
