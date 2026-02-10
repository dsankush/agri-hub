import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Type-safe database connection with connection pooling
class Database {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      this.pool = new Pool({
        connectionString,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        // SSL required for Supabase
        ssl: {
          rejectUnauthorized: false,
        },
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('Unexpected database pool error', err);
      });
    }

    return this.pool;
  }

  /**
   * Execute a parameterized query (SQL injection safe)
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a single row
   */
  async getOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Get multiple rows
   */
  async getMany<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Insert and return inserted row
   */
  async insert<T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const text = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query<T>(text, values);
    return result.rows[0];
  }

  /**
   * Update and return updated row
   */
  async update<T extends QueryResultRow = any>(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const text = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query<T>(text, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * Delete and return deleted row
   */
  async delete<T extends QueryResultRow = any>(
    table: string,
    id: string
  ): Promise<T | null> {
    const text = `
      DELETE FROM ${table}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query<T>(text, [id]);
    return result.rows[0] || null;
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const db = new Database();

export default db;

// Type exports for better DX
export type { QueryResult, QueryResultRow, PoolClient };