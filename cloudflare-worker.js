// Cloudflare Worker для AI-чата
// Обновленная версия с улучшенным промптом

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { message, history, max_tokens: reqMaxTokens, system: reqSystem, mode } = body;

      if (!message) {
        return new Response(JSON.stringify({ error: true, message: 'Message is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Системный промпт (улучшенная версия)
      const systemPrompt = `Ты — опытный консультант цеха лазерной резки с 10-летним стажем.
Общаешься с клиентами в онлайн-чате как живой человек — дружелюбно, профессионально и по делу.

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
• Пиши естественно, как говоришь — без канцелярщины и роботских фраз
• Используй эмодзи изредка (⚡️🔥✨💪👍), но не перебарщивай
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

      // Подготовить сообщения для API
      const useSystem = reqSystem || systemPrompt;
      const messages = [
        { role: 'system', content: useSystem },
        ...(history || []).slice(-10), // Последние 10 сообщений из истории
        { role: 'user', content: message }
      ];

      // Вызов Groq API
      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`, // API ключ из переменных окружения
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          max_tokens: reqMaxTokens || 800,
          temperature: mode === 'generate' ? 0.7 : 0.8
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error('Groq API Error:', apiResponse.status, errorData);
        
        return new Response(JSON.stringify({
          error: true,
          message: 'Извините, сейчас я временно недоступен. Позвоните: +7 (985) 456-37-64'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await apiResponse.json();
      const reply = data.choices[0].message.content;

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: true,
        message: 'Произошла ошибка. Позвоните нам: +7 (985) 456-37-64'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
