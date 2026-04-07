// AI Chat - интеграция с Cloudflare Worker

const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL'; // Заменить после деплоя Worker

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
      // Отправить запрос к Worker
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: this.history.slice(-10) // Последние 10 сообщений
        })
      });
      
      this.hideTyping();
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Слишком много запросов. Пожалуйста, позвоните нам: +7 (XXX) XXX-XX-XX');
        }
        throw new Error('Ошибка сервера');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Произошла ошибка');
      }
      
      // Добавить ответ бота
      this.addMessage(data.reply, 'assistant');
      this.history.push({ role: 'assistant', content: data.reply });
      
      // Сохранить историю
      this.saveHistory();
      
    } catch (error) {
      this.hideTyping();
      console.error('Chat error:', error);
      
      // Показать сообщение об ошибке
      const errorMessage = error.message || 'Сейчас я временно недоступен. Позвоните нам: +7 (XXX) XXX-XX-XX';
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
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
  });
} else {
  new AIChat();
}
