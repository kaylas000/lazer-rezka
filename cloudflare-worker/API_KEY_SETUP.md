# Установка Groq API ключа

## ВАЖНО: Безопасность

❌ **НЕ вставляйте ключ в код!** Репозиторий GitHub публичный — все увидят ключ.

✅ **Правильно:** Ключ хранится в Cloudflare Workers как секретная переменная.

---

## Шаг 1: Получите ключ Groq

1. Зарегистрируйтесь на https://console.groq.com
2. Перейдите в **API Keys**
3. Нажмите **Create API Key**
4. Скопируйте ключ (начинается с `gsk_...`)

## Шаг 2: Создайте Worker в Cloudflare

1. Откройте https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Create Worker**
3. Дайте имя: `ai-consultant`
4. **Deploy** (пока с пустым кодом)

## Шаг 3: Добавьте секретный ключ

1. В созданном Worker откройте вкладку **Settings**
2. Найдите раздел **Variables and Secrets**
3. Нажмите **Add variable**
4. Заполните:
   - **Variable name:** `GROQ_API_KEY`
   - **Value:** ваш ключ Groq
   - **Type:** выберите **Secret** (🔒)
5. **Save**

## Шаг 4: Вставьте код Worker

1. Вернитесь на вкладку **Quick edit**
2. Скопируйте весь код из файла `cloudflare-worker/worker.js`
3. Вставьте в редактор Cloudflare
4. **Save and Deploy**

## Шаг 5: Подключите к сайту

Откройте файл `assets/js/ai-chat.js` и замените URL:

```javascript
const WORKER_URL = 'https://ai-consultant.ваш-аккаунт.workers.dev';
```

На ваш реальный URL Worker (показан в Cloudflare после деплоя).

---

## Готово!

Теперь:
- ✅ Ключ защищён в Cloudflare (никто не видит)
- ✅ Код в GitHub публичный (безопасно)
- ✅ AI-консультант работает на сайте

## Проверка

Откройте ваш сайт и нажмите кнопку чата в правом нижнем углу.
