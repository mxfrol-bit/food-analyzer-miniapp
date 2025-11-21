import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import { generateMealPlan } from '../services/aiService.js';
import supabase from '../config/database.js';

const router = express.Router();

// Получить общие рекомендации
router.get('/', validateTelegramAuth, async (req, res) => {
  try {
    const recommendations = [
      '💧 Пейте больше воды (2-3 литра в день)',
      '🥗 Старайтесь есть больше овощей и фруктов',
      '🚫 Избегайте переработанных продуктов',
      '🍽️ Контролируйте размер порций',
      '🌅 Не пропускайте завтрак',
      '🏃 Сочетайте правильное питание с физической активностью',
      '😴 Высыпайтесь (7-9 часов сна)'
    ];

    // Персонализированные рекомендации на основе профиля
    const personalizedTips = [];

    if (req.user.goal === 'lose_weight') {
      personalizedTips.push('🎯 Для похудения: дефицит калорий 300-500 ккал/день');
      personalizedTips.push('🏋️ Добавьте кардио тренировки 3-4 раза в неделю');
    } else if (req.user.goal === 'gain_muscle') {
      personalizedTips.push('🎯 Для набора массы: профицит калорий 300-500 ккал/день');
      personalizedTips.push('💪 Силовые тренировки 4-5 раз в неделю');
      personalizedTips.push('🍖 Увеличьте потребление белка до 2г на кг веса');
    }

    res.json({ 
      success: true, 
      recommendations: [...personalizedTips, ...recommendations]
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Генерация плана питания на неделю
router.get('/week-plan', validateTelegramAuth, async (req, res) => {
  try {
    // Проверка кеша в БД
    const { data: cached } = await supabase
      .from('recommendations_cache')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('recommendation_type', 'weekly')
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      console.log('🎯 Using cached weekly meal plan');
      return res.json({ 
        success: true, 
        data: cached.content, 
        cached: true 
      });
    }

    console.log('🔄 Generating new weekly meal plan...');

    // Генерация нового плана
    const mealPlan = await generateMealPlan(req.user.id, req.user, 'weekly');

    if (mealPlan.success) {
      // Сохранение в кеш на 7 дней
      await supabase
        .from('recommendations_cache')
        .insert({
          user_id: req.user.id,
          recommendation_type: 'weekly',
          content: mealPlan.data,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      console.log('✅ Weekly meal plan generated and cached');
    }

    res.json({ 
      success: true, 
      data: mealPlan.data, 
      cached: false 
    });
  } catch (error) {
    console.error('Week plan error:', error);
    res.status(500).json({ error: 'Failed to generate week plan' });
  }
});

// Генерация плана на день
router.get('/daily-plan', validateTelegramAuth, async (req, res) => {
  try {
    const mealPlan = await generateMealPlan(req.user.id, req.user, 'daily');

    res.json({ 
      success: true, 
      data: mealPlan.data 
    });
  } catch (error) {
    console.error('Daily plan error:', error);
    res.status(500).json({ error: 'Failed to generate daily plan' });
  }
});

export default router;
