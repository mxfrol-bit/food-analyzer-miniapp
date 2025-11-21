# ⚡ БЫСТРЫЙ СТАРТ

## 1️⃣ УСТАНОВКА (5 минут)

### Скачайте:
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/
- VS Code: https://code.visualstudio.com/

---

## 2️⃣ РЕГИСТРАЦИИ (10 минут)

### Telegram бот:
1. Telegram → @BotFather → `/newbot`
2. Сохраните TOKEN

### Supabase (база данных):
1. https://supabase.com/ → Регистрация
2. New project → FREE plan
3. SQL Editor → вставьте `database/schema.sql`
4. Сохраните URL и API key

### Gemini API (AI):
1. https://makersuite.google.com/app/apikey
2. Create API key
3. Сохраните ключ

---

## 3️⃣ НАСТРОЙКА (5 минут)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Заполните .env !!!

# Frontend
cd frontend
npm install
cp .env.example .env
# Заполните .env !!!
```

---

## 4️⃣ ЗАПУСК ЛОКАЛЬНО (1 минута)

```bash
# Терминал 1
cd backend
npm run dev

# Терминал 2
cd frontend
npm run dev
```

Откройте: http://localhost:5173/

---

## 5️⃣ ДЕПЛОЙ (15 минут)

### GitHub:
```bash
git init
git add .
git commit -m "Initial"
git remote add origin https://github.com/USERNAME/food-analyzer.git
git push -u origin main
```

### Render (Backend):
1. https://render.com/ → New Web Service
2. Connect GitHub repo
3. Root: `backend`
4. Добавьте все ENV переменные
5. Deploy

### Vercel (Frontend):
1. https://vercel.com/ → New Project
2. Connect GitHub repo
3. Root: `frontend`
4. ENV: `VITE_API_URL=https://ваш-render-url.com/api`
5. Deploy

### Telegram:
@BotFather → `/myapps` → Edit URL → вставьте Vercel URL

---

## ✅ ГОТОВО!

Откройте бота в Telegram → Mini App должно работать!

---

## 🐛 Не работает?

1. Проверьте .env файлы
2. Посмотрите логи в терминале
3. Откройте консоль браузера (F12)
4. Перечитайте README.md

---

## 📦 ФАЙЛЫ .env

### backend/.env:
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
TELEGRAM_BOT_TOKEN=ваш_токен
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=ваш_ключ
GEMINI_API_KEY=ваш_ключ
```

### frontend/.env:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 💡 КОМАНДЫ

```bash
# Посмотреть версии
node --version
npm --version
git --version

# Запуск проекта
cd backend && npm run dev
cd frontend && npm run dev

# Загрузка на GitHub
git add .
git commit -m "Update"
git push
```

---

**УСПЕХОВ! 🚀**
