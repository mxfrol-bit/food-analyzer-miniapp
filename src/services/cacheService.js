import supabase from '../config/database.js';
import crypto from 'crypto';

// In-memory кеш для быстрого доступа
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 минут

export class CacheService {
  // Генерация ключа кеша
  static generateKey(prefix, data) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  // Получение из кеша
  static async get(key) {
    // Проверка memory cache
    const memCached = memoryCache.get(key);
    if (memCached && Date.now() < memCached.expires) {
      console.log('✅ Cache hit (memory):', key);
      return memCached.data;
    }

    // Проверка DB cache
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('response_data, expires_at')
        .eq('cache_key', key)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (!error && data) {
        console.log('✅ Cache hit (database):', key);
        // Добавление в memory cache
        memoryCache.set(key, {
          data: data.response_data,
          expires: new Date(data.expires_at).getTime()
        });
        return data.response_data;
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  // Сохранение в кеш
  static async set(key, data, ttlHours = 24) {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    // Memory cache
    memoryCache.set(key, {
      data,
      expires: expiresAt.getTime()
    });

    // DB cache
    try {
      await supabase
        .from('ai_cache')
        .upsert({
          cache_key: key,
          response_data: data,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });
      console.log('💾 Cached:', key);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Очистка устаревших записей
  static async cleanup() {
    try {
      const { error } = await supabase
        .from('ai_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (!error) {
        console.log('🧹 Cache cleanup completed');
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Периодическая очистка (раз в час)
setInterval(() => {
  CacheService.cleanup();
}, 60 * 60 * 1000);

export default CacheService;
