// Главный JS файл

// Мобильное меню
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });
  
  // Закрыть меню при клике на ссылку
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });
  
  // Закрыть меню при клике вне его
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    }
  });
}

// Chat widget is handled entirely by ai-chat.js — no duplicate handlers here.

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

// Обработка всех форм на странице
document.querySelectorAll('form.form').forEach(function(form) {
  // Disable form if Web3Forms key is not configured
  var keyInput = form.querySelector('input[name="access_key"]');
  if (keyInput) {
    var key = keyInput.value.trim();
    if (!key || key.indexOf('YOUR_') === 0) {
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.title = 'Форма временно недоступна';
        var notice = document.createElement('p');
        notice.style.color = '#c00';
        notice.style.fontSize = '14px';
        notice.style.marginTop = '8px';
        notice.textContent = 'Отправка формы временно недоступна. Позвоните нам: +7 (985) 456-37-64';
        submitBtn.parentNode.insertBefore(notice, submitBtn.nextSibling);
      }
      return; // skip attaching submit handler for unconfigured forms
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var formData = new FormData(form);
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;

    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;

    try {
      var response = await fetch(form.action, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // If form has a redirect field, navigate there
        var redirectInput = form.querySelector('input[name="redirect"]') || form.querySelector('input[name="_next"]');
        if (redirectInput && redirectInput.value) {
          window.location.href = redirectInput.value;
          return;
        }
        alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в течение 1 часа.');
        form.reset();
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      alert('Произошла ошибка. Пожалуйста, позвоните нам: +7 (985) 456-37-64');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});
