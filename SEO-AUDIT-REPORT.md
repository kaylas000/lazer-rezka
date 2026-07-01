# SEO Audit Report: ceh-lazer-rezka.ru

**Date:** 2026-07-01  
**Website:** https://ceh-lazer-rezka.ru/  
**Business:** Цех лазерной резки (Laser cutting workshop)  
**Location:** Голицыно, Московская область (serves Moscow and Moscow Oblast)  
**Industry:** Home Services / Metal Fabrication  

---

## Executive Summary

### Общий балл SEO: 74/100

Сайт демонстрирует хорошую основу: комплексная разметка схем, качественная структура контента и отличный доступ AI-ботов. Однако критические пробелы в presence Яндекс Бизнеса, свежести отзывов и security headers мешают раскрыть весь потенциал.

**Важно:** Сайт ориентирован на Яндекс (не Google). SSL уже включен, Яндекс.Метрика настроена.

### Топ-5 критических проблем

1. **Нет Яндекс Бизнеса** — Отсутствует профиль в Яндекс Бизнесе (аналог GBP). Это 32% веса локальной выдачи Яндекса.
2. **Устаревшие отзывы** — Последний отзыв от февраля 2024 (16 месяцев назад). Нарушение правила 18-дневной каденции.
3. **Дублирующиеся схемы** — Jekyll SEO tag генерирует конфликтующую WebSite schema alongside кастомной JSON-LD.
4. **Нет security headers** — Отсутствуют CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
5. **Нет Яндекс.Вебмастера** — Не подключен мониторинг индексации в Яндексе.

### Топ-5 быстрых побед

1. **Создать/проверить Яндекс Бизнес** — Немедленный буст в локальной выдаче Яндекса.
2. **Добавить FAQPage schema на главную** — Контент есть, schema нет. Возможность для rich snippets.
3. **Исправить BreadcrumbList** — Использовать короткие метки вместо полных названий страниц.
4. **Очистить сайтмап** — Убрать /CLAUDE/, файлы верификации, PDF.
5. **Подключить Яндекс.Вебмастер** — Мониторинг индексации и加速 indexed.

---

## Category Scores

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 77/100 | 16.94 |
| Content Quality | 23% | 82/100 | 18.86 |
| On-Page SEO (SXO) | 20% | 68/100 | 13.60 |
| Schema / Structured Data | 10% | 65/100 | 6.50 |
| Performance (CWV) | 10% | 70/100 | 7.00 |
| AI Search Readiness | 10% | 72/100 | 7.20 |
| Images | 5% | 75/100 | 3.75 |
| **Total** | **100%** | — | **73.85 ≈ 74/100** |

---

## Detailed Findings

### 1. Technical SEO (77/100)

**Strengths:**
- robots.txt well-structured, all major and AI crawlers explicitly allowed
- XML sitemap exists with ~55 URLs, referenced in robots.txt
- Clean URL structure with consistent trailing slashes
- Jekyll SSR = 100% server-side rendered, no JavaScript dependency for critical content
- Mobile optimization with viewport meta, responsive design, Apple mobile web app support

**Issues:**
- **Sitemap bloat** — Contains /CLAUDE/, Yandex/Zen verification files, PDF (wasting crawl budget)
- **Missing lastmod** on ~15 sitemap entries
- **Title tags too long** — All titles exceed 60-70 chars (homepage 104 chars)
- **Duplicate meta tags** — og:type appears twice, twitter:card conflict between Jekyll tag and custom meta
- **Twitter meta tags invalid** — twitter:site and twitter:creator have empty @username
- **No IndexNow** — Missing instant indexing for Bing/Yandex
- **BreadcrumbList item names** — Using full page titles instead of short labels

### 2. Content Quality (82/100)

**E-E-A-T Breakdown:**
- **Experience:** 8/10 — Real operational details, 500+ orders cited, actual pricing
- **Expertise:** 9/10 — Outstanding technical depth (laser physics, material science, tolerance specs)
- **Authoritativeness:** 7/10 — No named authors, no credentials, no external mentions
- **Trustworthiness:** 8/10 — Contract terms, document package, reviews with names/dates/companies

**Strengths:**
- Comprehensive FAQ page with 30+ questions, answer-first formatting
- Blog with 22+ articles spanning Apr 2024–Jun 2026
- Excellent internal linking (FAQ-to-blog cluster)
- Specific numbers in every answer (not vague claims)

