import crypto from 'crypto';
import supabase from '../config/database.js';

// Кеш для предотвращения replay-атак
const usedHashes = new Set();
const HASH_EXPIRY = 5 * 60 * 1000; // 5 минут

export const validateTelegramAuth = async (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) {
      return res.status(401).json({ error: 'No auth data provided' });
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = params.get('auth_date');
    
    if (!hash || !authDate) {
      return res.status(401).json({ error: 'Invalid auth data format' });
    }

    // Проверка времени (не старше 24 часов)
    const authTimestamp = parseInt(authDate) * 1000;
    const now = Date.now();
    if (now - authTimestamp > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Auth data expired' });
    }

    // Защита от replay-атак
    if (usedHashes.has(hash)) {
      return res.status(401).json({ error: 'Auth data already used' });
    }

    params.delete('hash');

    // Создание data-check-string
    const dataCheckArr = [];
    for (const [key, value] of params.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Валидация подписи
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Добавление в кеш использованных хешей
    usedHashes.add(hash);
    setTimeout(() => usedHashes.delete(hash), HASH_EXPIRY);

    // Парсинг данных пользователя
    const userData = JSON.parse(params.get('user'));
    
    // Upsert пользователя
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        language_code: userData.language_code,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to authenticate user');
    }

    req.user = user;
    req.telegramData = userData;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default validateTelegramAuth;
