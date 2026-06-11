// Hero video: skip on slow connection, otherwise just play
(function() {
  var video = document.querySelector('.hero-video');
  if (!video) return;

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.saveData)) {
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach(function(s) { s.removeAttribute('src'); });
    video.load();
    return;
  }

  video.addEventListener('error', function() { video.style.display = 'none'; });

  var playPromise = video.play();
  if (playPromise !== undefined) { playPromise.catch(function() {}); }
})();

// Mobile menu
var navToggle = document.querySelector('.nav-toggle');
var navMenu = document.querySelector('.nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
  });
  navMenu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', function(e) {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ===== SCROLL-PROGRESS BAR =====
(function scrollProgress() {
  var bar = document.getElementById('scrollProgress');
  if (!bar) { bar = document.createElement('div'); bar.id = 'scrollProgress'; document.body.prepend(bar); }
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = Math.min(progress, 100) + '%';
  }, { passive: true });
})();

// ===== SCROLL-REVEAL (stagger 50ms) =====
(function scrollReveal() {
  var revealEls = document.querySelectorAll('.service-card, .advantage, .step, .review-card, .delivery-card, .spec-card');
  if (!revealEls.length) return;

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  var delay = 0;
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        delay += 50;
        entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function(el) {
    if (!isInViewport(el)) {
      el.classList.add('reveal-hidden');
    }
    revealObserver.observe(el);
  });
})();

// ===== COUNT-UP ANIMATION =====
(function countUp() {
  var statValues = document.querySelectorAll('.stat-value[data-count]');
  if (!statValues.length) return;

  var countObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  function animateCountUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var duration = 1800;
    var start = performance.now();

    function update(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) { requestAnimationFrame(update); }
      else { el.textContent = prefix + target + suffix; }
    }
    requestAnimationFrame(update);
  }

  statValues.forEach(function(el) { countObserver.observe(el); });
})();

// ===== FORM SUBMIT WITH SPINNER =====
document.querySelectorAll('form.form').forEach(function(form) {
  var keyInput = form.querySelector('input[name="access_key"]');
  if (keyInput) {
    var key = keyInput.value.trim();
    if (!key || key.indexOf('YOUR_') === 0) {
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.title = 'Форма временно недоступна';
        var notice = document.createElement('p');
        notice.style.cssText = 'color:#EF4444;font-size:14px;margin-top:8px;';
        notice.textContent = 'Отправка временно недоступна. Позвоните: +7 (985) 456-37-64';
        submitBtn.parentNode.insertBefore(notice, submitBtn.nextSibling);
      }
      return;
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var formData = new FormData(form);
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalHTML = submitBtn.innerHTML;

    submitBtn.innerHTML = '<span>Отправляется</span>';
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    try {
      var response = await fetch(form.action, { method: 'POST', body: formData });
      if (response.ok) {
        var redirectInput = form.querySelector('input[name="redirect"]') || form.querySelector('input[name="_next"]');
        if (redirectInput && redirectInput.value) {
          window.location.href = redirectInput.value;
          return;
        }
        var successEl = document.createElement('div');
        successEl.className = 'form-success';
        successEl.innerHTML = '<strong>Спасибо!</strong> Заявка отправлена. Свяжемся в течение 1 часа.';
        form.parentNode.insertBefore(successEl, form.nextSibling);
        form.reset();
        setTimeout(function() { successEl.remove(); }, 8000);
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      alert('Ошибка. Позвоните: +7 (985) 456-37-64');
    } finally {
      submitBtn.innerHTML = originalHTML;
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }
  });
});

// ===== SUCCESS MESSAGE =====
(function showFormSuccessMessage() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('success') !== 'true') return;
  var el = document.getElementById('success-message');
  if (!el) return;
  var path = window.location.pathname;
  var inner = path.includes('contacts')
    ? '<strong>Спасибо!</strong> Ваша заявка отправлена. Мы свяжемся с вами в течение 1 часа.'
    : (path.includes('reviews') ? '<strong>Спасибо за отзыв!</strong> Мы получили ваше сообщение и опубликуем его после модерации.' : null);
  if (!inner) return;
  el.innerHTML = inner;
  el.style.cssText = 'display:block;padding:16px;background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;margin-bottom:24px;color:#155724;';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  var url = new URL(window.location.href);
  url.searchParams.delete('success');
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
})();

// ===== HEADER SCROLL EFFECT =====
(function headerScrollEffect() {
  var header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) { header.classList.add('scrolled'); }
    else { header.classList.remove('scrolled'); }
  }, { passive: true });
})();

// ===== ACTIVE PAGE IN NAV =====
(function activeNav() {
  var path = window.location.pathname;
  var links = document.querySelectorAll('.nav-menu a');
  links.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === '/' && path === '/') { link.classList.add('active'); }
    else if (href !== '/' && path.indexOf(href) === 0) { link.classList.add('active'); }
  });
})();

// ===== FAQ ACCORDION =====
(function faqDelegation() {
  var faqSection = document.querySelector('.faq-section');
  if (!faqSection) return;
  faqSection.addEventListener('click', function(e) {
    var btn = e.target.closest('.faq-question');
    if (!btn) return;
    var item = btn.parentElement;
    if (!item || !item.classList.contains('faq-item')) return;
    var isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('active'); });
    if (!isActive) item.classList.add('active');
  });
})();

// ===== PHONE MASK =====
(function phoneMask() {
  var telInputs = document.querySelectorAll('input[type="tel"]');
  telInputs.forEach(function(input) {
    input.addEventListener('input', function() {
      var val = input.value.replace(/\D/g, '');
      if (val.length === 0) { input.value = ''; return; }
      if (val[0] === '8') val = '7' + val.substring(1);
      if (val[0] !== '7') val = '7' + val;
      val = val.substring(0, 11);
      var formatted = '+7';
      if (val.length > 1) formatted += ' (' + val.substring(1, 4);
      if (val.length > 4) formatted += ') ' + val.substring(4, 7);
      if (val.length > 7) formatted += '-' + val.substring(7, 9);
      if (val.length > 9) formatted += '-' + val.substring(9, 11);
      input.value = formatted;
    });
    input.addEventListener('focus', function() { if (!input.value) input.value = '+7 ('; });
  });
})();

// ===== FORM AUTOSAVE =====
(function formAutosave() {
  var forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    var formId = form.id || form.getAttribute('action') || 'form';
    var saved = sessionStorage.getItem('form_' + formId);
    if (saved) {
      try {
        var data = JSON.parse(saved);
        Object.keys(data).forEach(function(name) {
          var field = form.querySelector('[name="' + name + '"]');
          if (field && field.type !== 'file') field.value = data[name];
        });
      } catch(e) {}
    }
    form.addEventListener('change', function() {
      var fd = new FormData(form);
      var obj = {};
      fd.forEach(function(v, k) { if (k !== 'attachment') obj[k] = v; });
      sessionStorage.setItem('form_' + formId, JSON.stringify(obj));
    });
    form.addEventListener('input', function() {
      var fd = new FormData(form);
      var obj = {};
      fd.forEach(function(v, k) { if (k !== 'attachment') obj[k] = v; });
      sessionStorage.setItem('form_' + formId, JSON.stringify(obj));
    });
  });
})();
