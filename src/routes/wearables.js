import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import supabase from '../config/database.js';

const router = express.Router();

// Mock синхронизация данных с браслета
router.post('/sync', validateTelegramAuth, async (req, res) => {
  try {
    const { 
      device_type, 
      steps, 
      heart_rate, 
      calories_burned, 
      sleep_hours 
    } = req.body;

    const { data, error } = await supabase
      .from('wearable_data')
      .insert({
        user_id: req.user.id,
        device_type: device_type || 'mock_device',
        steps: steps || 0,
        heart_rate: heart_rate || 0,
        calories_burned: calories_burned || 0,
        sleep_hours: sleep_hours || 0
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Wearable data synced');

    res.json({ success: true, data });
  } catch (error) {
    console.error('Wearable sync error:', error);
    res.status(500).json({ error: 'Failed to sync wearable data' });
  }
});

// Получить данные с браслета
router.get('/data', validateTelegramAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('data_date', startDate.toISOString().split('T')[0])
      .order('synced_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get wearable data error:', error);
    res.status(500).json({ error: 'Failed to get wearable data' });
  }
});

// Получить последние данные
router.get('/latest', validateTelegramAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('user_id', req.user.id)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get latest wearable data error:', error);
    res.status(404).json({ error: 'No wearable data found' });
  }
});

export default router;
