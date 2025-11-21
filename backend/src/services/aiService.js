import axios from 'axios';
import fs from 'fs/promises';
import sharp from 'sharp';
import CacheService from './cacheService.js';

// Оптимизация изображения
const optimizeImage = async (imagePath) => {
  const outputPath = `${imagePath}.optimized.jpg`;
  await sharp(imagePath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  return outputPath;
};

// РАСШИРЕННАЯ БАЗА ПРОДУКТОВ (калории на 100г)
const FOOD_DATABASE = {
  'chicken': { cal: 165, p: 31, c: 0, f: 3.6, words: ['chicken', 'курица'] },
  'beef': { cal: 250, p: 26, c: 0, f: 15, words: ['beef', 'говядина', 'стейк'] },
  'fish': { cal: 206, p: 22, c: 0, f: 12, words: ['fish', 'рыба', 'salmon', 'tuna'] },
  'pizza': { cal: 266, p: 11, c: 33, f: 10, words: ['pizza', 'пицца'] },
  'burger': { cal: 295, p: 17, c: 24, f: 14, words: ['burger', 'бургер'] },
  'pasta': { cal: 131, p: 5, c: 25, f: 1, words: ['pasta', 'паста', 'спагетти'] },
  'rice': { cal: 130, p: 2.7, c: 28, f: 0.3, words: ['rice', 'рис'] },
  'salad': { cal: 33, p: 2.5, c: 6, f: 0.3, words: ['salad', 'салат'] },
  'bread': { cal: 265, p: 9, c: 49, f: 3, words: ['bread', 'хлеб'] },
  'egg': { cal: 155, p: 13, c: 1, f: 11, words: ['egg', 'яйцо', 'omelet'] },
  'soup': { cal: 56, p: 3, c: 8, f: 1.5, words: ['soup', 'суп'] },
  'sushi': { cal: 143, p: 6, c: 21, f: 3.6, words: ['sushi', 'суши'] },
  'potato': { cal: 77, p: 2, c: 17, f: 0.1, words: ['potato', 'картофель', 'fries'] },
  'sandwich': { cal: 226, p: 11, c: 28, f: 8, words: ['sandwich', 'сэндвич'] }
};

// Hugging Face анализ (бесплатно)
const analyzeHF = async (buffer, token) => {
  if (!token) return null;
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      buffer,
      { headers: { 'Authorization': `Bearer ${token}` }, timeout: 30000 }
    );
    return res.data?.[0] || null;
  } catch (e) {
    console.log('HF error:', e.message);
    return null;
  }
};

// ГЛАВНАЯ ФУНКЦИЯ АНАЛИЗА
export const analyzeFoodImage = async (imagePath) => {
  try {
    const optimized = await optimizeImage(imagePath);
    const buffer = await fs.readFile(optimized);
    const b64 = buffer.toString('base64');
    
    // Кеш
    const key = CacheService.generateKey('food', b64.substring(0, 1000));
    const cached = await CacheService.get(key);
    if (cached) {
      await fs.unlink(optimized).catch(() => {});
      return { success: true, data: cached, source: 'cache' };
    }

    // AI анализ
    let result = null;
    if (process.env.HUGGINGFACE_TOKEN) {
      result = await analyzeHF(buffer, process.env.HUGGINGFACE_TOKEN);
    }

    // Обработка
    const data = processResult(result);
    await CacheService.set(key, data, 168);
    await fs.unlink(optimized).catch(() => {});
    
    return { success: true, data, source: result ? 'ai' : 'template' };
  } catch (err) {
    console.error('Analysis error:', err);
    return { success: true, data: getDefault(), source: 'fallback' };
  }
};

// Обработка результата
const processResult = (result) => {
  if (!result) return getDefault();
  
  const label = result.label.toLowerCase();
  let food = null;
  
  // Поиск в базе
  for (const [key, val] of Object.entries(FOOD_DATABASE)) {
    if (val.words.some(w => label.includes(w))) {
      food = val;
      break;
    }
  }
  
  if (!food) food = { cal: 250, p: 15, c: 30, f: 10 };
  
  // Порция 200г
  return {
    dish_name: capitalize(label.split(',')[0]),
    calories: Math.round(food.cal * 2),
    protein: Math.round(food.p * 2),
    carbs: Math.round(food.c * 2),
    fats: Math.round(food.f * 2),
    portion_size: '200г',
    ingredients: ['основные ингредиенты'],
    confidence: result.score || 0.5
  };
};

const getDefault = () => ({
  dish_name: 'Блюдо',
  calories: 300,
  protein: 15,
  carbs: 35,
  fats: 10,
  portion_size: '200г',
  ingredients: ['смешанные ингредиенты'],
  confidence: 0.5
});

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ГЕНЕРАЦИЯ ПЛАНОВ ПИТАНИЯ (шаблоны)
export const generateMealPlan = async (userId, profile, duration) => {
  const key = CacheService.generateKey('plan', { goal: profile.goal });
  const cached = await CacheService.get(key);
  if (cached) return { success: true, data: cached, cached: true };
  
  const plan = makePlan(profile.goal || 'maintain');
  await CacheService.set(key, plan, 168);
  return { success: true, data: plan, cached: false };
};

const makePlan = (goal) => {
  const templates = {
    lose_weight: [
      { type: 'breakfast', dish: 'Овсянка с ягодами', calories: 300, protein: 10, carbs: 50, fats: 8 },
      { type: 'lunch', dish: 'Курица с салатом', calories: 400, protein: 35, carbs: 30, fats: 15 },
      { type: 'dinner', dish: 'Рыба с овощами', calories: 350, protein: 30, carbs: 25, fats: 12 },
      { type: 'snack', dish: 'Йогурт', calories: 150, protein: 15, carbs: 10, fats: 5 }
    ],
    maintain: [
      { type: 'breakfast', dish: 'Яйца с тостом', calories: 400, protein: 20, carbs: 40, fats: 18 },
      { type: 'lunch', dish: 'Паста с курицей', calories: 550, protein: 35, carbs: 60, fats: 20 },
      { type: 'dinner', dish: 'Стейк с рисом', calories: 600, protein: 40, carbs: 50, fats: 25 },
      { type: 'snack', dish: 'Орехи', calories: 250, protein: 8, carbs: 30, fats: 12 }
    ],
    gain_muscle: [
      { type: 'breakfast', dish: 'Омлет с сыром', calories: 500, protein: 25, carbs: 35, fats: 30 },
      { type: 'lunch', dish: 'Говядина с картофелем', calories: 700, protein: 45, carbs: 70, fats: 25 },
      { type: 'dinner', dish: 'Лосось с киноа', calories: 650, protein: 40, carbs: 55, fats: 28 },
      { type: 'snack', dish: 'Протеин', calories: 350, protein: 30, carbs: 40, fats: 10 }
    ]
  };
  
  const meals = templates[goal] || templates.maintain;
  const totals = meals.reduce((a, m) => ({
    calories: a.calories + m.calories,
    protein: a.protein + m.protein,
    carbs: a.carbs + m.carbs,
    fats: a.fats + m.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  
  return { meals, ...totals };
};

export default { analyzeFoodImage, generateMealPlan };
