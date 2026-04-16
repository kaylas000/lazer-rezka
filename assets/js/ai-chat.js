// AI Chat - прямая интеграция с Groq API
// Ключ загружается из отдельного файла api-key.js

const USE_DIRECT_API = false; // true = прямой вызов, false = через Cloudflare Worker
const WORKER_URL = window.SITE_AI_WORKER_URL || '';

// ВНИМАНИЕ: Системный промпт работает только при USE_DIRECT_API = true
// Если используете Worker (false), обновите промпт в коде Worker на Cloudflare

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
    // If Worker URL is not configured and not using direct API, hide the widget
    if (!USE_DIRECT_API && !WORKER_URL) {
      const widget = document.getElementById('aiChat');
      if (widget) widget.style.display = 'none';
      return;
    }

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
    
    // Категории
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.showCategoryQuestions(category);
      });
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
    
    // Автооткрытие на странице калькулятора отключено, чтобы не мешать заполнению формы
    // if (window.location.pathname.includes('/calculator/')) {
    //   setTimeout(() => this.open(), 2000);
    // }
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
        // Прямой вызов Groq API
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer GROQ_API_KEY_PLACEHOLDER',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              ...this.history.slice(-10),
              { role: 'user', content: message }
            ],
            max_tokens: 800,
            temperature: 0.8
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
  
  showCategoryQuestions(category) {
    const questions = {
      prices: [
        'Сколько стоит резка стали 3 мм?',
        'Какая минимальная стоимость заказа?',
        'Есть ли скидки на большой объём?',
        'Сколько стоит срочный заказ?'
      ],
      materials: [
        'Какие металлы вы режете?',
        'Режете ли вы нержавейку?',
        'Какую максимальную толщину можете резать?',
        'Какие металлы вы режете?'
      ],
      technical: [
        'Какая точность резки?',
        'Какие форматы файлов принимаете?',
        'Как подготовить чертёж для резки?',
        'Какой размер листа можете обработать?'
      ],
      order: [
        'Как оформить заказ?',
        'Каковы сроки изготовления?',
        'Есть ли доставка?',
        'Нужна ли предоплата?'
      ]
    };
    
    const categoryQuestions = questions[category];
    if (!categoryQuestions) return;
    
    const categoriesDiv = document.querySelector('.chat-categories');
    if (categoriesDiv) categoriesDiv.style.display = 'none';
    
    const questionsDiv = document.createElement('div');
    questionsDiv.className = 'quick-buttons category-questions';
    questionsDiv.innerHTML = categoryQuestions.map(q => 
      `<button class="quick-btn" data-message="${q}">${q}</button>`
    ).join('');
    
    const backBtn = document.createElement('button');
    backBtn.className = 'quick-btn back-btn';
    backBtn.textContent = '← Назад к категориям';
    backBtn.onclick = () => {
      questionsDiv.remove();
      if (categoriesDiv) categoriesDiv.style.display = 'block';
    };
    questionsDiv.appendChild(backBtn);
    
    questionsDiv.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-btn') && !e.target.classList.contains('back-btn')) {
        const message = e.target.dataset.message;
        this.sendMessage(message);
        questionsDiv.remove();
      }
    });
    
    this.chatBody.appendChild(questionsDiv);
    this.scrollToBottom();
  }
  
  getSystemPrompt() {
    return `Ты — опытный консультант цеха лазерной резки с 10-летним стажем.
Общаешься с клиентами в онлайн-чате как живой человек — дружелюбно, профессионально и по делу.

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
• Пиши естественно, как говоришь — без канцелярщины и роботских фраз
• Используй эмодзи изредка (⚡️🔥✨💪👍), но не переборщи
• Задавай уточняющие вопросы, если нужно понять задачу клиента
• Делись практическими советами из опыта
• Объясняй сложное простыми словами
• Длина ответа: 3-6 предложений (достаточно для понимания, но не простыня текста)

УСЛУГИ ЦЕХА:

🔥 Лазерная резка металла
  - Сталь Ст3, 09Г2С: до 20 мм
  - Нержавейка AISI 304, 316: до 12 мм
  - Алюминий АД31, АМГ: до 10 мм

  - Точность: ±0.01 мм (толщина человеческого волоса!)

🔧 Гибка металла
  - Листовой металл до 4 мм
  - Угол от 0° до 135°
  - Длина до 3000 мм

🎨 Порошковая покраска
  - Любые цвета по палитре RAL (более 200 оттенков)
  - Защита от коррозии на годы
  - Толщина покрытия 40-100 микрон

⚡️ Пескоструйная обработка
  - Очистка и шлифовка поверхности
  - Подготовка к покраске
  - Удаление ржавчины и окалины

🔨 Сварочные работы
  - Аргонно-дуговая сварка (TIG, MIG/MAG)
  - Сталь и нержавейка
  - Толщина от 0.5 до 12 мм

ЦЕНЫ (ориентировочно):
• Сталь 1 мм: от 80 руб/пог.м
• Сталь 3 мм: от 120 руб/пог.м
• Сталь 5 мм: от 180 руб/пог.м
• Нержавейка: +30-50% к стали
• Алюминий: +20-30% к стали
• Минимальный заказ: 1500 руб
• Серия 50+ деталей: скидка 15%
• Срочный заказ (1-2 дня): +30%

ФОРМАТЫ ФАЙЛОВ:
Принимаем: DXF, DWG, CDR, AI, SVG, PDF
Важно: векторные замкнутые контуры, толщина линий 0.01 мм (hairline)

КОНТАКТЫ:
📞 +7 (985) 456-37-64
📧 info@lasercut.ru
⏰ Пн-Пт 8:00-18:00
📍 Нахабино ул. Новая 7, Московская область

КАК ОТВЕЧАТЬ:

✅ ХОРОШО:
- "Для вашей детали подойдёт сталь 3 мм — она прочная и недорогая. Резка обойдётся примерно в 2500₽."
- "Отличный вопрос! Нержавейку режем до 12 мм, но для уличных конструкций обычно хватает 4-6 мм."
- "Могу прикинуть стоимость, но для точного расчёта лучше скиньте чертёж — учту все нюансы."

❌ ПЛОХО:
- "В соответствии с прайс-листом стоимость составляет..." (слишком официально)
- "Да" (слишком коротко)
- "Мы предоставляем услуги высокого качества..." (вода)

ПРАКТИЧЕСКИЕ СОВЕТЫ:
• Для мебели и декора: сталь 1-2 мм
• Для каркасов и конструкций: сталь 3-5 мм
• Для уличных изделий: нержавейка или сталь с покраской
• Для точных деталей: отправляй DXF с размерами
• Для прототипов: можем сделать 1 штуку

КОГДА ПЕРЕДАВАТЬ МЕНЕДЖЕРУ:
Если клиент просит:
- Позвонить ему
- Обсудить крупный заказ (от 100 000₽)
- Заключить договор
- Получить коммерческое предложение

Скажи: "Оставьте телефон через форму на сайте — наш менеджер перезвонит в течение часа (в рабочее время пн-пт 8:00-18:00) и всё обсудит детально."

ЧТО НЕ ДЕЛАТЬ:
❌ Не придумывай точные цены — давай диапазоны
❌ Не обсуждай конкурентов
❌ Не уходи от темы металлообработки
❌ Не обещай сроки без уточнения загрузки цеха
❌ Не давай юридических консультаций

ПОМНИ: Ты помогаешь клиенту решить его задачу, а не просто отвечаешь на вопросы. Будь полезным!`;
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
