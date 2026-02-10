import db from './db';
import { getCurrentUser } from './auth';

/**
 * Audit log actions
 */
export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Products
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_BULK_UPLOAD = 'PRODUCT_BULK_UPLOAD',
  
  // Columns
  COLUMN_CREATE = 'COLUMN_CREATE',
  COLUMN_UPDATE = 'COLUMN_UPDATE',
  COLUMN_DELETE = 'COLUMN_DELETE',
  
  // Users
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  
  // System
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE',
  EXPORT_DATA = 'EXPORT_DATA',
}

/**
 * Entity types for audit logs
 */
export enum EntityType {
  PRODUCT = 'product',
  COLUMN = 'column',
  USER = 'user',
  SESSION = 'session',
  UPLOAD = 'upload',
  SYSTEM = 'system',
}

/**
 * Create audit log entry
 */
export async function createAuditLog(params: {
  action: AuditAction | string;
  entityType: EntityType | string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string; // Optional override
}): Promise<void> {
  try {
    // Get current user if not provided
    let userId = params.userId;
    if (!userId) {
      const user = await getCurrentUser();
      userId = user?.id;
    }

    await db.query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        params.action,
        params.entityType,
        params.entityId || null,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        params.ipAddress || null,
        params.userAgent || null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should not break main functionality
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs with pagination and filtering
 */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;
  
  // Build WHERE clauses
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (params.userId) {
    conditions.push(`user_id = $${paramIndex}`);
    values.push(params.userId);
    paramIndex++;
  }
  
  if (params.action) {
    conditions.push(`action = $${paramIndex}`);
    values.push(params.action);
    paramIndex++;
  }
  
  if (params.entityType) {
    conditions.push(`entity_type = $${paramIndex}`);
    values.push(params.entityType);
    paramIndex++;
  }
  
  if (params.entityId) {
    conditions.push(`entity_id = $${paramIndex}`);
    values.push(params.entityId);
    paramIndex++;
  }
  
  if (params.startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    values.push(params.startDate);
    paramIndex++;
  }
  
  if (params.endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    values.push(params.endDate);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
  const countResult = await db.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);
  
  // Get logs with user info
  const logsQuery = `
    SELECT 
      a.*,
      u.email as user_email,
      u.full_name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const logs = await db.getMany(logsQuery, [...values, limit, offset]);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string) {
  return db.getOne(
    `SELECT 
      a.*,
      u.email as user_email,
      u.full_name as user_name
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [id]
  );
}

/**
 * Get recent activity for a user
 */
export async function getUserRecentActivity(userId: string, limit: number = 10) {
  return db.getMany(
    `SELECT * FROM audit_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}

/**
 * Get activity for an entity
 */
export async function getEntityActivity(
  entityType: string,
  entityId: string,
  limit: number = 20
) {
  return db.getMany(
    `SELECT 
      a.*,
      u.email as user_email,
      u.full_name as user_name
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.entity_type = $1 AND a.entity_id = $2
     ORDER BY a.created_at DESC
     LIMIT $3`,
    [entityType, entityId, limit]
  );
}

/**
 * Get audit statistics
 */
export async function getAuditStats(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (params?.startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    values.push(params.startDate);
    paramIndex++;
  }
  
  if (params?.endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    values.push(params.endDate);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';
  
  // Total logs
  const totalResult = await db.query(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
    values
  );
  
  // By action
  const byActionResult = await db.query(
    `SELECT action, COUNT(*) as count
     FROM audit_logs ${whereClause}
     GROUP BY action
     ORDER BY count DESC`,
    values
  );
  
  // By entity type
  const byEntityResult = await db.query(
    `SELECT entity_type, COUNT(*) as count
     FROM audit_logs ${whereClause}
     GROUP BY entity_type
     ORDER BY count DESC`,
    values
  );
  
  // By user
  const byUserResult = await db.query(
    `SELECT 
      u.email,
      u.full_name,
      COUNT(*) as count
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     ${whereClause}
     GROUP BY u.email, u.full_name
     ORDER BY count DESC
     LIMIT 10`,
    values
  );
  
  return {
    total: parseInt(totalResult.rows[0].total),
    byAction: byActionResult.rows,
    byEntity: byEntityResult.rows,
    byUser: byUserResult.rows,
  };
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await db.query(
    'DELETE FROM audit_logs WHERE created_at < $1',
    [cutoffDate]
  );
  
  return result.rowCount || 0;
}

/**
 * Export audit logs to JSON
 */
export async function exportAuditLogs(params?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  entityType?: string;
}) {
  const logs = await getAuditLogs({
    ...params,
    limit: 10000, // Max export limit
  });
  
  return {
    exportDate: new Date().toISOString(),
    filters: params,
    logs: logs.logs,
    total: logs.pagination.total,
  };
}

/**
 * Helper to compare old and new values for audit log
 */
export function getChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } {
  const changed = {
    old: {} as Record<string, any>,
    new: {} as Record<string, any>,
  };
  
  // Check all new values
  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changed.old[key] = oldValues[key];
      changed.new[key] = newValues[key];
    }
  }
  
  // Check for deleted keys
  for (const key in oldValues) {
    if (!(key in newValues)) {
      changed.old[key] = oldValues[key];
      changed.new[key] = null;
    }
  }
  
  return changed;
}