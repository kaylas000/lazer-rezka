# Простая установка за 3 шага

## Шаг 1: Получите ключ Groq (бесплатно)

1. Зайдите на https://console.groq.com
2. Зарегистрируйтесь
3. **API Keys** → **Create API Key**
4. Скопируйте ключ (начинается с `gsk_...`)

## Шаг 2: Вставьте ключ в код

Откройте файл `cloudflare-worker/worker.js` в GitHub и найдите строку 6:

```javascript
const GROQ_API_KEY = 'ВСТАВЬТЕ_ВАШ_КЛЮЧ_СЮДА';
```

Замените на ваш ключ:

```javascript
const GROQ_API_KEY = 'gsk_abc123xyz456...';
```

Сохраните файл (commit).

## Шаг 3: Деплой на Cloudflare

1. Зайдите на https://dash.cloudflare.com
2. **Workers & Pages** → **Create** → **Create Worker**
3. Скопируйте весь код из `worker.js`
4. Вставьте в редактор Cloudflare
5. **Save and Deploy**

Готово! Скопируйте URL Worker и вставьте в `assets/js/ai-chat.js`.

---

**Примечание:** Репозиторий должен быть приватным, чтобы ключ не был виден публично.
