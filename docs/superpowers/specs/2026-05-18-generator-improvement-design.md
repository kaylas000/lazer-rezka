# Article Generator Improvement — Design Spec

**Date:** 2026-05-18
**Status:** Approved

## Goal

Improve the article generator (`generate_article.py`) to produce SEO-ready articles with correct structure, metadata, and topics. Articles are 500 words (Groq API limit), front matter is human-authored (no AI marks), and FAQ entries are expert-level. This eliminates rework of templates when articles are later expanded.

## Non-Goals

- Do NOT change the publishing schedule (Mon/Wed/Fri via GitHub Actions)
- Do NOT change the Cloudflare Worker or Groq model
- Do NOT modify `article-generate.yml` workflow

## Changes

### 1. `generate_article.py`

**TOPICS:** Replace all 20 topics with 20 new metal-only topics. Remove acrylic and plywood.

**generate_article():**
- max_tokens: 8000 → 2000 (500 words + markup is enough)
- Prompt: require 500 words, 3-4 H2 sections, 5 tips, 3 FAQ items, CTA block, geo mentions, internal links
- Add article CTA HTML block requirement

**create_post_file():**
- Front matter template:
  - `author: "Цех лазерной резки"` (was "AI-редакция")
  - `generated: false` (was true)
  - `reviewed: true` (was false)
  - description must include geo reference

**generate_metadata():**
- Title: 55-65 chars, must end with `| Москва`
- Description: 140-160 chars
- Keywords: 5-7 phrases, first must be "лазерная резка"

**generate_faq_entry():**
- Answer: 2-3 sentences, 300-400 chars
- Category: one of technical, materials, tips, application

### 2. `check_quality.py`

- Min word count: 400 (was 500)
- Min H2 count: 3 (was 2)
- Require author field check
- Require CTA block check
- Add keyword density check

### 3. No changes to:

- `cloudflare-worker.js`
- `article-generate.yml`
- `_layouts/post.html`

## New Topics (20, metal only)

1. Раскрой листового металла — как сэкономить до 30% материала
2. Лазерная резка толстого металла: 10-20 мм — режимы и ограничения
3. Отверстия в металле: лазерная резка vs сверловка
4. Вспомогательные газы: азот vs кислород vs воздух
5. Гибка металла после лазерной резки — допуски и радиусы
6. Конусность реза на толстом металле — как учесть в чертеже
7. Сталь 09Г2С — низколегированная: свойства и резка
8. Нержавейка AISI 316 — отличия от 304 и особенности резки
9. Алюминий АМГ vs АД31 — сравнение сплавов
10. Титан — лазерная резка: возможности и ограничения
11. Лазерная резка металла в машиностроении
12. Металлообработка для архитектуры и дизайна
13. Прототипирование металлических деталей
14. Лазерная резка для торгового оборудования
15. Как снизить стоимость заказа — 10 работающих способов
16. Типичные ошибки при проектировании под лазерную резку
17. Комплексная металлообработка: резка + гибка + сварка + покраска
18. Лазерная резка vs фрезеровка металла
19. Сварка стали после лазерной резки — технологии
20. Порошковая покраска: совместимость с лазерной кромкой

## Success Criteria

- Generator runs without errors
- Articles have correct front matter (no AI marks)
- Articles have CTA block
- FAQ entries are 2-3 sentence expert answers
- Quality checker accepts 400+ word articles
- Jekyll build: 0 errors
