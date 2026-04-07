// Cloudflare Worker для AI-консультанта
// Проксирует запросы к OpenAI API с rate limiting и безопасностью

const SYSTEM_PROMPT = `Ты — AI-консультант цеха лазерной резки.
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
  - Точность: ±0.1 мм

• Лазерная резка неметаллов
  - Акрил: до 20 мм
  - Фанера, МДФ: до 18 мм
  - Точность: ±0.2-0.3 мм

• Гравировка
  - Металл, стекло, дерево

• Гибка металла
  - Листовой металл до 4 мм

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
Телефон: +7 (XXX) XXX-XX-XX
Email: info@lasercut.ru
Режим работы: Пн-Пт 8:00-18:00
Адрес: Москва, ул. Примерная, д.1

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

// Rate limiting: хранение в KV
const RATE_LIMIT = 20; // запросов
const RATE_WINDOW = 3600; // 1 час в секундах

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // В продакшене заменить на домен сайта
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      // Get client IP for rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      // Check rate limit
      if (env.RATE_LIMIT_KV) {
        const rateLimitKey = `ratelimit:${clientIP}`;
        const currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
        
        if (currentCount && parseInt(currentCount) >= RATE_LIMIT) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Слишком много запросов. Пожалуйста, позвоните нам: +7 (XXX) XXX-XX-XX'
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Parse request
      const { message, history = [] } = await request.json();

      if (!message || message.length > 500) {
        return new Response(JSON.stringify({
          error: 'Invalid message',
          message: 'Сообщение должно быть от 1 до 500 символов'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Build messages array
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-10), // Последние 10 сообщений
        { role: 'user', content: message }
      ];

      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 600,
          temperature: 0.7,
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        })
      });

      if (!openaiResponse.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await openaiResponse.json();
      const reply = data.choices[0].message.content;

      // Update rate limit counter
      if (env.RATE_LIMIT_KV) {
        const rateLimitKey = `ratelimit:${clientIP}`;
        const currentCount = await env.RATE_LIMIT_KV.get(rateLimitKey);
        const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
        await env.RATE_LIMIT_KV.put(rateLimitKey, newCount.toString(), {
          expirationTtl: RATE_WINDOW
        });
      }

      return new Response(JSON.stringify({
        reply: reply,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal error',
        message: 'Сейчас я временно недоступен. Позвоните нам: +7 (XXX) XXX-XX-XX'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
