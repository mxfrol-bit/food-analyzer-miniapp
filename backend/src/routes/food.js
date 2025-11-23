import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { analyzeFoodImage } from '../services/aiService.js';
import { uploadToSupabase, deleteFromSupabase } from '../services/storageService.js';
import fs from 'fs/promises';

const router = express.Router();

// Анализ фото еды
router.post('/analyze', 
  validateTelegramAuth, 
  upload.single('photo'), 
  async (req, res) => {
    let tempFilePath = null;
    let supabaseFilePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('📸 Analyzing food image...');

      // Загружаем файл в Supabase Storage
      const { url, path } = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      supabaseFilePath = path;
      console.log('✅ File uploaded to Supabase:', url);

      // Создаём временный файл для AI анализа
      tempFilePath = `/tmp/${Date.now()}-${req.file.originalname}`;
      await fs.writeFile(tempFilePath, req.file.buffer);

      // Анализируем изображение
      const analysis = await analyzeFoodImage(tempFilePath);
      
      if (!analysis.success) {
        return res.status(500).json({ error: analysis.error });
      }

      // Удаляем временный файл
      await fs.unlink(tempFilePath).catch(() => {});

      res.json({
        success: true,
        data: {
          ...analysis.data,
          image_url: url // URL изображения в Supabase
        },
        source: analysis.source
      });
    } catch (error) {
      console.error('Food analysis error:', error);
      
      // Очистка
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      if (supabaseFilePath) {
        await deleteFromSupabase(supabaseFilePath).catch(() => {});
      }

      res.status(500).json({ 
        error: 'Failed to analyze food',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;
