# Настройка AI-консультанта с Groq API

## 🚀 Groq — быстрая и бесплатная альтернатива OpenAI

**Преимущества Groq:**
- ⚡ В 10 раз быстрее OpenAI
- 💰 Бесплатный план: 30 запросов/минуту
- 🎯 Модель Llama 3.3 70B — очень умная

---

## 📋 Пошаговая инструкция

### ШАГ 1: Получи Groq API ключ

1. Иди на https://console.groq.com/
2. Зарегистрируйся (бесплатно)
3. Слева выбери **API Keys**
4. Нажми **Create API Key**
5. Скопируй ключ (начинается с `gsk_...`)

---

### ШАГ 2: Создай Cloudflare Worker

1. Иди на https://dash.cloudflare.com/
2. Зарегистрируйся (бесплатно)
3. Слева выбери **Workers & Pages**
4. Нажми **Create Application**
5. Выбери **Create Worker**
6. Назови его: `ai-chat-lazer`
7. Нажми **Deploy**

---

### ШАГ 3: Вставь код Worker

1. После создания нажми **Edit Code**
2. Удали весь код в редакторе
3. Открой файл `/cloudflare-worker/worker.js` в этом проекте
4. Скопируй **ВЕСЬ** код из него
5. Вставь в редактор Cloudflare
6. Нажми **Save and Deploy**

---

### ШАГ 4: Добавь Groq API ключ ⚠️ ВАЖНО!

1. Вернись на страницу Worker (нажми стрелку назад)
2. Вкладка **Settings**
3. Раздел **Variables and Secrets**
4. Нажми **Add variable**
5. Заполни:
   ```
   Variable name: GROQ_API_KEY
   Value: gsk_... (твой ключ из Groq)
   ✅ Encrypt (поставь галочку!)
   ```
6. Нажми **Save**

---

### ШАГ 5: Скопируй URL Worker

1. Вернись на главную страницу Worker
2. Скопируй URL, например:
   ```
   https://ai-chat-lazer.your-name.workers.dev
   ```

---

### ШАГ 6: Вставь URL в сайт

Открой файл `assets/js/ai-chat.js`

Найди строку (в самом начале):
```javascript
const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL';
```

Замени на твой URL:
```javascript
const WORKER_URL = 'https://ai-chat-lazer.your-name.workers.dev';
```

Сохрани файл.

---

### ШАГ 7: Запуш на GitHub

```bash
git add assets/js/ai-chat.js
git commit -m "Подключен Groq API Worker"
git push origin main
```

Подожди 2-3 минуты пока GitHub Pages обновится.

---

## ✅ Проверка работы

1. Открой свой сайт
2. Кликни на кнопку чата (справа внизу)
3. Напиши: "Привет"
4. Должен прийти ответ от AI

---

## 🐛 Если не работает

### Проблема: "Ошибка сервера"

**Решение:**
1. Открой консоль браузера (F12)
2. Вкладка **Console**
3. Посмотри ошибку
4. Проверь:
   - ✅ GROQ_API_KEY добавлен в Cloudflare Worker
   - ✅ WORKER_URL правильный в ai-chat.js
   - ✅ Ключ Groq валидный (не истёк)

### Проблема: "CORS error"

**Решение:**
В Cloudflare Worker проверь что есть:
```javascript
'Access-Control-Allow-Origin': '*'
```

### Проблема: "429 Too Many Requests"

**Решение:**
Groq бесплатный план: 30 запросов/минуту.
Если превысил — подожди минуту.

---

## 💰 Лимиты Groq (бесплатный план)

- **30 запросов в минуту**
- **14,400 запросов в день**
- **Модель:** llama-3.3-70b-versatile
- **Скорость:** ~500 токенов/сек (очень быстро!)

Этого хватит на **сотни клиентов в день**.

---

## 🎯 Итого что нужно:

1. ✅ Groq API ключ из https://console.groq.com/
2. ✅ Cloudflare Worker с кодом из `/cloudflare-worker/worker.js`
3. ✅ Переменная `GROQ_API_KEY` в настройках Worker
4. ✅ URL Worker в `assets/js/ai-chat.js`

---

## 📞 Поддержка

Если что-то не работает:
1. Проверь консоль браузера (F12)
2. Проверь логи Cloudflare Worker (вкладка Logs)
3. Проверь что ключ Groq активен

**Groq документация:** https://console.groq.com/docs/quickstart
