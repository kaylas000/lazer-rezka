#!/usr/bin/env python3
"""
Бот-контролёр качества: проверяет сгенерированные статьи
"""

import os
import sys
import yaml
import re

def check_article(filepath):
    """Проверить качество статьи"""
    errors = []
    warnings = []
    
    if not os.path.exists(filepath):
        return False, [f"Файл не найден: {filepath}"], []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Разделить на front matter и контент
    parts = content.split('---')
    if len(parts) < 3:
        errors.append("Отсутствует front matter")
        return False, errors, warnings
    
    try:
        front_matter = yaml.safe_load(parts[1])
    except Exception as e:
        errors.append(f"Ошибка парсинга front matter: {e}")
        return False, errors, warnings
    
    article_content = '---'.join(parts[2:]).strip()
    
    # Проверка front matter
    required_fields = ['layout', 'title', 'description', 'date', 'slug', 'category', 'tags']
    for field in required_fields:
        if field not in front_matter:
            errors.append(f"Отсутствует поле: {field}")
    
    # Проверка title
    if 'title' in front_matter:
        title_len = len(front_matter['title'])
        if title_len > 60:
            errors.append(f"Title слишком длинный: {title_len} символов (макс 60)")
        elif title_len < 20:
            warnings.append(f"Title слишком короткий: {title_len} символов")
    
    # Проверка description
    if 'description' in front_matter:
        desc_len = len(front_matter['description'])
        if desc_len < 100 or desc_len > 165:
            errors.append(f"Description должен быть 100-165 символов, сейчас: {desc_len}")
    
    # Проверка slug
    if 'slug' in front_matter:
        slug = front_matter['slug']
        if not re.match(r'^[a-z0-9-]+$', slug):
            errors.append(f"Slug содержит недопустимые символы: {slug}")
    
    # Проверка category
    if 'category' in front_matter:
        valid_categories = ['technical', 'materials', 'tips', 'application']
        if front_matter['category'] not in valid_categories:
            errors.append(f"Недопустимая категория: {front_matter['category']}")
    
    # Проверка контента
    word_count = len(article_content.split())
    if word_count < 500:
        errors.append(f"Статья слишком короткая: {word_count} слов (минимум 500)")
    elif word_count > 3000:
        warnings.append(f"Статья очень длинная: {word_count} слов")
    
    # Проверка заголовков H2
    h2_count = len(re.findall(r'^## ', article_content, re.MULTILINE))
    if h2_count < 2:
        errors.append(f"Недостаточно заголовков H2: {h2_count} (минимум 2)")
    
    # Проверка FAQ секции
    if 'FAQ' not in article_content and 'Часто задаваемые вопросы' not in article_content:
        warnings.append("Отсутствует FAQ секция")
    
    # Проверка ключевых слов
    keywords = ['лазерная резка', 'резка', 'металл', 'материал']
    found_keywords = sum(1 for kw in keywords if kw.lower() in article_content.lower())
    if found_keywords < 2:
        warnings.append(f"Мало ключевых слов в тексте: {found_keywords}")
    
    # Итоговая оценка
    is_valid = len(errors) == 0
    
    return is_valid, errors, warnings

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_quality.py <filepath>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    print(f"🔍 Проверка качества: {filepath}")
    
    is_valid, errors, warnings = check_article(filepath)
    
    if errors:
        print("\n❌ ОШИБКИ:")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print("\n⚠️  ПРЕДУПРЕЖДЕНИЯ:")
        for warning in warnings:
            print(f"  - {warning}")
    
    if is_valid:
        print("\n✅ Статья прошла проверку качества")
        sys.exit(0)
    else:
        print("\n❌ Статья НЕ прошла проверку качества")
        sys.exit(1)

if __name__ == '__main__':
    main()