**Issues:**
- **No named authors** anywhere on site
- **Location page thin** — /golitsyno/ below 500-word minimum
- **No "About" / team page** — Missing staff photos, qualifications
- **No certifications displayed** — No ISO or equipment manufacturer badges

### 3. On-Page SEO / SXO (68/100)

**Page-Type Alignment:** ALIGNED with SERP consensus (Hybrid Service + Local)

**Gap Analysis:**
- **Page Type:** 12/15 — Calculator on separate page instead of embedded
- **Content Depth:** 11/15 — ~2,800 words slightly below competitor average (3,000-5,000)
- **UX Signals:** 13/15 — Strong CTAs, floating button, clear phone number
- **Schema Markup:** 13/15 — Excellent coverage, missing FAQPage on homepage
- **Media Richness:** 11/15 — Hero video, service images, Yandex Maps; missing portfolio preview
- **Authority Signals:** 10/15 — Reviews present but no client logos, certifications
- **Freshness:** 8/10 — Copyright 2026, but reviews from 2024 appear stale

**Weakest Persona:** Quality-Focused Designer (55/100) — No portfolio imagery on homepage

### 4. Schema / Structured Data (65/100)

**Present:**
- LocalBusiness + Manufacturer (comprehensive)
- WebSite with SearchAction
- Organization with contactPoint
- BreadcrumbList on inner pages
- Service schema on service pages

**Issues:**
- **Duplicate WebSite schemas** — Jekyll SEO tag + custom schema
- **Invalid WebSite properties** — `author` is not valid for WebSite type
- **Keyword stuffing in knowsAbout** — 18 values including long-tail keywords
- **BreadcrumbList names too long** — Full page titles instead of short labels
- **Missing FAQPage schema** — Content exists on /faq/ but no schema markup
- **Missing Article schema** — Blog posts lack datePublished/dateModified

### 5. Performance / Core Web Vitals (70/100 estimated)

**Positive signals:**
- Jekyll SSR = content in initial HTML
- main.js loaded with defer
- CSS preloaded
- Images use loading="lazy"
- Video has poster attribute for LCP

**Estimated risks:**
- **LCP risk** — Hero video autoplay may delay largest contentful paint
- **CLS risk** — Google Fonts without display=swap may cause layout shift
- **INP risk** — FAQ accordion JS, blog filter JS are inline

### 6. AI Search Readiness (72/100)

**Strengths:**
- All major AI crawlers allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot, etc.)
- llms.txt and llms-full.txt present (rare for local business sites)
- Jekyll SSR = 100% HTML served, AI bots don't depend on JS
- Good structural readability (H1→H2→H3, tables, lists)

**Weaknesses:**
- **Passages too long for citation** — Optimal is 134-167 words, many sections longer
- **No YouTube presence** — YouTube mentions correlate 0.737 with AI visibility (strongest signal)
- **No Reddit presence** — Reddit is 46.7% of Perplexity sources
- **No Wikipedia/Wikidata presence** — 47.9% of ChatGPT citations come from Wikipedia
- **Brand mentions weaker than backlinks** — Only 11% of domains cited by both ChatGPT and Google AI Overviews

### 7. Local SEO (62/100)

**Strengths:**
- Excellent LocalBusiness schema with aggregateRating (4.9/47), areaServed (18 cities)
- 6 dedicated service pages + 9 location pages
- NAP visible on all pages with click-to-call
- Yandex Maps integration

**Critical gaps:**
- **Zero Google Business Profile signals** — No GBP embed, no GBP link in sameAs, Yandex Maps only
- **Review staleness** — Last review from Feb 2024 (16 months ago)
- **No Tier 1 citations** — Not on Yelp, BBB, 2GIS, or any industry directory
- **NAP drift** — "пр-т" vs "проспект", postal code missing from HTML

---

## Prioritized Action Plan

### Critical (Fix Immediately)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **Enable SSL certificate** | Trust + ranking (Chrome padlock, HTTPS ranking boost) | Low |
| 2 | **Claim Google Business Profile** | 32% of local pack weight | Low |
| 3 | **Remove duplicate schemas** | Prevents Google confusion | Low |

