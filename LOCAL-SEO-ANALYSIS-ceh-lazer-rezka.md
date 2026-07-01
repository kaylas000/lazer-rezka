# Local SEO Analysis — ceh-lazer-rezka.ru

**Date**: 2026-07-01  
**Business Type**: Hybrid (physical workshop + service area)  
**Industry**: Home Services — Metal Fabrication / Laser Cutting  
**Address**: Заводской проспект, 34, Голицыно, Московская область, 143041  
**Phone**: +7 (985) 456-37-64  

---

## Overall Score: 62/100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| GBP Signals | 25% | 25 | 6.25 |
| Reviews & Reputation | 20% | 70 | 14.0 |
| Local On-Page SEO | 20% | 80 | 16.0 |
| NAP Consistency & Citations | 15% | 45 | 6.75 |
| Local Schema Markup | 10% | 85 | 8.5 |
| Local Link & Authority | 10% | 30 | 3.0 |

---

## 1. GBP Signals (25/100)

**Status: CRITICAL GAP**

- No Google Maps iframe — Yandex Maps used exclusively (2 embeds: main content + footer)
- No GBP reviews widget or post references
- Business hours visible on all pages (Mon–Fri 09:00–18:00)
- sameAs links only to Telegram and Yandex Maps — no GBP profile linked
- No GBP photos, Q&A, or verification badge detected

The site is optimized for Yandex but invisible to Google's local ranking ecosystem. GBP signals account for 32% of local pack weight — this is the highest-impact gap.

---

## 2. Reviews & Reputation (70/100)

**Strengths:**
- 4.9/5.0 rating — exceeds the 4.5 consumer threshold
- 47 reviews in schema markup
- Specific review content mentioning calculators, materials, turnaround
- Review submission form at /reviews/

**Weaknesses:**
- Most recent review: 22 February 2024 (16 months stale)
- Zero owner responses visible
- Reviews appear self-hosted only — no Google/Yandex/2GIS platform links
- Violates Sterling Sky's 18-day cadence rule (rankings decline after 3 weeks without new reviews)

---

## 3. Local On-Page SEO (80/100)

**Strengths — the strongest dimension:**
- Title tags include "Москва" and "Голицыно" with service keywords
- H1 on /golitsyno/ and /services/metal/ contain city + service
- NAP block visible in geo-info section and footer on all pages
- Click-to-call via tel: links
- 6 dedicated service pages (metal, bending, powder-coating, sandblasting, welding, locksmith)
- 9 location pages (Голицыно, Москва, Одинцово, Красногорск, Химки, Зеленоград, Звенигород, Истра, Можайск)
- Hub-and-spoke internal linking — every page within 3 clicks of homepage
- Breadcrumbs on interior pages

**Location page quality (/golitsyno/):**
- ~400 words of unique content
- Local directions (M1 highway, Golitsyno train station, parking)
- Service list + pricing table
- Passes the swap test — references to "Заводской проспект, 34" and "Одинцовский городской округ" are location-specific
- Estimated 65-70% unique content

**Issues:**
- Homepage H1 lacks city keyword (generic "Лазерная резка металла с точностью ±0.01 мм")
- Embedded map is Yandex, not Google
- Title tags are long (some exceed 100 characters)

---

## 4. NAP Consistency & Citations (45/100)

### Cross-Source NAP Comparison

| Source | Name | Address | Phone |
|---|---|---|---|
| Footer HTML | Цех лазерной резки | Голицыно, Заводской пр-т, 34 | +7 (985) 456-37-64 |
| Contacts page | Цех лазерной резки | Голицыно, Заводской проспект, 34, Московская область | +7 (985) 456-37-64 |
| LocalBusiness schema | Цех лазерной резки | Заводской проспект, 34, Голицыно, Московская область, 143041 | +7 (985) 456-37-64 |

**Inconsistencies found:**
1. **Street abbreviation**: "пр-т" (footer) vs "проспект" (schema, contacts) — minor but should be standardized
2. **Region suffix**: Footer omits "Московская область" — present in schema and contacts
3. **Postal code**: Only in schema (143041) — not visible in page HTML
4. **Schema name inconsistency**: WebSite schema `author` is typed as `Person` instead of `Organization`

**Citation presence:**
- Yelp: No listing found
- BBB: No listing found
- 2GIS: Unknown (not checked via available tools)
- Yandex Maps: Linked in sameAs (`yandex.ru/maps/-/CBuQKSyW`)
- Apple Business Connect: Not claimed
- Bing Places: Not claimed

---

## 5. Local Schema Markup (85/100)

**Status: Excellent — best dimension**

Present JSON-LD schemas on homepage:
- `LocalBusiness` + `Manufacturer` (multi-type array)
- `WebSite` with SearchAction
- `Organization` (duplicate for certainty)
- `BreadcrumbList` (interior pages)

