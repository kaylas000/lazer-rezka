#!/usr/bin/env python3
"""
Бот-уведомитель: отправляет уведомления в Telegram
"""

import os
import sys
import requests

def send_telegram_notification(title, url, status="success"):
    """Отправить уведомление в Telegram"""
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        print("⚠️  Telegram credentials не установлены")
        return False
    
    # Эмодзи в зависимости от статуса
    emoji = "✅" if status == "success" else "❌"
    
    # Формирование сообщения
    message = f"""{emoji} <b>Новая статья опубликована</b>

📝 <b>Заголовок:</b> {title}

🔗 <b>URL:</b> {url}

⏰ <b>Время:</b> {os.popen('date "+%Y-%m-%d %H:%M:%S"').read().strip()}

🤖 <i>Автоматическая публикация через GitHub Actions</i>"""
    
    # Отправка
    api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    try:
        response = requests.post(api_url, json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        })
        
        if response.status_code == 200:
            print("✅ Уведомление отправлено в Telegram")
            return True
        else:
            print(f"❌ Ошибка отправки: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python notify_telegram.py <title> <url> [status]")
        sys.exit(1)
    
    title = sys.argv[1]
    url = sys.argv[2]
    status = sys.argv[3] if len(sys.argv) > 3 else "success"
    
    success = send_telegram_notification(title, url, status)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
