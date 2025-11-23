import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import './App.css';

const FoodCamera = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedImage(file);
      
      console.log('✅ Фото выбрано:', file.name);
      
      // Здесь позже добавим отправку на сервер
    }
  };

  return (
    <div className="screen">
      <h1>📸 Камера</h1>
      <p>Сфотографируйте еду</p>
      
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
          <p style={{ color: '#888', fontSize: '14px', marginTop: '10px' }}>
            ✅ Фото загружено! (Анализ пока не подключен)
          </p>
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
          Нажмите чтобы выбрать фото
        </span>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </label>
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
      <p style={{ color: '#888' }}>
        <strong>Калории в день:</strong> 2500 ккал
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
