import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Gemini API (FREE tier) - основной метод
let genAI = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini API initialized');
} else {
  console.warn('⚠️ GEMINI_API_KEY not found, AI features will use fallback');
}

export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }
  // gemini-1.5-flash - самая быстрая и дешевая модель
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Hugging Face fallback (FREE)
export const HUGGINGFACE_API = {
  url: 'https://api-inference.huggingface.co/models',
  token: process.env.HUGGINGFACE_TOKEN || '',
  models: {
    imageClassification: 'google/vit-base-patch16-224',
    objectDetection: 'facebook/detr-resnet-50'
  }
};

export default { getGeminiModel, HUGGINGFACE_API };
