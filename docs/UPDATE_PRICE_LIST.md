# Как обновить цены и прайс PDF

Коротко: **все цифры цен** — в одном файле **`_data/prices.yml`**. Телефон, почта и адрес для PDF — в **`_data/business.yml`**.

После пуша в **main** сайт собирается на GitHub Pages: **PDF на проде обновляется сам** (скрипт запускается в деплое и записывает файл в собранный сайт, **без** коммита PDF в репозиторий).

---

## Где что менять

| Что нужно | Файл |
|-----------|------|
| Цены лазерной резки по мм (для калькулятора и таблиц) | `_data/prices.yml` → блок `laser` → `steel` / `stainless` / `stainless_316` / `aluminum` → `thickness_mm` |
| Строки таблицы «лазер» на калькуляторе и в PDF | `_data/prices.yml` → `calculator_laser_tables` (материал и диапазоны мм) |
| Доп. услуги (гибка, покраска, …) | `_data/prices.yml` → `additional_services` |
| Карточки под таблицей на `/calculator/` | `_data/prices.yml` → `price_notes` (в тексте можно использовать число `1500` — оно подставится из `min_order`) |
| Минимальная сумма заказа в калькуляторе | `_data/prices.yml` → `min_order` |
| Телефон, email, часы, адрес в PDF | `_data/business.yml` |

Таблица «от … ₽/пог.м» на **`/services/metal/`** строится из **`metal_summary_rows`** в том же `prices.yml` (колонка «от» — минимум по диапазону `from_mm`–`to_mm`).

---

## Как поставить зависимости (один раз на компьютере)

Нужны **Python 3** и шрифты **DejaVu** (для русского текста в PDF). На Linux обычно пакет вроде `fonts-dejavu-core`.

Из **корня репозитория**:

```bash
pip install -r requirements/price-list.txt
```

(или `pip install --user -r requirements/price-list.txt` — как удобнее.)

---

## Как проверить PDF **перед** пушем (одна команда)

Из корня репозитория после правок в YAML:

```bash
python3 scripts/build_price_list.py --output /tmp/price-list.pdf && strings /tmp/price-list.pdf | grep -E 'tel:|mailto:'
```

Должны появиться, например, **`tel:+79854563764`** и **`mailto:info@lasercut.ru`**.

Опционально откройте `/tmp/price-list.pdf` глазами.

Чтобы перезаписать файл в репозитории (если нужно закоммитить PDF вручную):

```bash
python3 scripts/build_price_list.py
```

В консоли будет строка вида **`OK: wrote assets/files/price-list.pdf`** (или другой путь, если передали `--output`).

Дополнительно:

```bash
strings assets/files/price-list.pdf | grep -E 'tel:|mailto:'
```

---

## Деплой (GitHub Actions)

В workflow **Deploy to GitHub Pages** после `jekyll build` выполняется:

`python3 scripts/build_price_list.py --output _site/assets/files/price-list.pdf`

В репозиторий PDF **не коммитится** — в артефакт попадает уже собранный сайт с актуальным PDF.

---

## Скрипт: аргументы

| Аргумент | Значение по умолчанию |
|----------|------------------------|
| `--output` | `assets/files/price-list.pdf` |
| `--prices` | `_data/prices.yml` |
| `--business` | `_data/business.yml` |

Пример:

```bash
python3 scripts/build_price_list.py --output /tmp/price-list.pdf --prices _data/prices.yml
```
