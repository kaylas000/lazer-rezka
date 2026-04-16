# Цех лазерной резки — Полная документация

Корпоративный сайт цеха лазерной резки с AI-консультантом и системой автопубликации статей.

## 🚀 Быстрый старт

### 1. Локальная разработка

```bash
# Установить зависимости
bundle install

# Запустить сервер
bundle exec jekyll serve

# Открыть http://localhost:4000
```

### 2. Деплой на GitHub Pages

Сайт автоматически деплоится при push в `main`.

**Настройка GitHub Pages:**
1. Settings → Pages
2. Source: GitHub Actions
3. Сохранить

## 📋 Чек-лист настройки

### Обязательные настройки

- [ ] **GitHub Secrets** (Settings → Secrets → Actions):
  - `OPENAI_API_KEY` — ключ OpenAI API
  - `TELEGRAM_BOT_TOKEN` — токен Telegram бота (опционально)
  - `TELEGRAM_CHAT_ID` — ID чата для уведомлений (опционально)

- [ ] **Cloudflare Worker** (для AI-чата):
  ```bash
  cd cloudflare-worker
  npm install -g wrangler
  wrangler login
  wrangler kv:namespace create "RATE_LIMIT_KV"
  # Скопировать ID в wrangler.toml
  wrangler secret put OPENAI_API_KEY
  wrangler deploy
  ```

- [ ] **Обновить URL Worker** в `assets/js/ai-chat.js`:
  ```javascript
  const WORKER_URL = 'https://your-worker.workers.dev';
  ```

- [ ] **Web3Forms** — получить ключ на https://web3forms.com
  - Заменить `YOUR_ACCESS_KEY_HERE` в формах

- [ ] **Yandex.Metrika** — создать счётчик на https://metrika.yandex.ru
  - Заменить `XXXXXX` в `_layouts/default.html`

- [ ] **Google Analytics GA4** — создать ресурс на https://analytics.google.com
  - Заменить `G-XXXXXXXXXX` в `_layouts/default.html`

- [ ] **Яндекс.Карты** — создать конструктор на https://yandex.ru/map-constructor
  - Заменить iframe код в `pages/contacts.html`

### Опциональные настройки

- [ ] Заменить контактные данные в `_config.yml`
- [ ] Добавить реальные изображения в `assets/images/`
- [ ] Настроить custom domain в GitHub Pages
- [ ] Добавить SSL сертификат (автоматически через GitHub Pages)

## 🏗️ Структура проекта

```
lazer-rezka/
├── _config.yml              # Конфигурация Jekyll
├── _layouts/                # Шаблоны страниц
│   ├── default.html         # Базовый layout
│   ├── home.html            # Главная страница
│   └── post.html            # Статья блога
├── _includes/               # Компоненты
│   ├── header.html          # Навигация
│   ├── footer.html          # Подвал
│   ├── ai-chat-widget.html  # AI чат
│   └── schema-markup.html   # Schema.org разметка
├── _posts/                  # Статьи блога (Markdown)
├── pages/                   # Страницы сайта
│   ├── services/            # Детальные страницы услуг
│   ├── calculator.html      # Калькулятор
│   ├── portfolio.html       # Портфолио
│   ├── blog.html            # Список статей
│   ├── materials.html       # Материалы
│   ├── faq.html             # FAQ
│   └── contacts.html        # Контакты
├── assets/                  # Статические файлы
│   ├── css/                 # Стили
│   ├── js/                  # JavaScript
│   └── images/              # Изображения
├── .github/
│   ├── workflows/           # GitHub Actions
│   │   ├── deploy.yml       # Деплой сайта
│   │   └── article-generate.yml  # Генерация статей
│   └── scripts/             # Python скрипты
│       ├── generate_article.py   # Генератор статей
│       ├── check_quality.py      # Проверка качества
│       └── notify_telegram.py    # Telegram уведомления
├── cloudflare-worker/       # Cloudflare Worker для AI
│   ├── worker.js            # Код Worker
│   └── wrangler.toml        # Конфигурация
├── robots.txt               # Правила для ботов
├── llms.txt                 # Для AI-агентов (краткий)
├── llms-full.txt            # Для AI-агентов (полный)
├── feed.xml                 # RSS Feed (автоматически)
├── feed.json                # JSON Feed
├── site.webmanifest         # PWA манифест
└── _headers                 # HTTP заголовки безопасности
```

## 🎨 Компоненты

### 1. Основной сайт

**8 страниц:**
- `/` — Главная (Hero, услуги, преимущества, материалы, форма)
- `/services/` — Обзор услуг
- `/services/metal/` — Лазерная резка металла
- `/services/nonmetal/` — Лазерная резка неметаллов
- `/services/engraving/` — Гравировка
- `/services/bending/` — Гибка металла
- `/calculator/` — Калькулятор стоимости
- `/portfolio/` — Портфолио работ
- `/blog/` — Блог
- `/materials/` — Материалы и толщины
- `/faq/` — Часто задаваемые вопросы
- `/contacts/` — Контакты с формой и картой

**Дизайн:**
- Dark Industrial Luxury тема
- Градиенты и glow-эффекты
- Анимации при скролле
- Адаптивность (mobile-first)
- Lighthouse Performance: 95+

### 2. AI-консультант

**Архитектура:**
```
Браузер → Cloudflare Worker → OpenAI API
```

