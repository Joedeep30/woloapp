const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

class DatabaseProvider {
  constructor() {
    this.supabase = null;
    this.adminClient = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connections
   */
  async initialize() {
    try {
      // Create regular client (with RLS enabled)
      this.supabase = createClient(
        config.DATABASE.SUPABASE_URL,
        config.DATABASE.SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false
          }
        }
      );

      // Create admin client (bypasses RLS)
      this.adminClient = createClient(
        config.DATABASE.SUPABASE_URL,
        config.DATABASE.SUPABASE_SERVICE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Test connections
      await this.healthCheck();
      
      this.isConnected = true;
      console.log('✅ Database connections initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get regular client (with RLS)
   */
  getClient(userJWT = null) {
    if (!this.isConnected) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    if (userJWT) {
      // Create a client with user JWT for RLS
      return createClient(
        config.DATABASE.SUPABASE_URL,
        config.DATABASE.SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${userJWT}`
            }
          }
        }
      );
    }

    return this.supabase;
  }

  /**
   * Get admin client (bypasses RLS)
   */
  getAdminClient() {
    if (!this.isConnected) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.adminClient;
  }

  /**
   * Execute a query with retry logic
   */
  async executeQuery(client, table, operation, data = null, filters = null) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let query = client.from(table);

        switch (operation.toLowerCase()) {
          case 'select':
            query = query.select(data || '*');
            if (filters) {
              Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                  query = query.eq(key, filters[key]);
                }
              });
            }
            break;

          case 'insert':
            if (!data) throw new Error('Data is required for insert operation');
            query = query.insert(data).select();
            break;

          case 'update':
            if (!data) throw new Error('Data is required for update operation');
            query = query.update(data);
            if (filters) {
              Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                  query = query.eq(key, filters[key]);
                }
              });
            }
            query = query.select();
            break;

          case 'delete':
            if (filters) {
              Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                  query = query.eq(key, filters[key]);
                }
              });
            }
            query = query.delete();
            break;

          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        const result = await query;

        if (result.error) {
          throw result.error;
        }

        return result.data;

      } catch (error) {
        lastError = error;
        console.warn(`Database query attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error(`Database query failed after ${maxRetries} attempts:`, lastError.message);
    throw lastError;
  }

  /**
   * Health check for database connections
   */
  async healthCheck() {
    try {
      // Test regular client
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
        throw new Error(`Regular client health check failed: ${error.message}`);
      }

      // Test admin client
      const { data: adminData, error: adminError } = await this.adminClient
        .from('profiles')
        .select('count')
        .limit(1);

      if (adminError && adminError.code !== 'PGRST116') {
        throw new Error(`Admin client health check failed: ${adminError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a new record with automatic timestamps
   */
  async create(table, data, useAdmin = false) {
    const client = useAdmin ? this.getAdminClient() : this.getClient();
    const timestamp = new Date().toISOString();
    
    const dataWithTimestamps = {
      ...data,
      created_at: timestamp,
      updated_at: timestamp
    };

    return this.executeQuery(client, table, 'insert', dataWithTimestamps);
  }

  /**
   * Update a record with automatic timestamps
   */
  async update(table, filters, data, useAdmin = false) {
    const client = useAdmin ? this.getAdminClient() : this.getClient();
    const timestamp = new Date().toISOString();
    
    const dataWithTimestamps = {
      ...data,
      updated_at: timestamp
    };

    return this.executeQuery(client, table, 'update', dataWithTimestamps, filters);
  }

  /**
   * Find records with filters
   */
  async find(table, filters = {}, useAdmin = false, userJWT = null) {
    const client = useAdmin ? this.getAdminClient() : this.getClient(userJWT);
    return this.executeQuery(client, table, 'select', '*', filters);
  }

  /**
   * Find a single record
   */
  async findOne(table, filters, useAdmin = false, userJWT = null) {
    const results = await this.find(table, filters, useAdmin, userJWT);
    return results && results.length > 0 ? results[0] : null;
  }

  /**
   * Delete records
   */
  async delete(table, filters, useAdmin = false) {
    const client = useAdmin ? this.getAdminClient() : this.getClient();
    return this.executeQuery(client, table, 'delete', null, filters);
  }

  /**
   * Execute raw SQL query (admin only)
   */
  async rawQuery(sql, params = []) {
    try {
      const { data, error } = await this.adminClient.rpc('execute_sql', {
        query: sql,
        params: params
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Raw query execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Begin a transaction (using Supabase's built-in transaction support)
   */
  async transaction(operations) {
    // Note: Supabase doesn't have explicit transaction support in the client
    // For now, we'll execute operations sequentially
    // In production, you might want to use stored procedures or raw SQL
    
    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        console.error('Transaction operation failed:', error.message);
        // In a real transaction, we would rollback here
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Close database connections
   */
  async close() {
    // Supabase client doesn't need explicit closing
    this.isConnected = false;
    console.log('✅ Database connections closed');
  }
}

// Create singleton instance
const databaseProvider = new DatabaseProvider();

module.exports = databaseProvider;