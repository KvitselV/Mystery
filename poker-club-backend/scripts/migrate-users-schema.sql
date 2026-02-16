-- Миграция users: firstName+lastName -> name, добавление club_card_number, удаление email
-- Выполнить вручную ДО запуска приложения с новой схемой:
--   psql -U postgres -d poker_club -f scripts/migrate-users-schema.sql

-- 1. Добавить новые колонки как nullable
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS club_card_number VARCHAR(50);

-- 2. Заполнить name из first_name + last_name (если колонки first_name есть)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='first_name') THEN
    UPDATE users SET name = TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,'')))
    WHERE name IS NULL OR TRIM(name) = '';
  END IF;
END $$;

-- 3. Заполнить name для оставшихся строк
UPDATE users SET name = 'Без имени' WHERE name IS NULL OR TRIM(name) = '';

-- 4. Заполнить club_card_number уникальными значениями
UPDATE users SET club_card_number = 'CARD-' || id WHERE club_card_number IS NULL;

-- 5. Добавить UNIQUE на club_card_number
CREATE UNIQUE INDEX IF NOT EXISTS IDX_users_club_card_number ON users (club_card_number);

-- 6. Удалить старые колонки
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- 7. Сделать колонки NOT NULL
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
ALTER TABLE users ALTER COLUMN club_card_number SET NOT NULL;
