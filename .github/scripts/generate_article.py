#!/usr/bin/env python3
"""
Бот-писатель: генерирует статьи для блога через OpenAI GPT-4o
"""

import os
import sys
import json
import yaml
from datetime import datetime
from openai import OpenAI

# Темы для статей
TOPICS = [
    # Технические
    "Выбор толщины металла для лазерной резки",
    "Лазерная резка vs плазменная: полное сравнение",
    "Подготовка DXF файлов для лазерной резки",
    "Допуски и погрешности при лазерной резке",
    "Тепловое воздействие лазера на металл",
    "Волоконный vs CO2 лазер: в чём разница",
    "Скорость лазерной резки: от чего зависит",
    "Качество торца реза: что влияет и как оценить",
    
    # Материалы
    "Лазерная резка нержавеющей стали AISI 304",
    "Алюминий для лазерной резки: марки и свойства",
    "Резка оцинкованной стали: особенности",
    "Лазерная резка меди и латуни",
    "Лазерная резка акрила: прозрачный и цветной",
    "Фанера для лазерной резки: выбор и подготовка",
    
    # Советы
    "Как оформить заказ на лазерную резку",
    "Чек-лист проверки чертежа перед отправкой",
    "Как снизить стоимость заказа лазерной резки",
    "Типичные ошибки при заказе лазерной резки",
    
    # Применение
    "Лазерная резка для производства вывесок",
    "Металлические детали мебели: лазерная резка",
    "Лазерная резка в строительстве и архитектуре",
]

def get_existing_topics():
    """Получить список уже использованных тем"""
    posts_dir = '_posts'
    if not os.path.exists(posts_dir):
        return []
    
    existing = []
    for filename in os.listdir(posts_dir):
        if filename.endswith('.md'):
            with open(os.path.join(posts_dir, filename), 'r', encoding='utf-8') as f:
                content = f.read()
                # Извлечь title из front matter
                if '---' in content:
                    parts = content.split('---')
                    if len(parts) >= 3:
                        try:
                            front_matter = yaml.safe_load(parts[1])
                            if 'title' in front_matter:
                                existing.append(front_matter['title'])
                        except:
                            pass
    return existing

def select_topic():
    """Выбрать тему для новой статьи"""
    existing = get_existing_topics()
    available = [t for t in TOPICS if t not in existing]
    
    if not available:
        print("Все темы уже использованы!")
        return None
    
    # Выбрать первую доступную тему
    return available[0]

def generate_article(topic, api_key):
    """Сгенерировать статью через OpenAI"""
    client = OpenAI(api_key=api_key)
    
    prompt = f"""Напиши SEO-оптимизированную статью для блога цеха лазерной резки на тему: "{topic}"

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

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Ты - эксперт по лазерной резке металла, пишешь статьи для блога цеха."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=3000,
        temperature=0.7
    )
    
    return response.choices[0].message.content

def generate_metadata(topic, content, api_key):
    """Сгенерировать мета-данные для статьи"""
    client = OpenAI(api_key=api_key)
    
    prompt = f"""Для статьи на тему "{topic}" создай SEO-метаданные в формате JSON:

{{
  "title": "SEO-заголовок до 60 символов",
  "description": "Мета-описание 150-160 символов",
  "slug": "url-friendly-slug",
  "category": "technical|materials|tips|application",
  "tags": ["тег1", "тег2", "тег3"],
  "keywords": "ключевые, слова, через, запятую"
}}

Требования:
- title: должен содержать ключевые слова и быть привлекательным
- description: должно побуждать к клику
- slug: только латиница, цифры и дефисы
- category: выбери одну из четырёх
- tags: 3-5 релевантных тегов
- keywords: 5-7 ключевых слов

Верни ТОЛЬКО JSON, без дополнительного текста."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты - SEO-специалист."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,
        temperature=0.5
    )
    
    result = response.choices[0].message.content.strip()
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
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY не установлен")
        sys.exit(1)
    
    # Выбрать тему
    topic = select_topic()
    if not topic:
        sys.exit(1)
    
    print(f"📝 Генерация статьи на тему: {topic}")
    
    # Сгенерировать статью
    print("⏳ Генерация текста...")
    content = generate_article(topic, api_key)
    
    # Сгенерировать метаданные
    print("⏳ Генерация метаданных...")
    metadata = generate_metadata(topic, content, api_key)
    
    # Создать файл
    filepath = create_post_file(topic, content, metadata)
    
    # Вывести информацию для GitHub Actions
    print(f"::set-output name=filepath::{filepath}")
    print(f"::set-output name=title::{metadata['title']}")
    print(f"::set-output name=slug::{metadata['slug']}")

if __name__ == '__main__':
    main()
