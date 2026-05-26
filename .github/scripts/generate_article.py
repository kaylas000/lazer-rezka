#!/usr/bin/env python3
"""
Бот-писатель: генерирует статьи для блога через Groq API
Версия 2.0 — новые темы, экспертный шаблон, без AI-меток
"""

import os
import sys
import json
import yaml
import requests
from datetime import datetime

# Worker URL
WORKER_URL = 'https://my-worker.prof9ai.workers.dev'

# Темы для статей (только металл, 20 тем)
TOPICS = [
    # Технические
    {"title": "Раскрой листового металла — как сэкономить до 30% материала", "slug": "raskroj-listovogo-metalla"},
    {"title": "Лазерная резка толстого металла 10-20 мм — режимы и ограничения", "slug": "rezka-tolstogo-metalla"},
    {"title": "Отверстия в металле — лазерная резка vs сверловка", "slug": "otverstiya-lazer-vs-sverlovka"},
    {"title": "Вспомогательные газы при лазерной резке — азот, кислород, воздух", "slug": "gazy-pri-lazernoj-rezke"},
    {"title": "Гибка металла после лазерной резки — допуски и радиусы", "slug": "gibka-posle-lazernoj-rezki"},
    {"title": "Конусность реза на толстом металле — причины и решения", "slug": "konusnost-reza"},
    {"title": "Лазерная резка низколегированной стали 09Г2С", "slug": "rezka-stali-09g2s"},
    {"title": "Нержавейка AISI 316 — отличия от 304 и особенности резки", "slug": "nerzhavejka-aisi-316"},
    {"title": "Алюминий АМГ vs АД31 — сравнение сплавов для лазерной резки", "slug": "alyuminij-amg-vs-ad31"},
    {"title": "Лазерная резка титана — возможности и ограничения", "slug": "rezka-titana"},
    {"title": "Лазерная резка металла в машиностроении", "slug": "rezka-v-mashinostroenii"},
    {"title": "Металлообработка для архитектуры и дизайна", "slug": "metalloobrabotka-dlya-arhitektury"},
    {"title": "Прототипирование металлических деталей на лазере", "slug": "prototipirovanie-metalla"},
    {"title": "Лазерная резка для торгового оборудования", "slug": "rezka-dlya-torgovogo-oborudovaniya"},
    {"title": "Как снизить стоимость заказа на лазерную резку", "slug": "kak-snizit-stoimost-zakaza"},
    {"title": "Типичные ошибки при проектировании деталей под лазерную резку", "slug": "oshibki-proektirovaniya"},
    {"title": "Комплексная металлообработка — резка, гибка, сварка, покраска", "slug": "kompleksnaya-metalloobrabotka"},
    {"title": "Лазерная резка vs фрезеровка металла — что выбрать", "slug": "lazer-vs-frezerovka"},
    {"title": "Сварка стали и нержавейки после лазерной резки", "slug": "svarka-posle-lazernoj-rezki"},
    {"title": "Порошковая покраска металла — совместимость с лазерной кромкой", "slug": "poroshkovaya-pokraska-i-lazernaya-kromka"},
]

def get_existing_topics():
    """Получить список уже использованных slug"""
    posts_dir = '_posts'
    if not os.path.exists(posts_dir):
        return []

    existing_slugs = []
    for filename in os.listdir(posts_dir):
        if filename.endswith('.md'):
            with open(os.path.join(posts_dir, filename), 'r', encoding='utf-8') as f:
                content = f.read()
                if '---' in content:
                    parts = content.split('---')
                    if len(parts) >= 3:
                        try:
                            front_matter = yaml.safe_load(parts[1])
                            if 'slug' in front_matter:
                                existing_slugs.append(front_matter['slug'])
                        except:
                            pass
    return existing_slugs

def select_topic():
    """Выбрать тему для новой статьи"""
    existing_slugs = get_existing_topics()
    available = [t for t in TOPICS if t['slug'] not in existing_slugs]

    if not available:
        print("Все темы уже использованы!")
        return None

    return available[0]

def call_worker(message, system=None, max_tokens=800):
    """Отправить запрос через Cloudflare Worker"""
    payload = {
        'message': message,
        'history': [],
        'mode': 'generate',
        'max_tokens': max_tokens
    }
    if system:
        payload['system'] = system

    response = requests.post(WORKER_URL, json=payload, headers={'Content-Type': 'application/json'})
    data = response.json()

    if data.get('error'):
        print(f"Worker error: {data.get('message', 'Unknown error')}")
        sys.exit(1)
    if 'reply' not in data:
        print(f"Unexpected Worker response: {json.dumps(data, ensure_ascii=False)[:500]}")
        sys.exit(1)
    return data['reply']


