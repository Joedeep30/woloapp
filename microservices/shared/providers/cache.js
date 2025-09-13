const redis = require('redis');
const config = require('../config');

class CacheProvider {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      const redisConfig = {
        host: config.REDIS.HOST,
        port: config.REDIS.PORT,
        db: config.REDIS.DB,
        retryStrategy: (retries) => {
          if (retries > this.maxRetries) {
            console.error('❌ Redis max retries exceeded');
            return null;
          }
          return Math.min(retries * 50, 2000);
        }
      };

      if (config.REDIS.PASSWORD) {
        redisConfig.password = config.REDIS.PASSWORD;
      }

      this.client = redis.createClient(redisConfig);

      // Event listeners
      this.client.on('connect', () => {
        console.log('🔄 Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
        this.isConnected = true;
        this.retryCount = 0;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis client error:', error.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔄 Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.retryCount++;
        console.log(`🔄 Redis reconnecting... (attempt ${this.retryCount})`);
      });

      // Connect to Redis
      await this.client.connect();
      
      // Test connection
      await this.healthCheck();
      
      return true;
    } catch (error) {
      console.error('❌ Redis initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const ping = await this.client.ping();
      if (ping !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      return true;
    } catch (error) {
      console.error('Redis health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key, value, ttl = config.REDIS.TTL) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache set');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      console.error('Redis set operation failed:', error.message);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get operation failed:', error.message);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache delete');
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete operation failed:', error.message);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists operation failed:', error.message);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key, ttl) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error('Redis expire operation failed:', error.message);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async multiGet(keys) {
    try {
      if (!this.isConnected || keys.length === 0) {
        return {};
      }

      const values = await this.client.mGet(keys);
      const result = {};

      keys.forEach((key, index) => {
        try {
          result[key] = values[index] ? JSON.parse(values[index]) : null;
        } catch (parseError) {
          console.warn(`Failed to parse cached value for key ${key}:`, parseError.message);
          result[key] = null;
        }
      });

      return result;
    } catch (error) {
      console.error('Redis multiGet operation failed:', error.message);
      return {};
    }
  }

  /**
   * Set multiple key-value pairs at once
   */
  async multiSet(keyValuePairs, ttl = config.REDIS.TTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const pipeline = this.client.multi();

      Object.keys(keyValuePairs).forEach(key => {
        const serializedValue = JSON.stringify(keyValuePairs[key]);
        
        if (ttl > 0) {
          pipeline.setEx(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis multiSet operation failed:', error.message);
      return false;
    }
  }

  /**
   * Increment a counter in cache
   */
  async increment(key, amount = 1) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error('Redis increment operation failed:', error.message);
      return 0;
    }
  }

  /**
   * Add item to a list
   */
  async listPush(key, value, direction = 'right') {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const serializedValue = JSON.stringify(value);
      
      if (direction === 'left') {
        return await this.client.lPush(key, serializedValue);
      } else {
        return await this.client.rPush(key, serializedValue);
      }
    } catch (error) {
      console.error('Redis listPush operation failed:', error.message);
      return 0;
    }
  }

  /**
   * Get items from a list
   */
  async listRange(key, start = 0, stop = -1) {
    try {
      if (!this.isConnected) {
        return [];
      }

      const values = await this.client.lRange(key, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          console.warn(`Failed to parse list item:`, parseError.message);
          return value;
        }
      });
    } catch (error) {
      console.error('Redis listRange operation failed:', error.message);
      return [];
    }
  }

  /**
   * Add item to a set
   */
  async setAdd(key, ...values) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const serializedValues = values.map(value => JSON.stringify(value));
      return await this.client.sAdd(key, ...serializedValues);
    } catch (error) {
      console.error('Redis setAdd operation failed:', error.message);
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async setMembers(key) {
    try {
      if (!this.isConnected) {
        return [];
      }

      const values = await this.client.sMembers(key);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          console.warn(`Failed to parse set member:`, parseError.message);
          return value;
        }
      });
    } catch (error) {
      console.error('Redis setMembers operation failed:', error.message);
      return [];
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll() {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.flushAll();
      console.log('⚠️  Redis cache cleared');
      return true;
    } catch (error) {
      console.error('Redis flushAll operation failed:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.client.info('stats');
      const stats = {};
      
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = isNaN(value) ? value : Number(value);
        }
      });

      return stats;
    } catch (error) {
      console.error('Redis getStats operation failed:', error.message);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('✅ Redis connection closed');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error.message);
    }
  }
}

// Create singleton instance
const cacheProvider = new CacheProvider();

module.exports = cacheProvider;