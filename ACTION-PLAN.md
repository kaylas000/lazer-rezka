# SEO Action Plan: ceh-lazer-rezka.ru

**Generated:** 2026-07-01  
**Overall Score:** 74/100  

---

## Critical (Fix This Week)

### 1. ~~Enable SSL Certificate~~ ✅ УЖЕ ВКЛЮЧЕН
SSL сертификат уже активен.

### 2. Проверить Яндекс Бизнес (аналог GBP для Яндекса)
**Impact:** Критический — 32% веса локальной выдачи Яндекса  
**Effort:** Низкий  
**Как:**
1. Перейти в Яндекс Бизнес (business.yandex.ru)
2. Найти или создать профиль "Цех лазерной резки"
3. Категория: "Металлообработка" или "Лазерная резка"
4. Добавить фото, режим работы, услуги
5. Связать с Яндекс.Картами (уже есть интеграция)

### 3. Убрать дублирующиеся схемы
**Impact:** Средний — предотвращает путаницу у Яндекса  
**Effort:** Низкий  
**Как:** В `_config.yml` отключить генерацию WebSite schema из Jekyll SEO tag или убрать кастомную WebSite schema. Оставить один источник.

---

## High Priority (Fix Within 1 Week)

### 4. Clean Sitemap
**Impact:** Medium — Crawl budget efficiency  
**Effort:** Low  
**How:** Remove from sitemap.xml:
- `/CLAUDE/`
- `yandex_a4b834c1303af8e9.html`
- `zen_9nx4HTzlTGMA0bRBeHQOiwIXmpgoyrroNsRMJMSW6TyAjRZ4bIli00Bsj6I4qrCt.html`
- `/assets/files/price-list.pdf`

### 5. Fix BreadcrumbList Item Names
**Impact:** Medium — Rich results quality  
**Effort:** Low  
**How:** In `_includes/schema-markup.html`, change BreadcrumbList item names from full page titles to short labels:
- "Лазерная резка металла в Москве и Голицыно — Цены от 56 ₽/м" → "Лазерная резка"
- "Услуги лазерной резки и металлообработки" → "Услуги"

### 6. Add Security Headers
**Impact:** Medium — Security + trust  
**Effort:** Medium  
**How:** Add to server config (`.htaccess` or `_headers` file):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 7. Add FAQPage Schema to Homepage
**Impact:** High — Rich snippets  
**Effort:** Low  
**How:** Add FAQPage JSON-LD to homepage FAQ section. Template:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Сколько стоит лазерная резка металла?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Цены начинаются от 56 ₽/погонный метр для стали, от 73 ₽/м для нержавейки, от 70 ₽/м для алюминия..."
      }
    }
  ]
}
```

### 8. Shorten Title Tags
**Impact:** Medium — SERP display  
**Effort:** Low  
**How:** Reduce to max 60 characters. Examples:
- Current: "Лазерная резка металла в Москве и Голицыно — Цены от 56 ₽/м Цех лазерной резки" (84 chars)
- Fixed: "Лазерная резка металла — от 56 ₽/м | Цех лазерной резки" (56 chars)

---

## Medium Priority (Fix Within 1 Month)

### 9. Activate Google Review Generation
**Impact:** High — Local rankings + trust  
**Effort:** Medium  
**How:**
1. Create Google review link (search "Google review link generator")
2. Add "Оставить отзыв в Google" button to /reviews/ page
3. Send follow-up email to recent customers with review link
4. Target: 2-3 new reviews per month (18-day cadence rule)

### 10. Add Article Schema to Blog Posts
**Impact:** Medium — Rich results + AI citation  
**Effort:** Low  
**How:** In blog post layout, add Article JSON-LD with:
- headline, author (Person), datePublished, dateModified, image, publisher

### 11. Fix Twitter Meta Tags
**Impact:** Low — Social sharing  
**Effort:** Low  
**How:** Either add valid @username or remove twitter:site and twitter:creator tags.

### 12. Implement IndexNow
**Impact:** Medium — Bing/Yandex fast indexing  
**Effort:** Medium  
**How:**
1. Generate IndexNow key
2. Upload key file to site root
3. Add endpoint to robots.txt
4. Ping IndexNow API on content changes

### 13. Expand Location Pages
**Impact:** Medium — Local content depth  
**Effort:** Medium  
**How:** Add 100-200 words to /golitsyno/ and other location pages:
- Drive time from Moscow center
- Nearby industrial zones
- District-specific projects completed
- Local landmarks for wayfinding

### 14. Add Author Bylines to Blog Posts
**Impact:** Medium — E-E-A-T + AI citation  
**Effort:** Low  
**How:** Add byline template: "Автор: Инженер-технолог Цеха лазерной резки | [LinkedIn link]"

### 15. Create "About" / Team Page
**Impact:** Medium — Trust + authority  
**Effort:** Medium  
**How:** Create /about/ with:
- Company history (founded 2020)
- Team photos and qualifications
- Equipment specs (3kW fiber laser, 3000×1500mm bed)
- Certifications (if any)

### 16. Оптимизировать Яндекс.Карты + подключить Яндекс.Вебмастер
**Impact:** Высокий — видимость в Яндексе  
**Effort:** Низкий  
**Как:**
1. Проверить Яндекс Бизнес (business.yandex.ru) — заполнить профиль
2. Подключить Яндекс.Вебмастер (webmaster.yandex.ru) — мониторинг индексации
3. Отправить sitemap.xml в Яндекс.Вебмастер
4. Проверить加速 индексации через Яндекс.Вебмастер

---

## Low Priority (Backlog)

### 17. Add Portfolio Preview Carousel on Homepage
**Impact:** Medium — Designer persona + visual proof  
**Effort:** Medium

### 18. Add Client Logos Strip
**Impact:** Low — Authority signals  
**Effort:** Low

### 19. Clean knowsAbout in Schema
**Impact:** Low — Schema validity  
**Effort:** Low

### 20. Add font-display=swap to Google Fonts
**Impact:** Low — CLS improvement  
**Effort:** Low

### 21. Create YouTube Channel
**Impact:** High — AI visibility (0.737 correlation)  
**Effort:** High

### 22. Build Reddit Presence
**Impact:** Medium — AI visibility (46.7% Perplexity)  
**Effort:** Medium

### 23. Add Certifications/Credentials
**Impact:** Low — Trust + authority  
**Effort:** Low

### 24. Add "Last Updated" Timestamps
**Impact:** Low — Freshness signals  
**Effort:** Low

---

## Чек-лист мониторинга (Яндекс-фокус)

После внедрения исправлений отслеживать:

- [ ] Яндекс.Вебмастер — Статус индексации, ошибки покрытия
- [ ] Яндекс Бизнес — Статистика, отзывы, актуальность данных
- [ ] Позиции в Яндексе — Еженедельно для "лазерная резка металла Москва"
- [ ] Количество отзывов — Цель: 60+ отзывов к концу 2026
- [ ] Core Web Vitals — Запускать Lighthouse ежемесячно
- [ ] Яндекс.Метрика — Глубина просмотра, время на сайте, конверсия
- [ ] AI-видимость — Проверять Яндекс.Алиса, ChatGPT, Perplexity ежеквартально

---

*Action plan generated by MiMo Code SEO Audit — 2026-07-01*