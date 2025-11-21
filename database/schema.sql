-- ===============================================
-- FOOD ANALYZER DATABASE SCHEMA
-- PostgreSQL для Supabase
-- ===============================================

-- Удаление существующих таблиц (если есть)
DROP TABLE IF EXISTS ai_cache CASCADE;
DROP TABLE IF EXISTS wearable_data CASCADE;
DROP TABLE IF EXISTS recommendations_cache CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS supplements CASCADE;
DROP TABLE IF EXISTS composition_analysis CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===============================================
-- ТАБЛИЦА: Пользователи
-- ===============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10),
    age INT CHECK (age > 0 AND age < 150),
    weight DECIMAL(5,2) CHECK (weight > 0 AND weight < 500),
    height DECIMAL(5,2) CHECK (height > 0 AND height < 300),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    activity_level VARCHAR(50) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'high', 'extreme')),
    goal VARCHAR(50) CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ===============================================
-- ТАБЛИЦА: Приемы пищи
-- ===============================================
CREATE TABLE meals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    photo_url TEXT,
    dish_name VARCHAR(255) NOT NULL,
    calories INT CHECK (calories >= 0),
    protein DECIMAL(6,2) CHECK (protein >= 0),
    carbs DECIMAL(6,2) CHECK (carbs >= 0),
    fats DECIMAL(6,2) CHECK (fats >= 0),
    portion_size VARCHAR(100),
    ingredients TEXT[],
    meal_date DATE DEFAULT CURRENT_DATE,
    meal_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для meals
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX idx_meals_date ON meals(meal_date);
CREATE INDEX idx_meals_created_at ON meals(created_at);

-- ===============================================
-- ТАБЛИЦА: Продукты (справочник)
-- ===============================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    calories_per_100g INT CHECK (calories_per_100g >= 0),
    protein_per_100g DECIMAL(5,2) CHECK (protein_per_100g >= 0),
    carbs_per_100g DECIMAL(5,2) CHECK (carbs_per_100g >= 0),
    fats_per_100g DECIMAL(5,2) CHECK (fats_per_100g >= 0),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для products
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);

-- ===============================================
-- ТАБЛИЦА: Анализ состава продуктов (OCR)
-- ===============================================
CREATE TABLE composition_analysis (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT,
    detected_text TEXT,
    ingredients TEXT[],
    allergens TEXT[],
    e_additives TEXT[],
    health_score INT CHECK (health_score >= 1 AND health_score <= 10),
    warnings TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для composition_analysis
CREATE INDEX idx_composition_user_id ON composition_analysis(user_id);
CREATE INDEX idx_composition_created_at ON composition_analysis(created_at);

-- ===============================================
-- ТАБЛИЦА: БАДы и добавки
-- ===============================================
CREATE TABLE supplements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(50),
    time_of_day VARCHAR(50),
    purpose TEXT,
    started_at DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для supplements
CREATE INDEX idx_supplements_user_id ON supplements(user_id);
CREATE INDEX idx_supplements_user_active ON supplements(user_id, is_active);

-- ===============================================
-- ТАБЛИЦА: Тренировки
-- ===============================================
CREATE TABLE workouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    workout_type VARCHAR(100),
    duration INT CHECK (duration > 0), -- minutes
    calories_burned INT CHECK (calories_burned >= 0),
    workout_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для workouts
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(workout_date);

-- ===============================================
-- ТАБЛИЦА: Кеш рекомендаций
-- ===============================================
CREATE TABLE recommendations_cache (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) CHECK (recommendation_type IN ('daily', 'weekly', 'monthly')),
    content JSONB NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для recommendations_cache
CREATE INDEX idx_recommendations_user_type ON recommendations_cache(user_id, recommendation_type);
CREATE INDEX idx_recommendations_valid ON recommendations_cache(valid_until);

-- ===============================================
-- ТАБЛИЦА: Данные с браслетов (mock)
-- ===============================================
CREATE TABLE wearable_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50),
    steps INT CHECK (steps >= 0),
    heart_rate INT CHECK (heart_rate >= 0 AND heart_rate < 300),
    calories_burned INT CHECK (calories_burned >= 0),
    sleep_hours DECIMAL(4,2) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    data_date DATE DEFAULT CURRENT_DATE,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для wearable_data
CREATE INDEX idx_wearable_user_id ON wearable_data(user_id);
CREATE INDEX idx_wearable_date ON wearable_data(data_date);

-- ===============================================
-- ТАБЛИЦА: AI кеш (для экономии запросов)
-- ===============================================
CREATE TABLE ai_cache (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для ai_cache
CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);

-- ===============================================
-- ВСТАВКА ТЕСТОВЫХ ДАННЫХ (опционально)
-- ===============================================

-- Базовые продукты
INSERT INTO products (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, category) VALUES
('Куриная грудка', 165, 31.0, 0.0, 3.6, 'Мясо'),
('Рис белый', 130, 2.7, 28.2, 0.3, 'Крупы'),
('Овсянка', 389, 16.9, 66.3, 6.9, 'Крупы'),
('Яйцо куриное', 155, 12.7, 0.7, 11.5, 'Яйца'),
('Брокколи', 34, 2.8, 7.0, 0.4, 'Овощи'),
('Банан', 89, 1.1, 22.8, 0.3, 'Фрукты'),
('Лосось', 208, 20.0, 0.0, 13.4, 'Рыба'),
('Греческий йогурт', 59, 10.0, 3.6, 0.4, 'Молочные'),
('Авокадо', 160, 2.0, 8.5, 14.7, 'Фрукты'),
('Миндаль', 579, 21.2, 21.6, 49.9, 'Орехи');

-- ===============================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ===============================================

-- Автообновление updated_at для users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (Row Level Security)
-- ===============================================

-- Включение RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE composition_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

-- Политики для users (пользователи видят только свои данные)
CREATE POLICY users_select_own ON users
    FOR SELECT USING (true);

CREATE POLICY users_insert_own ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (true);

-- Политики для meals
CREATE POLICY meals_all ON meals
    FOR ALL USING (true);

-- Политики для остальных таблиц
CREATE POLICY composition_all ON composition_analysis
    FOR ALL USING (true);

CREATE POLICY supplements_all ON supplements
    FOR ALL USING (true);

CREATE POLICY workouts_all ON workouts
    FOR ALL USING (true);

CREATE POLICY recommendations_all ON recommendations_cache
    FOR ALL USING (true);

CREATE POLICY wearable_all ON wearable_data
    FOR ALL USING (true);

-- Products и ai_cache доступны всем
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_all ON products
    FOR SELECT USING (true);

CREATE POLICY ai_cache_all ON ai_cache
    FOR ALL USING (true);

-- ===============================================
-- ЗАВЕРШЕНИЕ
-- ===============================================
-- База данных готова к использованию!
-- Проверьте что все таблицы созданы:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
