# Expert Article Rewrite — Design Spec

**Date:** 2026-05-18
**Status:** Approved

## Goal

Rewrite all 16 existing blog posts to expert SEO level. Search engines should rank them high for target queries, reference them in snippets, and drive traffic to service pages.

## Non-Goals

- Do NOT modify the article generator (`generate_article.py`)
- Do NOT change the publishing schedule (Mon/Wed/Fri via GitHub Actions)
- Do NOT change existing slugs/URLs

## Article Template

### Front Matter (every article)
```yaml
---
layout: post
title: "SEO title 50-65 chars — keyword first + geo (Москва/Нахабино)"
description: "Meta description 140-160 chars with CTA and keywords"
date: <keep existing>
slug: <keep existing>
category: <keep existing>
tags: [3-5 relevant tags]
keywords: "лазерная резка, <topic keywords>, Москва, Нахабино"
author: "Цех лазерной резки"
generated: false
reviewed: true
---
```

### Structure (every article)

1. **Introduction** — 150-200 words, no heading. Key phrase in first sentence. Geo mention (Москва, Нахабино, МО). Problem statement.

2. **H2 sections** — 4-6 sections, 150-300 words each. Technical depth: real steel grades (Ст3, 09Г2С, AISI 304), GOST references, comparisons, thickness ranges, precision data. Context links to service pages.

3. **## Практические советы** — 7-10 bullet points. Actionable, with numbers. Each 1-2 sentences.

4. **## Часто задаваемые вопросы** — 5 Q&A pairs. Questions targeting low-frequency search queries. Answers 2-4 sentences.

5. **## Заключение** — 3-4 sentences summary + CTA block.

### CTA Block (end of every article)
```html
<div class="article-cta">
  <a href="/calculator/" class="btn btn-primary">Рассчитать стоимость</a>
  <a href="/contacts/" class="btn btn-secondary">Отправить чертёж</a>
</div>
```

### SEO Requirements
- Title: 50-65 chars, keyword at start, geo mention
- Description: 140-160 chars, includes CTA
- Keywords: 5-7 phrases, must include "лазерная резка" + topic terms + "Москва"
- H2 headings: at least 1 must contain primary keyword
- Internal links: 3-5 to service pages, 1-2 to other blog posts
- Geo mentions: Москва, Нахабино, Московская область — at least 3 times per article
- LSI terms: волоконный лазер, раскрой, допуски, ЧПУ, кромка реза, квалитет

### Target Word Count
1500-2000 words per article

## Articles to Rewrite (16 total)

| # | File | Topic | Primary Keyword |
|---|------|-------|----------------|
| 1 | 2024-01-15-podgotovka-chertezha... | Подготовка чертежа DXF/DWG | подготовка чертежа для лазерной резки |
| 2 | 2026-04-10-vybor-tolshchiny-metalla | Выбор толщины металла | выбор толщины металла для лазерной резки |
| 3 | 2026-04-14-lazer-vs-plazma | Лазер vs плазма | лазерная vs плазменная резка сравнение |
| 4 | 2026-04-15-podgotovka-dxf | Подготовка DXF | подготовка DXF файлов для лазерной резки |
| 5 | 2026-04-17-dopuski-pogreshnosti | Допуски и погрешности | допуски при лазерной резке ГОСТ |
| 6 | 2026-04-20-teplovoe-vozdejstvie | Тепловое воздействие | зона термического влияния лазерная резка |
| 7 | 2026-04-22-volokonnyj-vs-co2 | Волоконный vs CO2 | волоконный лазер vs CO2 сравнение |
| 8 | 2026-04-24-skorost-rezki | Скорость резки | скорость лазерной резки металла |
| 9 | 2026-04-27-kachestvo-tortsa | Качество торца | качество кромки лазерной резки |
| 10 | 2026-04-29-rezka-nerzhavejki | Резка нержавейки | лазерная резка нержавейки AISI 304 |
| 11 | 2026-05-01-rezka-alyuminiya | Резка алюминия | лазерная резка алюминия АД31 |
| 12 | 2026-05-04-rezka-ocinkovki | Резка оцинковки | лазерная резка оцинкованной стали |
| 13 | 2026-05-08-rezka-medi-latuni | Резка меди и латуни | лазерная резка меди латуни |
| 14 | 2026-05-11-rezka-akrila | Резка акрила | лазерная резка акрила оргстекла |
| 15 | 2026-05-13-rezka-fanery | Резка фанеры | лазерная резка фанеры МДФ |
| 16 | 2026-05-15-kak-oformit-zakaz | Как оформить заказ | как оформить заказ на лазерную резку |

## CSS Addition

New class for article CTA block:
```css
.article-cta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 40px 0 20px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(255,107,43,0.08), rgba(255,107,43,0.02));
  border: 1px solid rgba(255,107,43,0.12);
  border-radius: 16px;
}
```

## Process

1. Rewrite article 1 (2024-01-15, manual article) — user reviews and approves
2. Rewrite articles 2-10 — batch of 8
3. Rewrite articles 11-16 — batch of 5
4. Add `.article-cta` CSS to main.css
5. Add CTA styling
6. Jekyll build verification

## Success Criteria

- Each article: 1500-2000 words
- Each article: author = "Цех лазерной резки", generated: false
- Each article: 5+ H2 sections, 5 FAQ items, CTA block
- Each article: 3-5 internal links to services
- Each article: unique title + description with geo
- Jekyll build: 0 errors
