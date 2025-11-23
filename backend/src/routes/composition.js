import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractTextFromImage, analyzeComposition } from '../services/ocrService.js';
import { uploadToSupabase, deleteFromSupabase } from '../services/storageService.js';
import supabase from '../config/database.js';
import fs from 'fs/promises';

const router = express.Router();

// Анализ состава продукта по фото этикетки
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

      console.log('🔬 Analyzing product composition...');

      // Загружаем файл в Supabase Storage
      const { url, path } = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      supabaseFilePath = path;
      console.log('✅ File uploaded to Supabase:', url);

      // Создаём временный файл для OCR
      tempFilePath = `/tmp/${Date.now()}-${req.file.originalname}`;
      await fs.writeFile(tempFilePath, req.file.buffer);

      // OCR - извлечение текста
      const ocrResult = await extractTextFromImage(tempFilePath);
      
      if (!ocrResult.success) {
        return res.status(500).json({ error: 'Failed to extract text from image' });
      }

      // Анализ состава
      const analysis = await analyzeComposition(ocrResult.text);

      // Сохранение результата в БД
      const { data, error } = await supabase
        .from('composition_analysis')
        .insert({
          user_id: req.user.id,
          photo_url: url, // Supabase URL
          detected_text: ocrResult.text,
          ...analysis
        })
        .select()
        .single();

      if (error) {
        console.error('Database save error:', error);
      }

      // Удаляем временный файл
      await fs.unlink(tempFilePath).catch(() => {});

      console.log('✅ Composition analysis completed');

      res.json({
        success: true,
        data: {
          detected_text: ocrResult.text,
          ...analysis,
          id: data?.id,
          image_url: url
        }
      });
    } catch (error) {
      console.error('Composition analysis error:', error);
      
      // Очистка
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      if (supabaseFilePath) {
        await deleteFromSupabase(supabaseFilePath).catch(() => {});
      }

      res.status(500).json({ 
        error: 'Failed to analyze composition',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Получить историю анализов
router.get('/history', validateTelegramAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const { data, error } = await supabase
      .from('composition_analysis')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, analyses: data });
  } catch (error) {
    console.error('Get composition history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;
