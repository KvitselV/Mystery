# Развёртывание проекта Poker Club на сервере

## Кратко (Docker)

```bash
# 1. Скопируйте пример и заполните пароли/домены
cp .env.example.production .env

# 2. Запустите
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Приложение: http://IP_СЕРВЕРА (frontend), API на порту 3000
```

---

## Домен вместо IP

Чтобы использовать домен (например, `vash-site.ru`) вместо IP:

### 1. DNS

В панели управления доменом создайте A-записи:

| Тип | Имя | Значение   |
|-----|-----|------------|
| A   | @   | IP сервера |
| A   | api | IP сервера |

Так вы получите `vash-site.ru` (frontend) и `api.vash-site.ru` (API).

### 2. .env

```env
APP_URL=https://api.vash-site.ru
FRONTEND_URL=https://vash-site.ru
```

### 3. Nginx + HTTPS (рекомендуется)

Установите Nginx и Certbot:

```bash
sudo apt install nginx certbot
```

Получите SSL-сертификаты (порт 80 должен быть свободен — не запускайте контейнеры до этого или остановите их):

```bash
sudo certbot certonly --standalone -d vash-site.ru -d api.vash-site.ru
```

Скопируйте конфиг и замените `vash-site.ru` на свой домен:

```bash
sudo cp nginx/poker-club.conf /etc/nginx/sites-available/poker-club
sudo sed -i 's/vash-site.ru/ВАШ_ДОМЕН/g' /etc/nginx/sites-available/poker-club
sudo ln -s /etc/nginx/sites-available/poker-club /etc/nginx/sites-enabled/
```

Запустите Docker так, чтобы порт 80 был свободен для Nginx:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.nginx.yml --env-file .env up -d --build
```

Проверьте Nginx и перезагрузите его:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

После этого приложение будет доступно по `https://vash-site.ru` и `https://api.vash-site.ru`.

---

## Требования к серверу

- **Docker** и **Docker Compose** (рекомендуется)
- или: Node.js 20+, PostgreSQL 15+, Redis 7+, Nginx (при ручной установке)

## Вариант 1: Развёртывание через Docker (рекомендуется)

### 1. Подготовка сервера

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose git

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
# Выйдите и зайдите снова, либо выполните newgrp docker
```

### 2. Клонирование проекта

```bash
git clone <URL_РЕПОЗИТОРИЯ> poker-club
cd poker-club
```

### 3. Создание production-конфигурации

Создайте файл `docker-compose.prod.yml` в корне проекта:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: poker_club_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-poker_club}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Не пробрасывайте 5432 наружу в продакшене, если нет необходимости

  redis:
    image: redis:7-alpine
    container_name: poker_club_redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./poker-club-backend
    container_name: poker_club_api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME:-poker_club}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      SESSION_SECRET: ${SESSION_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      APP_URL: ${APP_URL}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./poker-club-frontend
      args:
        VITE_API_URL: ${FRONTEND_URL}
    container_name: poker_club_web
    restart: unless-stopped
    ports:
      - "80:80"

volumes:
  postgres_data:
  redis_data:
```

### 4. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DB_USER=postgres
DB_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_ДЛЯ_БД
DB_NAME=poker_club

# Секреты (сгенерируйте случайные строки)
SESSION_SECRET=случайная_строка_32_символа
JWT_SECRET=другая_случайная_строка_32_символа
JWT_EXPIRES_IN=7d

# URL приложения (замените на ваш домен)
APP_URL=https://api.vash-site.ru
FRONTEND_URL=https://vash-site.ru
```

### 5. Запуск

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 6. Инициализация БД (при первом запуске)

Если нужны начальные данные (пользователи, достижения и т.п.):

```bash
# Подключитесь к контейнеру backend
docker exec -it poker_club_api sh

# Если есть скрипт сидирования
# node dist/database/seeders/initial-seed.js

# Или через API (после создания первого админа): POST /api/achievements/seed
```

---

## Вариант 2: Ручное развёртывание (без Docker)

### 1. Установка зависимостей на сервере

```bash
# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

### 2. Настройка PostgreSQL

```bash
sudo -u postgres psql
CREATE USER poker_user WITH PASSWORD 'ваш_пароль';
CREATE DATABASE poker_club OWNER poker_user;
\q
```

### 3. Backend

```bash
cd poker-club-backend
npm ci
cp .env.example .env
# Отредактируйте .env: DB_*, REDIS_*, JWT_SECRET, SESSION_SECRET, FRONTEND_URL
npm run build
NODE_ENV=production npm start
```

Для автозапуска используйте **PM2**:

```bash
npm install -g pm2
pm2 start dist/server.js --name poker-api
pm2 save && pm2 startup
```

### 4. Frontend

```bash
cd poker-club-frontend
npm ci
echo "VITE_API_URL=https://api.vash-site.ru" > .env.production
npm run build
```

Собранные файлы в `dist/` отдавайте через Nginx.

### 5. Nginx (обратный прокси)

```nginx
# /etc/nginx/sites-available/poker-club

# API (backend)
server {
    listen 80;
    server_name api.vash-site.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name vash-site.ru;

    root /var/www/poker-club/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    location / {
        add_header Cache-Control "no-cache";
    }
}
```

Включите сайт и перезапустите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/poker-club /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. SSL (HTTPS) через Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vash-site.ru -d api.vash-site.ru
```

---

## Важные замечания для production

1. **`synchronize`** в TypeORM отключён при `NODE_ENV=production` — миграции схемы не выполняются автоматически. Используйте миграции или включайте `synchronize` только для первого запуска (не рекомендуется в долгосрочной перспективе).

2. **Секреты**: замените `SESSION_SECRET`, `JWT_SECRET` и `DB_PASSWORD` на уникальные случайные значения.

3. **CORS**: проверьте, что `FRONTEND_URL` в backend совпадает с доменом фронтенда.

4. **Firewall**: откройте порты 80, 443; 3000 и 5432 лучше не открывать наружу, если доступ идёт через Nginx.

5. **Резервное копирование**: настройте регулярные бэкапы PostgreSQL (например, `pg_dump`).

---

## Проверка работы

После развёртывания:

- Frontend: `https://vash-site.ru`
- API: `https://api.vash-site.ru/health` (если есть) или любой другой endpoint
- WebSocket: тот же хост API с поддержкой `Upgrade`
