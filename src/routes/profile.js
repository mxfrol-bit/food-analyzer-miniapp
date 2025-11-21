import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import supabase from '../config/database.js';

const router = express.Router();

// Обновление профиля пользователя
router.put('/update', validateTelegramAuth, async (req, res) => {
  try {
    const { age, weight, height, gender, activity_level, goal } = req.body;

    // Валидация
    const updates = {};
    
    if (age !== undefined) {
      if (age < 10 || age > 120) {
        return res.status(400).json({ error: 'Invalid age (must be 10-120)' });
      }
      updates.age = age;
    }
    
    if (weight !== undefined) {
      if (weight < 30 || weight > 300) {
        return res.status(400).json({ error: 'Invalid weight (must be 30-300 kg)' });
      }
      updates.weight = weight;
    }
    
    if (height !== undefined) {
      if (height < 100 || height > 250) {
        return res.status(400).json({ error: 'Invalid height (must be 100-250 cm)' });
      }
      updates.height = height;
    }
    
    if (gender !== undefined) {
      if (!['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender' });
      }
      updates.gender = gender;
    }
    
    if (activity_level !== undefined) {
      const validLevels = ['sedentary', 'light', 'moderate', 'high', 'extreme'];
      if (!validLevels.includes(activity_level)) {
        return res.status(400).json({ error: 'Invalid activity level' });
      }
      updates.activity_level = activity_level;
    }
    
    if (goal !== undefined) {
      const validGoals = ['lose_weight', 'maintain', 'gain_muscle'];
      if (!validGoals.includes(goal)) {
        return res.status(400).json({ error: 'Invalid goal' });
      }
      updates.goal = goal;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Profile updated for user:', req.user.telegram_id);

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Получение полного профиля
router.get('/me', validateTelegramAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Расчет TDEE и рекомендуемых макросов
router.get('/tdee', validateTelegramAuth, (req, res) => {
  try {
    const { age, weight, height, gender, activity_level, goal } = req.user;

    if (!age || !weight || !height || !gender) {
      return res.status(400).json({ 
        error: 'Profile incomplete',
        message: 'Please complete your profile (age, weight, height, gender)'
      });
    }

    // Mifflin-St Jeor Formula для BMR
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Коэффициенты активности
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      high: 1.725,
      extreme: 1.9
    };

    const multiplier = activityMultipliers[activity_level] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // Корректировка под цель
    let targetCalories = tdee;
    if (goal === 'lose_weight') {
      targetCalories = Math.round(tdee * 0.8); // -20%
    } else if (goal === 'gain_muscle') {
      targetCalories = Math.round(tdee * 1.1); // +10%
    }

    // Расчет макросов
    const macros = calculateMacros(targetCalories, goal);

    res.json({
      success: true,
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      macros,
      goal
    });
  } catch (error) {
    console.error('TDEE calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate TDEE' });
  }
});

// Вспомогательная функция расчета макронутриентов
const calculateMacros = (calories, goal) => {
  let proteinPercent, carbsPercent, fatsPercent;

  if (goal === 'lose_weight') {
    proteinPercent = 0.35; // 35% белки
    carbsPercent = 0.35;   // 35% углеводы
    fatsPercent = 0.30;    // 30% жиры
  } else if (goal === 'gain_muscle') {
    proteinPercent = 0.30; // 30% белки
    carbsPercent = 0.45;   // 45% углеводы
    fatsPercent = 0.25;    // 25% жиры
  } else {
    proteinPercent = 0.30; // 30% белки
    carbsPercent = 0.40;   // 40% углеводы
    fatsPercent = 0.30;    // 30% жиры
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 kcal/g
    carbs: Math.round((calories * carbsPercent) / 4),     // 4 kcal/g
    fats: Math.round((calories * fatsPercent) / 9)        // 9 kcal/g
  };
};

export default router;
