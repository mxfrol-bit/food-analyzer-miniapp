import express from 'express';
import { validateTelegramAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { analyzeFoodImage } from '../services/aiService.js';

const router = express.Router();

// Анализ фото еды
router.post('/analyze', 
  validateTelegramAuth, 
  upload.single('photo'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log('📸 Analyzing food image:', req.file.filename);

      const analysis = await analyzeFoodImage(req.file.path);
      
      if (!analysis.success) {
        return res.status(500).json({ error: analysis.error });
      }

      res.json({
        success: true,
        data: analysis.data,
        source: analysis.source
      });
    } catch (error) {
      console.error('Food analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze food' });
    }
  }
);

export default router;
