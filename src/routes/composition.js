import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractTextFromImage, analyzeComposition } from '../services/ocrService.js';
import supabase from '../config/database.js';

const router = express.Router();

// Анализ состава продукта по фото этикетки
router.post('/analyze', 
  validateTelegramAuth,
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('🔬 Analyzing product composition:', req.file.filename);

      // OCR - извлечение текста
      const ocrResult = await extractTextFromImage(req.file.path);
      
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
          photo_url: req.file.path,
          detected_text: ocrResult.text,
          ...analysis
        })
        .select()
        .single();

      if (error) {
        console.error('Database save error:', error);
      }

      console.log('✅ Composition analysis completed');

      res.json({
        success: true,
        data: {
          detected_text: ocrResult.text,
          ...analysis,
          id: data?.id
        }
      });
    } catch (error) {
      console.error('Composition analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze composition' });
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