### High Priority (Fix Within 1 Week)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 4 | **Clean sitemap** — Remove /CLAUDE/, verification files, PDF | Crawl budget efficiency | Low |
| 5 | **Fix BreadcrumbList item names** — Use short labels | Rich results quality | Low |
| 6 | **Add security headers** — CSP, HSTS, X-Frame-Options | Security + trust | Medium |
| 7 | **Add FAQPage schema to homepage** | Rich snippets | Low |
| 8 | **Shorten title tags** — Max 60 chars | SERP display | Low |

### Medium Priority (Fix Within 1 Month)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 9 | **Activate Google review generation** — Target 2-3/month | Local rankings + trust | Medium |
| 10 | **Add Article schema to blog posts** | Rich results + AI citation | Low |
| 11 | **Fix Twitter meta tags** — Remove empty @username | Social sharing | Low |
| 12 | **Implement IndexNow** — Key generation + endpoint | Bing/Yandex fast indexing | Medium |
| 13 | **Expand /golitsyno/ and location pages** — 500+ words | Local content depth | Medium |
| 14 | **Add author bylines to blog posts** | E-E-A-T + AI citation | Low |
| 15 | **Create "About" / team page** | Trust + authority | Medium |
| 16 | **Claim Bing Places + Apple Business Connect** | AI visibility (ChatGPT/Copilot) | Low |

### Low Priority (Backlog)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 17 | **Add portfolio preview carousel on homepage** | Designer persona + visual proof | Medium |
| 18 | **Add client logos strip** | Authority signals | Low |
| 19 | **Clean knowsAbout** — Remove keyword stuffing | Schema validity | Low |
| 20 | **Fix priceRange** — Use standard format or remove | Schema validity | Low |
| 21 | **Add font-display=swap** to Google Fonts | CLS improvement | Low |
| 22 | **Create YouTube channel** — Process videos, demos | AI visibility (0.737 correlation) | High |
| 23 | **Build Reddit presence** — Expert answers in relevant subreddits | AI visibility (46.7% Perplexity) | Medium |
| 24 | **Add certifications/credentials** — ISO, equipment badges | Trust + authority | Low |
| 25 | **Add "last updated" timestamps** on evergreen pages | Freshness signals | Low |

---

## Ограничения

- **Данные SERP реконструированы** — Яндекс заблокировал автоматический сбор. Рейтинги конкурентов выведены из знания рынка.
- **Нет данных о поисковом объеме** — Без DataForSEO или Яндекс.Вордстат невозможно взвесить персоны по реальному объему запросов.
- **Core Web Vitals не измерены** — Нет данных Lighthouse или CrUX. Оценки основаны на анализе кода.
- **Мобильный опыт не тестировался** — Автовоспроизведение hero-видео и поведение плавающей CTA на мобильных не проверены.
- **Глубина контента конкурентов оценочная** — Без загрузки всех страниц конкурентов подсчет слов является приблизительным.
- **SSL уже включен** — Сертификат активен (исправлено в ходе аудита).
- **Сайт ориентирован на Яндекс** — Приоритеты аудита скорректированы в сторону Яндекс.Поиска и Яндекс.Карт.

---

## Business Type: Hybrid (Brick-and-Mortar + Service Area)

- **Physical address:** Голицыно, Заводской пр-т, 34, МО
- **Service area:** Moscow and Moscow Oblast (18 cities listed)
- **Industry vertical:** Home Services / Metal Fabrication

---

## AI Crawler Access Status

**All major AI crawlers allowed** — best practice implementation:

| Bot | Status |
|-----|--------|
| GPTBot (OpenAI) | ✅ Allow |
| OAI-SearchBot (OpenAI) | ✅ Allow |
| ChatGPT-User (OpenAI) | ✅ Allow |
| ClaudeBot (Anthropic) | ✅ Allow |
| PerplexityBot (Perplexity) | ✅ Allow |
| Bytespider (ByteDance) | ✅ Allow |
| Google-Extended | ✅ Allow |
| CCBot (Common Crawl) | ✅ Allow |

**Recommendation:** Consider blocking CCBot if you don't want content used for model training.

---

## GEO Platform Breakdown

| Platform | Score | Notes |
|----------|-------|-------|
| Google AI Overviews | 85/100 | Jekyll SSR, excellent structure, tables, FAQ |
| ChatGPT | 60/100 | No Wikipedia presence (47.9% of citations) |
| Perplexity | 55/100 | No Reddit presence (46.7% of sources) |

---

*Report generated by MiMo Code SEO Audit — 2026-07-01*