// Главный JS файл

// Мобильное меню
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
}

// AI Chat Widget
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMinimize = document.getElementById('chatMinimize');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBody = document.getElementById('chatBody');
const quickButtons = document.getElementById('quickButtons');

let chatHistory = [];

// Открыть/закрыть чат
if (chatToggle) {
  chatToggle.addEventListener('click', () => {
    chatWindow.classList.add('active');
    chatToggle.style.display = 'none';
  });
}

if (chatClose || chatMinimize) {
  [chatClose, chatMinimize].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        chatToggle.style.display = 'flex';
      });
    }
  });
}

// Быстрые кнопки
if (quickButtons) {
  quickButtons.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-btn')) {
      const message = e.target.dataset.message;
      sendMessage(message);
      quickButtons.style.display = 'none';
    }
  });
}

// Отправка сообщения
if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      sendMessage(message);
      chatInput.value = '';
    }
  });
}

function sendMessage(message) {
  // Добавить сообщение пользователя
  addMessage(message, 'user');
  
  // Показать индикатор печати
  showTyping();
  
  // Имитация ответа (позже заменить на реальный API)
  setTimeout(() => {
    hideTyping();
    const response = getAutoResponse(message);
    addMessage(response, 'bot');
  }, 1500);
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.innerHTML = `
    <div class="message-content">${text}</div>
    <div class="message-time">${new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div>
  `;
  
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  
  chatHistory.push({ text, sender, time: new Date() });
  sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typing';
  typingDiv.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(typingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

function getAutoResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('цен') || lower.includes('стоим')) {
    return 'Стоимость зависит от материала и толщины. Например, резка стали 3мм — от 120₽/пог.м. Для точного расчёта используйте наш калькулятор или отправьте чертёж.';
  }
  
  if (lower.includes('материал')) {
    return 'Мы режем: сталь (до 20мм), нержавейку (до 12мм), алюминий (до 10мм), акрил, фанеру, МДФ. Полный список на странице "Материалы".';
  }
  
  if (lower.includes('срок')) {
    return 'Стандартные заказы — от 1 дня. Срочные — в день обращения (+30% к стоимости). Точные сроки сообщим после анализа чертежа.';
  }
  
  if (lower.includes('заказ') || lower.includes('оформ')) {
    return 'Отправьте чертёж через форму на сайте или на email. Мы рассчитаем стоимость в течение 1 часа и вышлем коммерческое предложение.';
  }
  
  if (lower.includes('dxf') || lower.includes('dwg') || lower.includes('формат')) {
    return 'Принимаем: DXF, DWG, CDR, AI, SVG, PDF. Требования: векторные замкнутые контуры, толщина линий 0.01мм (hairline).';
  }
  
  if (lower.includes('позвон') || lower.includes('менедж') || lower.includes('человек')) {
    return 'Оставьте ваш телефон в форме на сайте, и наш менеджер перезвонит в течение 1 часа (пн-пт 8:00-18:00). Или звоните: +7 (XXX) XXX-XX-XX';
  }
  
  return 'Спасибо за вопрос! Для детальной консультации позвоните нам: +7 (XXX) XXX-XX-XX или оставьте заявку на сайте.';
}

// Восстановить историю чата
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('chatHistory');
  if (saved) {
    chatHistory = JSON.parse(saved);
    chatHistory.forEach(msg => {
      addMessage(msg.text, msg.sender);
    });
  }
});

// Автооткрытие чата через 30 секунд (один раз)
if (!sessionStorage.getItem('chatOpened')) {
  setTimeout(() => {
    if (chatWindow && !chatWindow.classList.contains('active')) {
      chatWindow.classList.add('active');
      chatToggle.style.display = 'none';
      sessionStorage.setItem('chatOpened', 'true');
    }
  }, 30000);
}

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Анимация счётчиков при появлении в viewport
const observerOptions = {
  threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.stat-value').forEach(stat => {
  observer.observe(stat);
});

function animateCounter(element) {
  const text = element.textContent;
  const number = parseInt(text.replace(/\D/g, ''));
  
  if (isNaN(number)) return;
  
  const duration = 2000;
  const steps = 60;
  const increment = number / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= number) {
      element.textContent = text;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + text.replace(/\d+/g, '').trim();
    }
  }, duration / steps);
}

// Обработка формы
const contactForm = document.querySelector('.form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в течение 1 часа.');
        contactForm.reset();
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      alert('Произошла ошибка. Пожалуйста, позвоните нам: +7 (XXX) XXX-XX-XX');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}
