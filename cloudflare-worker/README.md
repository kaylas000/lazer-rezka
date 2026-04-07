# Cloudflare Worker для AI-консультанта

Этот Worker проксирует запросы к OpenAI API, обеспечивая безопасность и rate limiting.

## Установка

### 1. Установите Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Авторизуйтесь в Cloudflare

```bash
wrangler login
```

### 3. Создайте KV namespace для rate limiting

```bash
wrangler kv:namespace create "RATE_LIMIT_KV"
```

Скопируйте ID и вставьте в `wrangler.toml`

### 4. Установите секрет OpenAI API Key

```bash
wrangler secret put OPENAI_API_KEY
```

Введите ваш OpenAI API ключ

### 5. Деплой

```bash
wrangler deploy
```

## Использование

После деплоя вы получите URL вида:
```
https://lazer-rezka-ai-chat.YOUR_SUBDOMAIN.workers.dev
```

Этот URL нужно использовать в `assets/js/ai-chat.js` вместо `YOUR_CLOUDFLARE_WORKER_URL`

## API

### POST /

**Request:**
```json
{
  "message": "Сколько стоит резка стали 3мм?",
  "history": [
    { "role": "user", "content": "Здравствуйте" },
    { "role": "assistant", "content": "Здравствуйте! Чем могу помочь?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Резка стали 3мм стоит от 120 руб/пог.м...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Rate Limiting

- 20 запросов в час с одного IP
- При превышении: HTTP 429

## Безопасность

- CORS настроен (в продакшене ограничить домен)
- API ключ скрыт в переменных окружения
- Валидация длины сообщений (до 500 символов)
- Ограничение истории (последние 10 сообщений)

## Стоимость

Cloudflare Workers Free tier:
- 100,000 запросов в день
- Достаточно для ~3,000 посетителей в день

OpenAI API (GPT-4o-mini):
- ~$0.15 за 1M input tokens
- ~$0.60 за 1M output tokens
- Примерно $0.001 за диалог
- ~1000 диалогов = $1
