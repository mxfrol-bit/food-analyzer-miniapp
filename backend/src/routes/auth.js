import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';

const router = express.Router();

// Валидация Telegram авторизации
router.post('/validate', validateTelegramAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Получение профиля текущего пользователя
router.get('/me', validateTelegramAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
