import Redis from 'ioredis';
import { jest } from '@jest/globals';

// Shared storage for the mock instance
let globalDataStore = new Map<string, any>();
let globalExpirations = new Map<string, NodeJS.Timeout>();

/**
 * Resets all mock Redis data to its initial state
 */
export function resetMockRedisData(): void {
  // Clear the in-memory data store
  globalDataStore.clear();
  
  // Reset all expiration timers
  for (const timeout of globalExpirations.values()) {
    clearTimeout(timeout);
  }
  globalExpirations.clear();
  
  // Reset all mock function call counts
  jest.clearAllMocks();
}

/**
 * Mock implementation of Redis client that stores data in memory
 */
class RedisMock {
  private dataStore: Map<string, any>;
  private expirations: Map<string, NodeJS.Timeout>;
  private keyPrefix: string;

  /**
   * Creates a new Redis mock instance with optional configuration
   */
  constructor(options?: any) {
    // Initialize empty data store
    this.dataStore = globalDataStore;
    // Initialize empty expirations map
    this.expirations = globalExpirations;
    // Set keyPrefix from options if provided
    this.keyPrefix = options?.keyPrefix || '';
  }

  /**
   * Apply prefix to key if prefix is set
   */
  private prefixKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}${key}` : key;
  }

  /**
   * Apply prefix to multiple keys
   */
  private prefixKeys(keys: string[]): string[] {
    if (!this.keyPrefix) return keys;
    return keys.map(key => this.prefixKey(key));
  }

  /**
   * Mock implementation of Redis get method
   */
  async get(key: string): Promise<string | null> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    // Return value from data store or null if not found
    const value = this.dataStore.get(prefixedKey);
    return value !== undefined ? String(value) : null;
  }

  /**
   * Mock implementation of Redis set method
   */
  async set(key: string, value: string, expiryMode?: string, time?: number): Promise<string> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    // Store value in data store
    this.dataStore.set(prefixedKey, value);
    
    // If expiry is set, create timeout to remove key after expiry
    if (expiryMode === 'EX' && time !== undefined) {
      this.setExpiry(prefixedKey, time * 1000);
    } else if (expiryMode === 'PX' && time !== undefined) {
      this.setExpiry(prefixedKey, time);
    }
    
    // Return 'OK'
    return 'OK';
  }

  /**
   * Mock implementation of Redis setex method
   */
  async setex(key: string, seconds: number, value: string): Promise<string> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    // Store value in data store
    this.dataStore.set(prefixedKey, value);
    // Create timeout to remove key after specified seconds
    this.setExpiry(prefixedKey, seconds * 1000);
    // Return 'OK'
    return 'OK';
  }

  /**
   * Set expiry timeout for a key
   */
  private setExpiry(key: string, milliseconds: number): void {
    // Clear any existing expiration
    if (this.expirations.has(key)) {
      clearTimeout(this.expirations.get(key)!);
    }
    
    // Set new expiration
    const timeout = setTimeout(() => {
      this.dataStore.delete(key);
      this.expirations.delete(key);
    }, milliseconds);
    
    this.expirations.set(key, timeout);
  }

  /**
   * Mock implementation of Redis del method
   */
  async del(keys: string | string[]): Promise<number> {
    // Apply key prefix to all keys
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const prefixedKeys = this.prefixKeys(keyArray);
    
    // Remove keys from data store
    let count = 0;
    for (const key of prefixedKeys) {
      if (this.dataStore.has(key)) {
        this.dataStore.delete(key);
        count++;
        
        // Clear any associated expiration timers
        if (this.expirations.has(key)) {
          clearTimeout(this.expirations.get(key)!);
          this.expirations.delete(key);
        }
      }
    }
    
    // Return count of keys removed
    return count;
  }

  /**
   * Mock implementation of Redis exists method
   */
  async exists(keys: string | string[]): Promise<number> {
    // Apply key prefix to all keys
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const prefixedKeys = this.prefixKeys(keyArray);
    
    // Count how many keys exist in data store
    let count = 0;
    for (const key of prefixedKeys) {
      if (this.dataStore.has(key)) {
        count++;
      }
    }
    
    // Return count
    return count;
  }

  /**
   * Mock implementation of Redis expire method
   */
  async expire(key: string, seconds: number): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Check if key exists in data store
    if (this.dataStore.has(prefixedKey)) {
      // If key exists, set expiration timeout
      this.setExpiry(prefixedKey, seconds * 1000);
      return 1;
    }
    
    // Return 1 if timeout was set, 0 otherwise
    return 0;
  }

  /**
   * Mock implementation of Redis ttl method
   */
  async ttl(key: string): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Check if key exists in data store
    if (!this.dataStore.has(prefixedKey)) {
      return -2; // Key doesn't exist
    }
    
    // If key exists and has expiration, calculate remaining time
    if (!this.expirations.has(prefixedKey)) {
      return -1; // Key exists but has no expiry
    }
    
    // Return TTL, -1, or -2 as appropriate
    // For testing purposes, we return a positive value to indicate there is an expiry
    return 1000;
  }

  /**
   * Mock implementation of Redis incr method
   */
  async incr(key: string): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Get current value or initialize to 0
    let value = parseInt(this.dataStore.get(prefixedKey) || '0', 10);
    // Increment value and store
    value++;
    
    this.dataStore.set(prefixedKey, String(value));
    // Return new value
    return value;
  }

  /**
   * Mock implementation of Redis decr method
   */
  async decr(key: string): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Get current value or initialize to 0
    let value = parseInt(this.dataStore.get(prefixedKey) || '0', 10);
    // Decrement value and store
    value--;
    
    this.dataStore.set(prefixedKey, String(value));
    // Return new value
    return value;
  }

  /**
   * Mock implementation of Redis hset method
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Initialize hash if it doesn't exist
    if (!this.dataStore.has(prefixedKey)) {
      this.dataStore.set(prefixedKey, {});
    }
    
    const hash = this.dataStore.get(prefixedKey);
    // Check if field already exists
    const isNewField = !(field in hash);
    
    // Set field value in hash
    hash[field] = value;
    // Return 1 if new field, 0 if updated
    return isNewField ? 1 : 0;
  }

  /**
   * Mock implementation of Redis hget method
   */
  async hget(key: string, field: string): Promise<string | null> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Check if hash exists
    if (!this.dataStore.has(prefixedKey)) {
      return null;
    }
    
    const hash = this.dataStore.get(prefixedKey);
    // Return field value or null if not found
    return field in hash ? String(hash[field]) : null;
  }

  /**
   * Mock implementation of Redis hgetall method
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Return hash object or empty object if not found
    if (!this.dataStore.has(prefixedKey)) {
      return {};
    }
    
    return this.dataStore.get(prefixedKey);
  }

  /**
   * Mock implementation of Redis hdel method
   */
  async hdel(key: string, fields: string | string[]): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Check if hash exists
    if (!this.dataStore.has(prefixedKey)) {
      return 0;
    }
    
    const hash = this.dataStore.get(prefixedKey);
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    
    // Delete specified fields
    let count = 0;
    for (const field of fieldArray) {
      if (field in hash) {
        delete hash[field];
        count++;
      }
    }
    
    // Return count of fields removed
    return count;
  }

  /**
   * Mock implementation of Redis lpush method
   */
  async lpush(key: string, values: string | string[]): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Initialize list if it doesn't exist
    if (!this.dataStore.has(prefixedKey)) {
      this.dataStore.set(prefixedKey, []);
    }
    
    const list = this.dataStore.get(prefixedKey);
    const valueArray = Array.isArray(values) ? values : [values];
    
    // Add values to beginning of list
    this.dataStore.set(prefixedKey, [...valueArray.reverse(), ...list]);
    
    // Return new list length
    return this.dataStore.get(prefixedKey).length;
  }

  /**
   * Mock implementation of Redis rpush method
   */
  async rpush(key: string, values: string | string[]): Promise<number> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Initialize list if it doesn't exist
    if (!this.dataStore.has(prefixedKey)) {
      this.dataStore.set(prefixedKey, []);
    }
    
    const list = this.dataStore.get(prefixedKey);
    const valueArray = Array.isArray(values) ? values : [values];
    
    // Add values to end of list
    this.dataStore.set(prefixedKey, [...list, ...valueArray]);
    
    // Return new list length
    return this.dataStore.get(prefixedKey).length;
  }

  /**
   * Mock implementation of Redis lrange method
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    // Apply key prefix if set
    const prefixedKey = this.prefixKey(key);
    
    // Check if list exists
    if (!this.dataStore.has(prefixedKey)) {
      return [];
    }
    
    const list = this.dataStore.get(prefixedKey);
    
    // Handle negative indices (counting from the end)
    const length = list.length;
    let s = start < 0 ? Math.max(length + start, 0) : start;
    let e = stop < 0 ? length + stop : stop;
    
    // stop is inclusive in Redis
    // Return elements in specified range or empty array
    return list.slice(s, e + 1);
  }

  /**
   * Mock implementation of Redis flushall method
   */
  async flushall(): Promise<string> {
    // Clear all data from data store
    // Clear all expiration timers
    resetMockRedisData();
    // Return 'OK'
    return 'OK';
  }

  /**
   * Mock implementation of Redis quit method
   */
  async quit(): Promise<string> {
    // Return 'OK' (no actual connection to close)
    return 'OK';
  }

  /**
   * Mock implementation of Redis on method for event handling
   */
  on(event: string, callback: Function): RedisMock {
    // Store event callback (not actually called in mock)
    // Return this for chaining
    return this;
  }
}

// Create and export a singleton instance
export const redisMock = new RedisMock();
export { resetMockRedisData };