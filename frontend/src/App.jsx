import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import { foodAPI, compositionAPI, mealAPI } from './services/api';
import './App.css';

// ==================== КАМЕРА КОМПОНЕНТ ====================
const FoodCamera = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('food'); // 'food' или 'composition'

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      let response;
      if (mode === 'food') {
        response = await foodAPI.analyze(formData);
      } else {
        response = await compositionAPI.analyze(formData);
      }

      setResult(response.data.data || response.data);
      console.log('Результат анализа:', response.data);
    } catch (err) {
      console.error('Ошибка анализа:', err);
      setError(err.response?.data?.error || 'Ошибка при анализе изображения');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!result) return;

    try {
      await mealAPI.add({
        dish_name: result.dish_name || 'Блюдо',
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
        meal_type: 'lunch',
        portion_size: result.portion_size || '200г'
      });
      alert('✅ Приём пищи сохранён в дневник!');
      // Сброс
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('❌ Ошибка при сохранении');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="screen camera-screen">
      <h1>📸 Анализ еды</h1>
      
      {/* Переключатель режима */}
      <div className="mode-switch">
        <button 
          className={mode === 'food' ? 'active' : ''} 
          onClick={() => setMode('food')}
        >
          🍔 Еда
        </button>
        <button 
          className={mode === 'composition' ? 'active' : ''} 
          onClick={() => setMode('composition')}
        >
          🏷️ Состав
        </button>
      </div>

      {/* Загрузка фото */}
      {!preview && (
        <div className="upload-area">
          <label htmlFor="file-input" className="upload-label">
            <div className="upload-icon">📷</div>
            <p>Нажмите для выбора фото</p>
            <p className="hint">
              {mode === 'food' 
                ? 'Сфотографируйте блюдо' 
                : 'Сфотографируйте этикетку с составом'}
            </p>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Превью */}
      {preview && !result && (
        <div className="preview-container">
          <img src={preview} alt="Preview" className="preview-image" />
          <div className="action-buttons">
            <button onClick={handleReset} className="btn-secondary">
              🔄 Другое фото
            </button>
            <button 
              onClick={handleAnalyze} 
              className="btn-primary"
              disabled={analyzing}
            >
              {analyzing ? '⏳ Анализирую...' : '🔍 Анализировать'}
            </button>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Результат - Еда */}
      {result && mode === 'food' && (
        <div className="result-container">
          <div className="result-header">
            <h2>✅ Результат анализа</h2>
            <span className="confidence">
              Точность: {Math.round((result.confidence || 0.5) * 100)}%
            </span>
          </div>
          
          <div className="result-card">
            <h3>{result.dish_name}</h3>
            <p className="portion">Порция: {result.portion_size}</p>
            
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span className="label">Калории</span>
                <span className="value">{result.calories} ккал</span>
              </div>
              <div className="nutrition-item">
                <span className="label">Белки</span>
                <span className="value">{result.protein} г</span>
              </div>
              <div className="nutrition-item">
                <span className="label">Углеводы</span>
                <span className="value">{result.carbs} г</span>
              </div>
              <div className="nutrition-item">
                <span className="label">Жиры</span>
                <span className="value">{result.fats} г</span>
              </div>
            </div>

            {result.ingredients && result.ingredients.length > 0 && (
              <div className="ingredients">
                <h4>Ингредиенты:</h4>
                <p>{result.ingredients.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button onClick={handleReset} className="btn-secondary">
              📷 Новое фото
            </button>
            <button onClick={handleSaveMeal} className="btn-primary">
              💾 Сохранить в дневник
            </button>
          </div>
        </div>
      )}

      {/* Результат - Состав */}
      {result && mode === 'composition' && (
        <div className="result-container">
          <div className="result-header">
            <h2>🔬 Анализ состава</h2>
            <div className="health-score">
              Оценка: {result.health_score}/10
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${result.health_score * 10}%`,
                    backgroundColor: result.health_score > 7 ? '#4caf50' : result.health_score > 4 ? '#ff9800' : '#f44336'
                  }}
                />
              </div>
            </div>
          </div>

          {result.detected_text && (
            <div className="detected-text">
              <h4>📝 Распознанный текст:</h4>
              <p className="text-content">{result.detected_text}</p>
            </div>
          )}

          {result.e_additives && result.e_additives.length > 0 && (
            <div className="info-section">
              <h4>⚗️ E-добавки ({result.e_additives.length}):</h4>
              <div className="tags">
                {result.e_additives.map((additive, i) => (
                  <span key={i} className="tag">{additive}</span>
                ))}
              </div>
            </div>
          )}

          {result.allergens && result.allergens.length > 0 && (
            <div className="info-section">
              <h4>⚠️ Аллергены:</h4>
              <div className="tags">
                {result.allergens.map((allergen, i) => (
                  <span key={i} className="tag warning">{allergen}</span>
                ))}
              </div>
            </div>
          )}

          {result.ingredients && result.ingredients.length > 0 && (
            <div className="info-section">
              <h4>🧪 Ингредиенты:</h4>
              <ul className="ingredients-list">
                {result.ingredients.map((ingredient, i) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div className="warnings">
              <h4>⚠️ Предупреждения:</h4>
              {result.warnings.map((warning, i) => (
                <div key={i} className="warning-item">{warning}</div>
              ))}
            </div>
          )}

          <div className="action-buttons">
            <button onClick={handleReset} className="btn-primary">
              📷 Новый анализ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ДНЕВНИК КОМПОНЕНТ ====================
const Diary = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await mealAPI.getDay(today);
      const mealsList = response.data.meals || [];
      setMeals(mealsList);

      // Подсчет общих показателей
      const totals = mealsList.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0)
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
      
      setStats(totals);
    } catch (err) {
      console.error('Ошибка загрузки дневника:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот приём пищи?')) return;
    
    try {
      await mealAPI.delete(id);
      await loadMeals();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении');
    }
  };

  const getMealTypeEmoji = (type) => {
    const emojis = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍎'
    };
    return emojis[type] || '🍽️';
  };

  const getMealTypeName = (type) => {
    const names = {
      breakfast: 'Завтрак',
      lunch: 'Обед',
      dinner: 'Ужин',
      snack: 'Перекус'
    };
    return names[type] || type;
  };

  return (
    <div className="screen diary-screen">
      <h1>📖 Дневник питания</h1>
      
      {/* Сводка за день */}
      <div className="daily-stats">
        <h3>Сегодня</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.calories}</span>
            <span className="stat-label">ккал</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.protein}г</span>
            <span className="stat-label">белки</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.carbs}г</span>
            <span className="stat-label">углеводы</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.fats}г</span>
            <span className="stat-label">жиры</span>
          </div>
        </div>
      </div>

      {/* Список приёмов пищи */}
      {loading ? (
        <div className="loading">⏳ Загрузка...</div>
      ) : meals.length === 0 ? (
        <div className="empty-state">
          <p>📭 Пока нет записей</p>
          <p className="hint">Сфотографируйте еду на вкладке "Камера"</p>
        </div>
      ) : (
        <div className="meals-list">
          {meals.map((meal) => (
            <div key={meal.id} className="meal-card">
              <div className="meal-header">
                <span className="meal-type">
                  {getMealTypeEmoji(meal.meal_type)} {getMealTypeName(meal.meal_type)}
                </span>
                <span className="meal-time">
                  {new Date(meal.created_at).toLocaleTimeString('ru', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <h4>{meal.dish_name}</h4>
              <p className="portion">{meal.portion_size}</p>
              
              <div className="meal-nutrition">
                <span>🔥 {meal.calories} ккал</span>
                <span>🥩 {meal.protein}г</span>
                <span>🍞 {meal.carbs}г</span>
                <span>🧈 {meal.fats}г</span>
              </div>

              <button 
                className="delete-btn" 
                onClick={() => handleDelete(meal.id)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== ПРОФИЛЬ КОМПОНЕНТ ====================
const Profile = () => {
  const { user } = useStore();

  return (
    <div className="screen profile-screen">
      <h1>👤 Профиль</h1>
      
      {user && (
        <div className="profile-info">
          <div className="avatar">
            {user.first_name?.[0] || '👤'}
          </div>
          <h2>{user.first_name} {user.last_name}</h2>
          <p className="username">@{user.username || 'user'}</p>
        </div>
      )}

      <div className="settings-section">
        <h3>⚙️ Настройки</h3>
        <div className="settings-list">
          <div className="setting-item">
            <span>🎯 Цель</span>
            <span className="value">Поддержание веса</span>
          </div>
          <div className="setting-item">
            <span>📊 Норма калорий</span>
            <span className="value">2000 ккал</span>
          </div>
          <div className="setting-item">
            <span>🔔 Уведомления</span>
            <span className="value">Включены</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>ℹ️ О приложении</h3>
        <p>Food Analyzer v1.0</p>
        <p className="hint">Анализируйте еду и отслеживайте питание</p>
      </div>
    </div>
  );
};

// ==================== НАВИГАЦИЯ ====================
const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="bottom-nav">
      <Link to="/camera" className={location.pathname === '/camera' ? 'active' : ''}>
        <span className="nav-icon">📸</span>
        <span className="nav-label">Камера</span>
      </Link>
      <Link to="/diary" className={location.pathname === '/diary' ? 'active' : ''}>
        <span className="nav-icon">📖</span>
        <span className="nav-label">Дневник</span>
      </Link>
      <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">Профиль</span>
      </Link>
    </nav>
  );
};

// ==================== ГЛАВНЫЙ КОМПОНЕНТ ====================
function App() {
  const { setUser, setInitData } = useStore();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1a1a1a');
      tg.setBackgroundColor('#1a1a1a');
      
      if (tg.initData) {
        setInitData(tg.initData);
      }
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  }, [setUser, setInitData]);

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/camera" replace />} />
          <Route path="/camera" element={<FoodCamera />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
