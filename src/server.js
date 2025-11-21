import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/food.js';
import mealRoutes from './routes/meal.js';
import compositionRoutes from './routes/composition.js';
import recommendationsRoutes from './routes/recommendations.js';
import wearablesRoutes from './routes/wearables.js';
import profileRoutes from './routes/profile.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (важно для Render и других хостингов)
app.set('trust proxy', 1);

// ===============================================
// MIDDLEWARE
// ===============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===============================================
// ROUTES
// ===============================================

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/composition', compositionRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/wearables', wearablesRoutes);
app.use('/api/profile', profileRoutes);

// ===============================================
// HEALTH CHECK
// ===============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Food Analyzer API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      food: '/api/food',
      meals: '/api/meal',
      composition: '/api/composition',
      recommendations: '/api/recommendations',
      wearables: '/api/wearables',
      profile: '/api/profile'
    }
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({ 
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===============================================
// SERVER START
// ===============================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🍽️  Food Analyzer Backend API');
  console.log('🚀 ================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
  console.log('🚀 ================================');
  console.log('');
});

// ===============================================
// GRACEFUL SHUTDOWN
// ===============================================

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing server shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
