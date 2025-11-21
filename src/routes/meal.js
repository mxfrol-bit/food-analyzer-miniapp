import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import supabase from '../config/database.js';

const router = express.Router();

// Добавить прием пищи
router.post('/add', validateTelegramAuth, async (req, res) => {
  try {
    const { 
      meal_type, 
      dish_name, 
      calories, 
      protein, 
      carbs, 
      fats, 
      portion_size, 
      ingredients, 
      photo_url 
    } = req.body;
    
    if (!dish_name) {
      return res.status(400).json({ error: 'dish_name is required' });
    }

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: req.user.id,
        meal_type: meal_type || 'snack',
        dish_name,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
        portion_size,
        ingredients,
        photo_url
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Meal added:', dish_name);

    res.json({ success: true, meal: data });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ error: 'Failed to add meal' });
  }
});

// Получить дневник за день
router.get('/day', validateTelegramAuth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('meal_date', date)
      .order('meal_time', { ascending: true });

    if (error) throw error;

    // Подсчет итогов за день
    const totals = data.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({ 
      success: true, 
      meals: data,
      totals,
      date
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Failed to get meals' });
  }
});

// Получить историю приемов пищи
router.get('/list', validateTelegramAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ success: true, meals: data, count: data.length });
  } catch (error) {
    console.error('Get meal list error:', error);
    res.status(500).json({ error: 'Failed to get meal list' });
  }
});

// Удалить прием пищи
router.delete('/:id', validateTelegramAuth, async (req, res) => {
  try {
    const mealId = req.params.id;

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

export default router;