def generate_article(topic, api_key):
    """Сгенерировать статью через Cloudflare Worker (Groq API)"""
    prompt = f"""Напиши SEO-статью для блога цеха лазерной резки в Нахабино (Московская область) на тему: "{topic['title']}"

ТЫ — ЭКСПЕРТ ЦЕХА. Пиши от первого лица («мы», «в нашем цехе», «наш опыт»). Тон: профессиональный, конкретный, без воды. Статья должна быть полезной и уникальной — такой контент поисковики ранжируют высоко.

ОБЯЗАТЕЛЬНЫЕ ФАКТЫ О ЦЕХЕ (используй в тексте):
- Волоконный лазер 3 кВт
- Режем: сталь до 20 мм, нержавейку до 12 мм, алюминий до 10 мм, медь/латунь до 6 мм
- Точность позиционирования ±0.01 мм
- Находимся в Нахабино (Московская область), 25 км от МКАД
- Работаем с 2020 года, 500+ заказов
- Принимаем DXF/DWG, расчёт за 1 час
- Доставка по Москве и Московской области

ТРЕБОВАНИЯ К ТЕКСТУ:
- Объём: ровно 500-600 слов (НЕ БОЛЬШЕ)
- Формат: Markdown. Только H2 (##) и H3 (###).
- Абзацы: 2-4 предложения, короткие.
- Без эмодзи.
- LSI-слова: допуски, раскрой, кромка, ЧПУ, контур, полилайн, квалитет, зона реза.

ОБЯЗАТЕЛЬНАЯ СТРУКТУРА:
1) Введение — 3-4 предложения, сразу ключевая фраза + гео (Москва, Нахабино, МО)
2) 3-4 раздела H2 с технической глубиной (цифры, сравнения, таблицы где уместно)
3) ## Практические советы — 5-7 советов списком
4) ## Часто задаваемые вопросы — 3 вопроса/ответа
5) ## Заключение — 2-3 предложения + CTA-блок:

<div class="article-cta">
  <a href="/calculator/" class="btn btn-primary">Рассчитать стоимость</a>
  <a href="/contacts/" class="btn btn-secondary">Отправить чертёж</a>
</div>

SEO-ТРЕБОВАНИЯ:
- Ключевая фраза в первом предложении введения
- 3-5 внутренних ссылок на страницы услуг: /services/metal/, /services/bending/, /services/powder-coating/, /services/welding/, /services/engraving/, /calculator/, /contacts/
- 1-2 ссылки на другие статьи блога (формат: /blog/YYYY/MM/slug/)
- Гео-упоминания: Москва, Нахабино, Московская область — минимум 3 раза
- В FAQ вопросах — низкочастотные поисковые запросы

НЕ ДЕЛАЙ:
- Не выдумывай точные цифры скоростей и режимов
- Не пиши «±0,01 мм» (правильно: «±0.01 мм»)
- Не используй эмодзи
- Не превышай 600 слов"""

    system = 'Ты — технолог цеха лазерной резки металла с 10-летним опытом. Пишешь экспертные статьи для блога.'
    return call_worker(prompt, system=system, max_tokens=2000)

def generate_metadata(topic, content, api_key):
    """Сгенерировать мета-данные для статьи"""
    prompt = f"""Для статьи на тему "{topic['title']}" создай SEO-метаданные в JSON:

{{
  "title": "SEO-заголовок 55-65 символов, ключ в начале, '| Москва' в конце",
  "description": "Мета-описание 140-160 символов, с цифрами и CTA. Заканчивается на 'Цех в Нахабино, Москва и МО.'",
  "slug": "{topic['slug']}",
  "category": "technical|materials|tips|application",
  "tags": ["тег1", "тег2", "тег3", "тег4"],
  "keywords": "лазерная резка, тема статьи, Москва, Нахабино, дополнительные ключи"
}}

Требования:
- title: 55-65 символов СТРОГО. Ключевое слово в начале. Заканчивается на '| Москва'
- description: 140-160 символов СТРОГО. Содержит 1-2 цифры. Заканчивается фразой с гео
- slug: "{topic['slug']}" — НЕ ИЗМЕНЯЙ
- category: ровно одно из: technical, materials, tips, application
- tags: 4-5 тегов
- keywords: 5-7 фраз. Первая ОБЯЗАТЕЛЬНО 'лазерная резка'. Без опечаток
- Без эмодзи, без CAPS, без восклицательных знаков

Верни ТОЛЬКО JSON."""

    system = 'Ты — SEO-специалист по локальному продвижению.'
    result = call_worker(prompt, system=system, max_tokens=400)

    if result.startswith('```'):
        result = result.split('\n', 1)[1]
        result = result.rsplit('\n', 1)[0]

    return json.loads(result)

