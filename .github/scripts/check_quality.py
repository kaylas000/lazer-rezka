#!/usr/bin/env python3
"""
Бот-контролёр качества: проверяет сгенерированные статьи
Версия 2.0 — новые пороги, проверка автора и CTA
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
    required_fields = ['layout', 'title', 'description', 'date', 'slug', 'category', 'tags', 'author']
    for field in required_fields:
        if field not in front_matter:
            errors.append(f"Отсутствует поле: {field}")

    # Проверка title
    if 'title' in front_matter:
        title_len = len(front_matter['title'])
        if title_len > 70:
            errors.append(f"Title слишком длинный: {title_len} символов (макс 70)")
        elif title_len < 30:
            warnings.append(f"Title слишком короткий: {title_len} символов")
        if '| Москва' not in front_matter['title'] and 'Москва' not in front_matter['title']:
            warnings.append("Title не содержит гео-метку (Москва)")

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

    # Проверка автора — не AI
    if 'author' in front_matter and front_matter['author'] == 'AI-редакция':
        errors.append("Автор не должен быть 'AI-редакция' — используйте 'Цех лазерной резки'")

    # Проверка меток
    if 'generated' in front_matter and front_matter['generated'] == True:
        warnings.append("Поле generated=True — рекомендуется generated: false")

    # Проверка контента
    word_count = len(article_content.split())
    if word_count < 400:
        errors.append(f"Статья слишком короткая: {word_count} слов (минимум 400)")
    elif word_count > 3000:
        warnings.append(f"Статья очень длинная: {word_count} слов")

    # Проверка заголовков H2
    h2_count = len(re.findall(r'^## ', article_content, re.MULTILINE))
    if h2_count < 3:
        errors.append(f"Недостаточно заголовков H2: {h2_count} (минимум 3)")

    # Проверка FAQ секции
    if 'FAQ' not in article_content and 'Часто задаваемые вопросы' not in article_content:
        warnings.append("Отсутствует FAQ секция")

    # Проверка CTA блока
    if 'article-cta' not in article_content:
        errors.append("Отсутствует CTA-блок (article-cta)")

    # Проверка ключевых слов
    keywords = ['лазерная резка', 'металл', 'Москва', 'Нахабино']
    found_keywords = sum(1 for kw in keywords if kw.lower() in article_content.lower())
    if found_keywords < 3:
        warnings.append(f"Мало ключевых слов: {found_keywords}/4 (лазерная резка, металл, Москва, Нахабино)")

    # Проверка внутренних ссылок
    internal_links = len(re.findall(r'\[.+?\]\(/services/|/calculator/|/contacts/|/blog/', article_content))
    if internal_links < 2:
        warnings.append(f"Мало внутренних ссылок: {internal_links} (минимум 2)")

    is_valid = len(errors) == 0

    return is_valid, errors, warnings

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_quality.py <filepath>")
        sys.exit(1)

    filepath = sys.argv[1]

    print(f"Проверка качества: {filepath}")

    is_valid, errors, warnings = check_article(filepath)

    if errors:
        print("\nОШИБКИ:")
        for error in errors:
            print(f"  - {error}")

    if warnings:
        print("\nПРЕДУПРЕЖДЕНИЯ:")
        for warning in warnings:
            print(f"  - {warning}")

    if is_valid:
        print("\nСтатья прошла проверку качества")
        sys.exit(0)
    else:
        print("\nСтатья НЕ прошла проверку качества")
        sys.exit(1)

if __name__ == '__main__':
    main()
