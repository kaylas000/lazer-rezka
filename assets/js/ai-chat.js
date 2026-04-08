// AI Chat - прямая интеграция с Groq API
// Ключ загружается из отдельного файла api-key.js

const USE_DIRECT_API = true; // true = прямой вызов, false = через Cloudflare Worker
const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL';

class AIChat {
  constructor() {
    this.chatToggle = document.getElementById('chatToggle');
    this.chatWindow = document.getElementById('chatWindow');
    this.chatClose = document.getElementById('chatClose');
    this.chatMinimize = document.getElementById('chatMinimize');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    this.chatBody = document.getElementById('chatBody');
    this.quickButtons = document.getElementById('quickButtons');
    
    this.history = [];
    this.isProcessing = false;
    
    this.init();
  }
  
  init() {
    // Восстановить историю из sessionStorage
    const saved = sessionStorage.getItem('chatHistory');
    if (saved) {
      this.history = JSON.parse(saved);
      this.renderHistory();
    }
    
    // События
    this.chatToggle?.addEventListener('click', () => this.open());
    this.chatClose?.addEventListener('click', () => this.close());
    this.chatMinimize?.addEventListener('click', () => this.close());
    this.chatForm?.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Быстрые кнопки
    this.quickButtons?.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-btn')) {
        const message = e.target.dataset.message;
        this.sendMessage(message);
        this.quickButtons.style.display = 'none';
      }
    });
    
    // Автооткрытие через 30 секунд (один раз)
    if (!sessionStorage.getItem('chatOpened')) {
      setTimeout(() => {
        if (!this.chatWindow.classList.contains('active')) {
          this.open();
          sessionStorage.setItem('chatOpened', 'true');
        }
      }, 30000);
    }
    
    // Автооткрытие на странице калькулятора
    if (window.location.pathname.includes('/calculator/')) {
      setTimeout(() => this.open(), 2000);
    }
  }
  
  open() {
    this.chatWindow.classList.add('active');
    this.chatToggle.style.display = 'none';
    this.chatInput?.focus();
  }
  
  close() {
    this.chatWindow.classList.remove('active');
    this.chatToggle.style.display = 'flex';
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const message = this.chatInput.value.trim();
    if (!message || this.isProcessing) return;
    
    this.sendMessage(message);
    this.chatInput.value = '';
  }
  
  async sendMessage(message) {
    if (this.isProcessing) return;
    
    // Добавить сообщение пользователя
    this.addMessage(message, 'user');
    this.history.push({ role: 'user', content: message });
    
    // Показать индикатор печати
    this.showTyping();
    this.isProcessing = true;
    
    try {
      let response;
      
      if (USE_DIRECT_API) {
        // Проверка наличия ключа
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.GROQ_API_KEY || API_CONFIG.GROQ_API_KEY === 'ВСТАВЬТЕ_ВАШ_КЛЮЧ_СЮДА') {
          throw new Error('API ключ не настроен. Создайте файл assets/js/api-key.js из шаблона api-key.template.js');
        }
        
        // Прямой вызов Groq API
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              ...this.history.slice(-10),
              { role: 'user', content: message }
            ],
            max_tokens: 600,
            temperature: 0.7
          })
        });
      } else {
        // Через Cloudflare Worker
        response = await fetch(WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            history: this.history.slice(-10)
          })
        });
      }
      
      this.hideTyping();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        
        if (response.status === 429) {
          throw new Error('Слишком много запросов. Пожалуйста, позвоните нам: +7 (985) 456-37-64');
        }
        if (response.status === 401) {
          throw new Error('Неверный API ключ. Позвоните нам: +7 (985) 456-37-64');
        }
        throw new Error('Ошибка связи с сервером. Позвоните: +7 (985) 456-37-64');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Произошла ошибка');
      }
      
      // Получить ответ (разные форматы для прямого API и Worker)
      const reply = USE_DIRECT_API ? data.choices[0].message.content : data.reply;
      
      // Добавить ответ бота
      this.addMessage(reply, 'assistant');
      this.history.push({ role: 'assistant', content: reply });
      
      // Сохранить историю
      this.saveHistory();
      
    } catch (error) {
      this.hideTyping();
      console.error('Chat error:', error);
      
      // Показать сообщение об ошибке
      let errorMessage = error.message;
      
      // CORS ошибка
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        errorMessage = 'Извините, сейчас я временно недоступен. Позвоните нам: +7 (985) 456-37-64 или напишите на info@lasercut.ru';
      }
      
      if (!errorMessage) {
        errorMessage = 'Сейчас я временно недоступен. Позвоните нам: +7 (985) 456-37-64';
      }
      
      this.addMessage(errorMessage, 'assistant', true);
    } finally {
      this.isProcessing = false;
    }
  }
  
  addMessage(text, role, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    if (isError) messageDiv.classList.add('error');
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    this.chatBody.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    this.chatBody.appendChild(typingDiv);
    this.scrollToBottom();
  }
  
  hideTyping() {
    const typing = document.getElementById('typing');
    typing?.remove();
  }
  
  scrollToBottom() {
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }
  
  renderHistory() {
    this.history.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        this.addMessage(msg.content, msg.role);
      }
    });
  }
  
  saveHistory() {
    // Ограничить историю 50 сообщениями
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    sessionStorage.setItem('chatHistory', JSON.stringify(this.history));
  }
  
  getSystemPrompt() {
    return `Ты — AI-консультант цеха лазерной резки.
Работаешь в режиме онлайн-чата на сайте компании.

ТВОЯ РОЛЬ И ЗАДАЧИ:
1. Консультировать клиентов по услугам цеха
2. Помогать выбрать материал и параметры резки
3. Давать ориентировочные ценовые диапазоны
4. Объяснять процесс оформления заказа
5. Принимать заявки на обратный звонок
6. Отвечать на технические вопросы

УСЛУГИ ЦЕХА:
• Лазерная резка металла
  - Сталь Ст3, 09Г2С: до 20 мм
  - Нержавейка AISI 304, 316: до 12 мм
  - Алюминий АД31, АМГ: до 10 мм
  - Медь, латунь: до 6 мм
  - Точность: ±0.01 мм

• Гибка металла
  - Листовой металл до 4 мм
  - Угол от 0° до 135°
  - Длина до 3000 мм

• Порошковая покраска
  - Любые цвета по палитре RAL
  - Защита от коррозии
  - Толщина покрытия 40-100 микрон

• Пескоструйная обработка
  - Очистка и шлифовка поверхности
  - Подготовка к покраске
  - Удаление ржавчины и окалины

• Сварочные работы
  - Аргонно-дуговая сварка (TIG, MIG/MAG)
  - Сталь и нержавейка
  - Толщина от 0.5 до 12 мм

ЦЕНЫ (ориентировочно):
• Сталь 1 мм: от 80 руб/пог.метр
• Сталь 3 мм: от 120 руб/пог.метр
• Сталь 5 мм: от 180 руб/пог.метр
• Нержавейка: +30-50% к цене стали
• Алюминий: +20-30% к цене стали
• Минимальный заказ: 1500 руб.
• Серия 50+ деталей: скидка 15%
• Срочный заказ: +30%

ФОРМАТЫ ФАЙЛОВ:
Принимаем: DXF, DWG, CDR, AI, SVG, PDF
Требования: векторные замкнутые контуры, толщина линий 0.01 мм (hairline)

КОНТАКТЫ:
Телефон: +7 (985) 456-37-64
Email: info@lasercut.ru
Режим работы: Пн-Пт 8:00-18:00
Адрес: Нахабино ул. Новая 7, Московская область

ПРАВИЛА ОБЩЕНИЯ:
✓ Отвечай ТОЛЬКО на русском языке
✓ Будь конкретным и профессиональным
✓ Длина ответа: 2-4 предложения (кратко)
✓ Используй числа и конкретные данные
✓ При сложных расчётах — предлагай позвонить
✓ Если не уверен — говори об этом честно

✗ Не придумывай точные цены — давай диапазоны
✗ Не обсуждай конкурентов
✗ Не выходи за рамки тематики лазерной резки
✗ Не давай юридических или медицинских советов
✗ Не обещай того, что не знаешь наверняка

СЦЕНАРИИ ПЕРЕДАЧИ МЕНЕДЖЕРУ:
Если клиент просит позвонить, соединить с человеком, обсудить крупный заказ — скажи:
"Оставьте ваш телефон через форму на сайте, и наш менеджер перезвонит в течение 1 рабочего часа (пн-пт 8:00-18:00)"`;
  }
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
  });
} else {
  new AIChat();
}
