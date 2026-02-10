import db from './db';
import { getCurrentUser } from './auth';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_BULK_UPLOAD = 'PRODUCT_BULK_UPLOAD',
  COLUMN_CREATE = 'COLUMN_CREATE',
  COLUMN_UPDATE = 'COLUMN_UPDATE',
  COLUMN_DELETE = 'COLUMN_DELETE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
}

export async function createAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}): Promise<void> {
  try {
    let userId = params.userId;
    if (!userId) {
      try {
        const user = await getCurrentUser();
        userId = user?.id;
      } catch { /* ignore */ }
    }

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null, params.action, params.entityType,
        params.entityId || null,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        params.ipAddress || null, params.userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(params: {
  page?: number; limit?: number; action?: string; entityType?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.action) { conditions.push(`a.action = $${idx}`); values.push(params.action); idx++; }
  if (params.entityType) { conditions.push(`a.entity_type = $${idx}`); values.push(params.entityType); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(`SELECT COUNT(*) FROM audit_logs a ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const logs = await db.getMany(
    `SELECT a.*, u.email as user_email, u.full_name as user_name
     FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
     ${where} ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
