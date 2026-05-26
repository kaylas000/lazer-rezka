#!/usr/bin/env python3
"""
Парсинг цен конкурентов по лазерной резке металла (Москва, 2026)
Запуск: python price_scraper.py
"""

import requests
from bs4 import BeautifulSoup
import re
import json

# Твои текущие цены из _data/prices.yml
MY_PRICES = {
    "steel": {1:80,2:90,3:100,4:110,5:120,6:130,8:150,10:180,12:220,15:280,20:350},
    "stainless": {1:120,2:140,3:160,4:180,5:200,6:220,8:260,10:320,12:400},
    "stainless_316": {1:140,2:160,3:180,4:200,5:220,6:240,8:280,10:340,12:420},
    "aluminum": {1:100,2:110,3:120,4:130,5:140,6:150,8:180,10:220},
}

COMPETITORS = [
    {"name": "Metallux-R", "url": "https://www.metallux-r.ru"},
    {"name": "CapWall", "url": "https://capwall.ru"},
    {"name": "Efesto", "url": "https://efesto.pro"},
    {"name": "Tehno.Moscow", "url": "https://tehno.moscow"},
    {"name": "SAG Composite", "url": "https://sag-composite.ru"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def try_fetch(url):
    """Попробовать загрузить страницу"""
    for suffix in ["", "/price", "/prajs", "/ceny", "/uslugi", "/services", "/lasernaya-rezka"]:
        try:
            r = requests.get(url + suffix, headers=HEADERS, timeout=10)
            if r.status_code == 200 and len(r.text) > 500:
                return r.text, url + suffix
        except:
            pass
    return None, None

def extract_prices(html):
    """Вытащить все числа с рублём из HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text()
    # Ищем паттерны: "80 руб/м", "от 120 ₽", "120₽/пог.м" и т.д.
    patterns = [
        r'(\d+)\s*(?:₽|руб)[./]*(?:пог\.?)?\s*м',
        r'(?:от\s+)?(\d+)\s*(?:₽|руб)',
        r'(\d+)\s*(?:₽|руб)[./]*(?:погонный|пог\.)\s*метр',
    ]
    prices = []
    for p in patterns:
        prices.extend([int(x) for x in re.findall(p, text)])
    return sorted(set(prices))

def main():
    print("=" * 60)
    print("ПАРСИНГ ЦЕН КОНКУРЕНТОВ — ЛАЗЕРНАЯ РЕЗКА МЕТАЛЛА (Москва)")
    print("=" * 60)

    for comp in COMPETITORS:
        print(f"\n>>> {comp['name']} ({comp['url']})")
        html, found_url = try_fetch(comp['url'])
        if html:
            prices = extract_prices(html)
            print(f"    Найдено на: {found_url}")
            print(f"    Цены: {prices[:20]}")
        else:
            print(f"    НЕ УДАЛОСЬ загрузить")

    print("\n" + "=" * 60)
    print("ТВОИ ТЕКУЩИЕ ЦЕНЫ (для сравнения):")
    print("=" * 60)
    for mat, thicknesses in MY_PRICES.items():
        print(f"\n{mat}:")
        for t, price in sorted(thicknesses.items()):
            print(f"  {t}мм: {price} ₽/пог.м")

if __name__ == "__main__":
    main()