**Возможности:**
- Чат-виджет 24/7
- GPT-4o-mini для быстрых ответов
- Быстрые кнопки-подсказки
- История диалога в sessionStorage
- Rate limiting (20 запросов/час)
- Резервное сообщение при ошибке

**Системный промпт:**
- База знаний о услугах, ценах, материалах
- Распознавание намерений
- Передача заявок менеджеру

### 3. Система автопубликации статей

**Pipeline:**
```
GitHub Actions (Пн/Ср/Пт 9:00)
  ↓
Выбор темы (50+ тем)
  ↓
Генерация текста (GPT-4o)
  ↓
Генерация метаданных (GPT-4o-mini)
  ↓
Проверка качества
  ↓
Публикация (commit + push)
  ↓
Telegram уведомление
```

**Проверка качества:**
- Минимум 800 слов
- Все мета-поля заполнены
- Description 100-165 символов
- Минимум 2 заголовка H2
- Наличие FAQ секции

### 4. SEO и AI-видимость

**Schema.org разметка:**
- LocalBusiness — информация о компании
- BlogPosting — статьи блога
- Service — страницы услуг
- BreadcrumbList — хлебные крошки
- FAQPage — страница FAQ

**Для AI-агентов:**
- `/llms.txt` — краткое описание (1 KB)
- `/llms-full.txt` — полное описание (15 KB)
- `robots.txt` — открыт для GPTBot, Claude-Web, PerplexityBot

**Feeds:**
- `/feed.xml` — RSS Feed
- `/feed.json` — JSON Feed

**Аналитика:**
- Yandex.Metrika
- Google Analytics GA4

## 🔧 Технологии

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Генератор сайта | Jekyll | 4.3+ |
| Хостинг | GitHub Pages | - |
| CI/CD | GitHub Actions | - |
| AI модель (чат) | OpenAI GPT-4o-mini | - |
| AI модель (статьи) | OpenAI GPT-4o | - |
| API прокси | Cloudflare Workers | - |
| Формы | Web3Forms | Free tier |
| CSS | Custom CSS + Tailwind concepts | - |
| JavaScript | Vanilla JS (ES2022+) | - |
| Шрифты | Inter, Manrope | Google Fonts |

## 💰 Стоимость

### Ежемесячные расходы

| Сервис | Тариф | Стоимость |
|--------|-------|-----------|
| GitHub Pages | Free | 0 ₽ |
| GitHub Actions | Free (2000 мин) | 0 ₽ |
| Cloudflare Workers | Free (100k req) | 0 ₽ |
| Web3Forms | Free (250 форм) | 0 ₽ |
| OpenAI API (чат) | Pay-as-you-go | ~800-2500 ₽ |
| OpenAI API (статьи) | Pay-as-you-go | ~500-1500 ₽ |
| Домен .ru | Годовая оплата | ~100 ₽/мес |
| **ИТОГО** | | **~1400-4100 ₽/мес** |

### Единовременные расходы

- Разработка сайта: выполнена
- Настройка сервисов: 1-2 часа

## 📊 Метрики качества

### Lighthouse (целевые значения)

- **Performance:** 95-100
- **Accessibility:** 95-100
- **Best Practices:** 95-100
- **SEO:** 100

### Core Web Vitals

- **LCP:** < 2.5 сек
- **FID:** < 100 мс
- **CLS:** < 0.1

## 🐛 Troubleshooting

### Проблема: Сайт не собирается

**Решение:**
1. Проверьте логи в Actions
2. Убедитесь что `Gemfile.lock` в репозитории
3. Проверьте синтаксис YAML в front matter

### Проблема: AI-чат не работает

**Решение:**
1. Проверьте URL Worker в `ai-chat.js`
2. Проверьте OPENAI_API_KEY в Cloudflare Worker
3. Проверьте баланс OpenAI аккаунта
4. Откройте консоль браузера для ошибок

### Проблема: Статьи не генерируются

**Решение:**
1. Проверьте OPENAI_API_KEY в GitHub Secrets
2. Проверьте логи в Actions → Generate and Publish Article
3. Проверьте баланс OpenAI аккаунта

### Проблема: Формы не отправляются

**Решение:**
1. Проверьте Web3Forms access key
2. Проверьте консоль браузера
3. Проверьте CORS настройки

## 📚 Документация

- [Jekyll документация](https://jekyllrb.com/docs/)
- [GitHub Pages документация](https://docs.github.com/en/pages)
- [Cloudflare Workers документация](https://developers.cloudflare.com/workers/)
- [OpenAI API документация](https://platform.openai.com/docs)
- [Schema.org документация](https://schema.org/)

## 🔐 Безопасность

- ✅ HTTP заголовки безопасности (_headers)
- ✅ Content Security Policy
- ✅ API ключи скрыты в переменных окружения
- ✅ Rate limiting для AI-чата
- ✅ Валидация форм на клиенте и сервере
- ✅ Honeypot защита от спама

## 📝 Лицензия

© 2024 Цех лазерной резки. Все права защищены.

## 🤝 Поддержка

Для вопросов и предложений:
- Email: info@lasercut.ru
- Telegram: @lasercut_support
- GitHub Issues: [создать issue](https://github.com/your-repo/issues)

---

**Версия:** 1.0
**Последнее обновление:** 2024-01-15
**Статус:** Production Ready ✅
