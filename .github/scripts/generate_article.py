#!/usr/bin/env python3
"""
Бот-писатель: генерирует статьи для блога через Groq API
"""

import os
import sys
import json
import yaml
import requests
from datetime import datetime

# Темы для статей с фиксированными slug
WORKER_URL = 'https://my-worker.prof9ai.workers.dev'

TOPICS = [
    # Технические
    {"title": "Выбор толщины металла для лазерной резки", "slug": "vybor-tolshchiny-metalla"},
    {"title": "Лазерная резка vs плазменная: полное сравнение", "slug": "lazer-vs-plazma"},
    {"title": "Подготовка DXF файлов для лазерной резки", "slug": "podgotovka-dxf"},
    {"title": "Допуски и погрешности при лазерной резке", "slug": "dopuski-pogreshnosti"},
    {"title": "Тепловое воздействие лазера на металл", "slug": "teplovoe-vozdejstvie"},
    {"title": "Волоконный vs CO2 лазер: в чём разница", "slug": "volokonnyj-vs-co2"},
    {"title": "Скорость лазерной резки: от чего зависит", "slug": "skorost-rezki"},
    {"title": "Качество торца реза: что влияет и как оценить", "slug": "kachestvo-tortsa"},
    
    # Материалы
    {"title": "Лазерная резка нержавеющей стали AISI 304", "slug": "rezka-nerzhavejki"},
    {"title": "Алюминий для лазерной резки: марки и свойства", "slug": "rezka-alyuminiya"},
    {"title": "Резка оцинкованной стали: особенности", "slug": "rezka-ocinkovki"},
    {"title": "Лазерная резка меди и латуни", "slug": "rezka-medi-latuni"},
    {"title": "Лазерная резка акрила: прозрачный и цветной", "slug": "rezka-akrila"},
    {"title": "Фанера для лазерной резки: выбор и подготовка", "slug": "rezka-fanery"},
    
    # Советы
    {"title": "Как оформить заказ на лазерную резку", "slug": "kak-oformit-zakaz"},
    {"title": "Чек-лист проверки чертежа перед отправкой", "slug": "chek-list-chertezha"},
    {"title": "Как снизить стоимость заказа лазерной резки", "slug": "kak-snizit-stoimost"},
    {"title": "Типичные ошибки при заказе лазерной резки", "slug": "tipichnye-oshibki"},
    
    # Применение
    {"title": "Лазерная резка для производства вывесок", "slug": "rezka-dlya-vyvesok"},
    {"title": "Металлические детали мебели: лазерная резка", "slug": "rezka-dlya-mebeli"},
    {"title": "Лазерная резка в строительстве и архитектуре", "slug": "rezka-v-stroitelstve"},
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
    prompt = f"""Напиши SEO-оптимизированную статью для блога цеха лазерной резки на тему: "{topic['title']}"

Требования:
- Объём: 1200-1800 слов
- Структура: введение, 3-4 основных раздела с подразделами, практические советы, FAQ (5 вопросов), заключение
- Формат: Markdown с заголовками H2 (##) и H3 (###)
- Стиль: профессиональный, но понятный, с конкретными примерами и цифрами
- В конце: призыв к действию (CTA) - предложить рассчитать стоимость или отправить чертёж
- FAQ: 5 вопросов с краткими ответами
- Используй термины: лазерная резка, точность, материал, толщина, DXF, чертёж
- Не используй эмодзи и излишние восклицания

Начни сразу с введения, без заголовка статьи."""

    system = 'Ты - эксперт по лазерной резке металла, пишешь статьи для блога цеха.'
    return call_worker(prompt, system=system, max_tokens=6000)

def generate_metadata(topic, content, api_key):
    """Сгенерировать мета-данные для статьи"""
    prompt = f"""Для статьи на тему "{topic['title']}" создай SEO-метаданные в формате JSON:

{{
  "title": "SEO-заголовок до 60 символов",
  "description": "Мета-описание 150-160 символов",
  "slug": "{topic['slug']}",
  "category": "technical|materials|tips|application",
  "tags": ["тег1", "тег2", "тег3"],
  "keywords": "ключевые, слова, через, запятую"
}}

Требования:
- title: должен содержать ключевые слова и быть привлекательным
- description: должно побуждать к клику
- slug: ИСПОЛЬЗУЙ ТОЛЬКО "{topic['slug']}" - НЕ ИЗМЕНЯЙ!
- category: выбери одну из четырёх
- tags: 3-5 релевантных тегов
- keywords: 5-7 ключевых слов

Верни ТОЛЬКО JSON, без дополнительного текста."""

    system = 'Ты - SEO-специалист.'
    result = call_worker(prompt, system=system, max_tokens=500)
    # Удалить markdown code blocks если есть
    if result.startswith('```'):
        result = result.split('\n', 1)[1]
        result = result.rsplit('\n', 1)[0]
    
    return json.loads(result)

def create_post_file(topic, content, metadata):
    """Создать файл статьи"""
    date = datetime.now()
    filename = f"{date.strftime('%Y-%m-%d')}-{metadata['slug']}.md"
    filepath = os.path.join('_posts', filename)
    
    # Проверить что файл не существует
    if os.path.exists(filepath):
        print(f"⚠️  Файл {filepath} уже существует!")
        return None
    
    # Создать директорию если не существует
    os.makedirs('_posts', exist_ok=True)
    
    # Создать front matter
    front_matter = {
        'layout': 'post',
        'title': metadata['title'],
        'description': metadata['description'],
        'date': date.strftime('%Y-%m-%d %H:%M:%S +0300'),
        'slug': metadata['slug'],
        'category': metadata['category'],
        'tags': metadata['tags'],
        'keywords': metadata['keywords'],
        'author': 'AI-редакция',
        'generated': True,
        'reviewed': False
    }
    
    # Записать файл
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('---\n')
        f.write(yaml.dump(front_matter, allow_unicode=True, default_flow_style=False))
        f.write('---\n\n')
        f.write(content)
    
    print(f"✅ Статья создана: {filepath}")
    return filepath

def main():
    # API key is no longer needed directly - we use the Cloudflare Worker
    # which has the key configured in its environment
    
    # Выбрать тему
    topic = select_topic()
    if not topic:
        sys.exit(1)
    
    print(f"📝 Генерация статьи на тему: {topic['title']}")
    
    # Сгенерировать статью
    print("⏳ Генерация текста...")
    content = generate_article(topic, None)
    
    # Сгенерировать метаданные
    print("⏳ Генерация метаданных...")
    metadata = generate_metadata(topic, content, None)
    
    # Проверить что slug уникален
    existing_slugs = get_existing_topics()
    if metadata['slug'] in existing_slugs:
        print(f"⚠️  Slug {metadata['slug']} уже существует! Пропускаем генерацию.")
        sys.exit(0)
    
    # Создать файл
    filepath = create_post_file(topic, content, metadata)
    
    # Вывести информацию для GitHub Actions
    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        with open(github_output, 'a') as f:
            f.write(f"filepath={filepath}\n")
            f.write(f"title={metadata['title']}\n")
            f.write(f"slug={metadata['slug']}\n")

if __name__ == '__main__':
    main()