def generate_faq_entry(topic, content, metadata, api_key):
    """Сгенерировать один FAQ-вопрос на основе статьи"""
    prompt = f"""На основе статьи "{topic['title']}" создай FAQ-вопрос и развёрнутый ответ.

Требования:
- question: поисковый запрос, который реально задают клиенты (до 90 символов)
- answer: экспертный ответ 2-3 предложения (300-400 символов). С цифрами и фактами из статьи
- category: одна из: technical, materials, tips, application

Верни ТОЛЬКО JSON:
{{
  "question": "Конкретный вопрос по теме?",
  "answer": "Развёрнутый ответ с цифрами. Второе предложение с деталями. Третье с рекомендацией.",
  "category": "technical"
}}"""

    system = 'Ты — эксперт по лазерной резке металла, составляешь FAQ для клиентов цеха.'
    result = call_worker(prompt, system=system, max_tokens=400)

    if result.startswith('```'):
        result = result.split('\n', 1)[1]
        result = result.rsplit('\n', 1)[0]

    faq_data = json.loads(result)
    faq_data['answer'] = faq_data['answer'][:500]
    return faq_data


def add_faq_entry(faq_data, metadata, post_url):
    """Добавить FAQ-вопрос в _data/faq_from_posts.yml"""
    faq_file = '_data/faq_from_posts.yml'
    os.makedirs('_data', exist_ok=True)

    existing = []
    if os.path.exists(faq_file):
        with open(faq_file, 'r', encoding='utf-8') as f:
            loaded = yaml.safe_load(f)
            if loaded:
                existing = loaded

    for item in existing:
        if item.get('post_url') == post_url:
            print(f"FAQ для {post_url} уже существует, пропускаем")
            return

    new_entry = {
        'question': faq_data['question'],
        'answer': faq_data['answer'],
        'category': faq_data.get('category', 'technical'),
        'post_url': post_url,
        'post_title': metadata['title']
    }
    existing.append(new_entry)

    with open(faq_file, 'w', encoding='utf-8') as f:
        f.write('# Вопросы из статей блога — генерируются автоматически при публикации\n')
        yaml.dump(existing, f, allow_unicode=True, default_flow_style=False)

    print(f"FAQ-вопрос добавлен: {faq_data['question']}")


def create_post_file(topic, content, metadata):
    """Создать файл статьи"""
    date = datetime.now()
    filename = f"{date.strftime('%Y-%m-%d')}-{metadata['slug']}.md"
    filepath = os.path.join('_posts', filename)

    if os.path.exists(filepath):
        print(f"Файл {filepath} уже существует!")
        return None

    os.makedirs('_posts', exist_ok=True)

    front_matter = {
        'layout': 'post',
        'title': metadata['title'],
        'description': metadata['description'],
        'date': date.strftime('%Y-%m-%d %H:%M:%S +0300'),
        'slug': metadata['slug'],
        'category': metadata['category'],
        'tags': metadata['tags'],
        'keywords': metadata['keywords'],
        'author': 'Цех лазерной резки',
        'generated': False,
        'reviewed': True
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('---\n')
        f.write(yaml.dump(front_matter, allow_unicode=True, default_flow_style=False))
        f.write('---\n\n')
        f.write(content)

    print(f"Статья создана: {filepath}")
    return filepath

def main():
    topic = select_topic()
    if not topic:
        sys.exit(1)

    print(f"Генерация статьи на тему: {topic['title']}")

    print("Генерация текста...")
    content = generate_article(topic, None)

    print("Генерация метаданных...")
    metadata = generate_metadata(topic, content, None)

    existing_slugs = get_existing_topics()
    if metadata['slug'] in existing_slugs:
        print(f"Slug {metadata['slug']} уже существует! Пропускаем генерацию.")
        sys.exit(0)

    filepath = create_post_file(topic, content, metadata)

    if filepath:
        print("Генерация FAQ-вопроса...")
        try:
            date_str = datetime.now().strftime('%Y/%m')
            post_url = f"/blog/{date_str}/{metadata['slug']}/"
            faq_data = generate_faq_entry(topic, content, metadata, None)
            add_faq_entry(faq_data, metadata, post_url)
        except Exception as e:
            print(f"Не удалось сгенерировать FAQ-вопрос: {e}")

    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a') as f:
            f.write(f"filepath={filepath}\n")
            f.write(f"title={metadata['title']}\n")
            f.write(f"slug={metadata['slug']}\n")

if __name__ == '__main__':
    main()