**Properties implemented:**
- name, legalName, url, logo, image, description
- telephone, email, priceRange ("₽₽")
- address (full PostalAddress: street, city, region, postal code, country)
- geo (GeoCoordinates: lat 55.6151, lon 36.960248)
- openingHoursSpecification (Mon–Fri 09:00–18:00)
- areaServed (18 cities + Moscow Oblast as AdministrativeArea)
- aggregateRating (4.9/47/5)
- sameAs (Telegram, Yandex Maps)
- knowsAbout (18 keyword phrases)
- hasOfferCatalog (6 services with descriptions, pricing, areaServed)
- ContactPoint in Organization schema
- foundedDate: "2020"

**Issues:**
1. **Geo precision**: 4 decimal places (55.6151) — Google recommends 5+ (55.61510)
2. **Manufacturer type**: Unusual for a local service business; `LocalBusiness` alone or with a more specific subtype would be more appropriate
3. **No Google Business Profile** in sameAs — only Yandex Maps and Telegram
4. **WebSite schema author**: Typed as `Person` with name "Цех лазерной резки" — should be `Organization`
5. **Missing recommended properties**: `paymentAccepted`, `areaServed` could use more granular postal code coverage

---

## 6. Local Link & Authority Signals (30/100)

**Detected:**
- Telegram channel: `t.me/lasercut`
- Yandex Maps listing: `yandex.ru/maps/-/CBuQKSyW`

**Not detected:**
- Chamber of Commerce membership or mention
- BBB accreditation
- Local press/news mentions
- "Best of" list placements
- Community involvement signals (sponsorships, events)
- Industry directory listings

The site has minimal external authority signals. For a B2B metal fabrication business, presence on industry directories (metalweb, pulscen, 2GIS) and local business directories would strengthen both traditional rankings and AI visibility.

---

## Top 10 Prioritized Actions

### Critical (Immediate Impact)

1. **Claim and optimize Google Business Profile** — Add primary category (Лазерная резка / Металлообработка), photos (workshop, equipment, products), business hours, and description. Link GBP to website. This alone can unlock local pack visibility.

2. **Add Google Maps embed** alongside or replacing the Yandex Maps iframe on homepage and contact page. Google's crawler indexes Google Maps iframes more reliably.

3. **Link GBP in sameAs** — Add the GBP profile URL to the schema sameAs array.

### High Priority (Within 30 Days)

4. **Activate review generation** — Create a system requesting Google reviews from recent customers. Target 2-3 new Google reviews per month minimum. Link the /reviews/ page to Google review direct link.

5. **Fix NAP inconsistencies** — Standardize address to "Заводской проспект, 34" across all pages. Add postal code 143041 to footer. Ensure "Московская область" appears consistently.

6. **Claim Bing Places** — Powers ChatGPT, Copilot, and Alexa local results. Simple claim-and-match process.

7. **Claim Apple Business Connect** — Usage doubled to 27% per BrightLocal 2026 data. Quick setup, high leverage.

### Medium Priority (Within 90 Days)

8. **Add city keyword to homepage H1** — Change to "Лазерная резка металла в Москве и Голицыно" or similar. Currently missing from the primary heading.

9. **Create Google review direct link** and add it to the /reviews/ page alongside the existing self-hosted form. Redirect satisfied customers to Google.

10. **Submit to industry directories** — 2GIS, pulscen.ru, metalweb.ru, and other Russian B2B/metalworking directories. These serve as citation sources for both Yandex and AI-powered search.

### Quick Wins (This Week)

- Increase geo precision in schema to 5 decimal places: `55.61510` → `55.61510` (pad the latitude)
- Fix WebSite schema author type from `Person` to `Organization`
- Shorten homepage title tag (currently 120+ characters — Google truncates at ~60)
- Standardize street name spelling ("пр-т" → "проспект" everywhere)

---

## Limitations

This analysis could not assess:
- **Geo-grid ranking positions** (requires BrightLocal, Local Falcon, or similar)
- **Domain Authority / Trust Flow** (requires Ahrefs, Majestic, or Moz)
- **Comprehensive backlink profile** (only on-page signals checked)
- **Real-time GBP Insights data** (requires GBP dashboard access)
- **Yandex search visibility** (Yandex-specific tools needed)
- **2GIS listing status** (requires 2GIS directory check)
- **AI Overview / ChatGPT visibility** (recommend running `/seo geo ceh-lazer-rezka.ru`)

---

## AI Search Context

For AI-powered local search (ChatGPT, Perplexity, AI Overviews):
- 3 of top 5 AI visibility factors are citation-related (Whitespark 2026)
- ChatGPT sources from Bing index, Yelp, TripAdvisor, BBB — none currently list this business
- Bing Places claim is critical for ChatGPT/Copilot visibility
- Brand mentions correlate 3x more than backlinks with AI visibility (Ahrefs)
- Recommendation: Run `/seo geo ceh-lazer-rezka.ru` for full GEO analysis
