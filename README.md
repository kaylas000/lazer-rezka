# Цех лазерной резки

Корпоративный сайт цеха лазерной резки с AI-консультантом и системой автопубликации статей.

## Технологии

- **Jekyll 4.x** — генератор статических сайтов
- **GitHub Pages** — хостинг
- **GitHub Actions** — CI/CD и автоматизация
- **OpenAI GPT-4** — AI-консультант и генерация статей
- **Cloudflare Workers** — прокси для OpenAI API
- **Web3Forms** — обработка форм
- **Tailwind CSS** — стилизация

## Структура проекта

```
lazer-rezka/
├── _config.yml           # Конфигурация Jekyll
├── _layouts/             # Шаблоны страниц
├── _includes/            # Переиспользуемые компоненты
├── _posts/               # Статьи блога
├── _data/                # Данные (YAML)
├── assets/               # CSS, JS, изображения
├── pages/                # Страницы сайта
├── .github/workflows/    # GitHub Actions
└── index.html            # Главная страница
```

## Локальная разработка

1. Установите зависимости:
```bash
bundle install
```

2. Запустите локальный сервер:
```bash
bundle exec jekyll serve
```

3. Откройте http://localhost:4000

## Деплой

Сайт автоматически деплоится на GitHub Pages при push в ветку `main`.

## Компоненты

### 1. Основной сайт
- 8 страниц (главная, услуги, калькулятор, портфолио, блог, материалы, FAQ, контакты)
- Адаптивный дизайн (mobile-first)
- Lighthouse Performance: 95+

### 2. AI-консультант
- Чат-виджет 24/7
- GPT-4 через Cloudflare Workers
- Быстрые кнопки-подсказки
- История диалога в сессии

### 3. Система автопубликации статей
- Генерация статей через GitHub Actions
- Расписание: Пн/Ср/Пт в 9:00
- Автоматическая проверка качества
- Telegram уведомления

## SEO и AI-видимость

- Schema.org разметка (LocalBusiness, FAQPage, BlogPosting)
- llms.txt для AI-агентов
- Sitemap.xml
- RSS и JSON Feed
- Open Graph и Twitter Cards

## Лицензия

© 2024 Цех лазерной резки. Все права защищены.
