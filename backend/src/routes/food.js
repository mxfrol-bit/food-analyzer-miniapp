import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import './App.css';

const FoodCamera = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeFood = async (imageFile) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Конвертируем изображение в base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Отправляем на ваш backend API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/food/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo'
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка анализа');
        }

        const data = await response.json();
        setResult(data);
      };
    } catch (err) {
      console.error('Ошибка:', err);
      setError('Не удалось проанализировать фото. Попробуйте ещё раз.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedImage(file);
      
      // Автоматически запускаем анализ
      analyzeFood(file);
    }
  };

  return (
    <div className="screen">
      <h1>📸 Камера</h1>
      <p>Сфотографируйте еду для анализа</p>
      
      {preview && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          background: '#1a1a1a',
          borderRadius: '12px'
        }}>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: '8px'
            }} 
          />
        </div>
      )}

      {analyzing && (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #333',
            borderTop: '4px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#007AFF' }}>🤖 Анализирую еду...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px',
          background: '#2a1a1a',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #ff3b30'
        }}>
          <p style={{ color: '#ff3b30', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>📊 Результат анализа:</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <p style={{ color: '#888', margin: '5px 0' }}>
              <strong style={{ color: '#fff' }}>Блюдо:</strong> {result.foodName || 'Определяется...'}
            </p>
            <p style={{ color: '#888', margin: '5px 0' }}>
              <strong style={{ color: '#fff' }}>Калории:</strong> {result.calories || '~350'} ккал
            </p>
            <p style={{ color: '#888', margin: '5px 0' }}>
              <strong style={{ color: '#fff' }}>Белки:</strong> {result.protein || '15'}г
            </p>
            <p style={{ color: '#888', margin: '5px 0' }}>
              <strong style={{ color: '#fff' }}>Жиры:</strong> {result.fats || '20'}г
            </p>
            <p style={{ color: '#888', margin: '5px 0' }}>
              <strong style={{ color: '#fff' }}>Углеводы:</strong> {result.carbs || '35'}г
            </p>
          </div>

          {result.recommendations && (
            <div style={{
              padding: '15px',
              background: '#0a2540',
              borderRadius: '8px',
              border: '1px solid #007AFF'
            }}>
              <p style={{ color: '#007AFF', margin: 0, fontSize: '14px' }}>
                💡 {result.recommendations}
              </p>
            </div>
          )}
        </div>
      )}
      
      <label style={{
        display: 'block',
        width: '100%',
        padding: '20px',
        background: '#1a1a1a',
        border: '2px dashed #333',
        borderRadius: '12px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}>
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>📷</span>
        <span style={{ color: '#007AFF', fontSize: '16px' }}>
          {preview ? 'Выбрать другое фото' : 'Нажмите чтобы выбрать фото'}
        </span>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleImageChange}
          style={{ display: 'none' }}
          disabled={analyzing}
        />
      </label>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const Diary = () => (
  <div className="screen">
    <h1>📖 Дневник</h1>
    <p>Здесь будет ваша история питания</p>
    <div style={{
      padding: '20px',
      background: '#1a1a1a',
      borderRadius: '12px',
      marginTop: '20px'
    }}>
      <p style={{ color: '#888' }}>Пока нет записей</p>
      <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
        Загрузите фото еды в разделе "Камера" чтобы начать отслеживать питание
      </p>
    </div>
  </div>
);

const Profile = () => (
  <div className="screen">
    <h1>👤 Профиль</h1>
    <p>Настройки профиля</p>
    <div style={{
      padding: '20px',
      background: '#1a1a1a',
      borderRadius: '12px',
      marginTop: '20px'
    }}>
      <p style={{ color: '#888', marginBottom: '10px' }}>
        <strong>Цель:</strong> Набор массы
      </p>
      <p style={{ color: '#888', marginBottom: '10px' }}>
        <strong>Калории в день:</strong> 2500 ккал
      </p>
      <p style={{ color: '#888' }}>
        <strong>Съедено сегодня:</strong> 0 ккал
      </p>
    </div>
  </div>
);

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="bottom-nav">
      <Link to="/camera" className={location.pathname === '/camera' ? 'active' : ''}>
        📸 Камера
      </Link>
      <Link to="/diary" className={location.pathname === '/diary' ? 'active' : ''}>
        📖 Дневник
      </Link>
      <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
        👤 Профиль
      </Link>
    </nav>
  );
};

function App() {
  const { setUser, setInitData } = useStore();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
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
