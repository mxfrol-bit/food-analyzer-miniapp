import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import './App.css';

// Простые компоненты для начала
const FoodCamera = () => (
  <div className="screen">
    <h1>📸 Камера</h1>
    <p>Сфотографируйте еду</p>
    <input type="file" accept="image/*" capture="environment" />
  </div>
);

const Diary = () => (
  <div className="screen">
    <h1>📖 Дневник</h1>
    <p>Ваши приемы пищи</p>
  </div>
);

const Profile = () => (
  <div className="screen">
    <h1>👤 Профиль</h1>
    <p>Настройки профиля</p>
  </div>
);

const Navigation = () => (
  <nav className="bottom-nav">
    <a href="/camera">📸 Камера</a>
    <a href="/diary">📖 Дневник</a>
    <a href="/profile">👤 Профиль</a>
  </nav>
);

function App() {
  const { setUser, setInitData } = useStore();

  useEffect(() => {
    // Инициализация Telegram Mini App
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
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/camera" />} />
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
