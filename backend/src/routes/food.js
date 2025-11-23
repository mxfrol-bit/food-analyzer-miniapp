const express = require('express');
const router = express.Router();

// POST /api/food/analyze - Анализ фото еды
router.post('/analyze', async (req, res) => {
  try {
    const { image, userId } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Изображение обязательно' });
    }

    // ВРЕМЕННАЯ ЗАГЛУШКА - возвращаем тестовые данные
    // Позже здесь будет реальный AI анализ
    const mockResult = {
      foodName: 'Определённое блюдо',
      calories: Math.floor(Math.random() * 400) + 200, // 200-600 ккал
      protein: Math.floor(Math.random() * 20) + 10, // 10-30г
      fats: Math.floor(Math.random() * 25) + 5, // 5-30г
      carbs: Math.floor(Math.random() * 50) + 20, // 20-70г
      recommendations: 'Сбалансированное питание! Продолжайте в том же духе.',
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };

    // Логируем для отладки
    console.log(`📸 Анализ фото для пользователя ${userId}`);

    res.json(mockResult);

  } catch (error) {
    console.error('Ошибка анализа:', error);
    res.status(500).json({ 
      error: 'Ошибка при анализе изображения',
      message: error.message 
    });
  }
});

// GET /api/food/history - История анализов
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Заглушка - пустая история
    res.json({
      userId,
      history: [],
      totalAnalyses: 0
    });
    
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
