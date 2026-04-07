// Калькулятор стоимости лазерной резки

const prices = {
  steel: { 1: 80, 2: 100, 3: 120, 4: 140, 5: 180, 10: 250, 15: 320, 20: 400 },
  stainless: { 1: 120, 2: 150, 3: 180, 4: 210, 5: 260, 10: 380, 12: 450 },
  aluminum: { 1: 100, 2: 130, 3: 160, 4: 190, 5: 230, 8: 320, 10: 400 },
  copper: { 1: 150, 2: 180, 3: 220, 4: 260, 5: 310, 6: 360 },
  brass: { 1: 140, 2: 170, 3: 210, 4: 250, 5: 300, 6: 350 },
  acrylic: { 1: 150, 3: 180, 5: 220, 8: 280, 10: 340, 15: 450, 20: 580 },
  plywood: { 3: 90, 4: 110, 6: 140, 8: 170, 10: 210, 15: 280, 18: 340 }
};

const maxThickness = {
  steel: 20,
  stainless: 12,
  aluminum: 10,
  copper: 6,
  brass: 6,
  acrylic: 20,
  plywood: 18
};

const materialEl = document.getElementById('material');
const thicknessEl = document.getElementById('thickness');
const thicknessValueEl = document.getElementById('thicknessValue');
const lengthEl = document.getElementById('length');
const quantityEl = document.getElementById('quantity');
const calculateBtn = document.getElementById('calculateBtn');
const resultEl = document.getElementById('result');

// Обновление максимальной толщины при смене материала
materialEl.addEventListener('change', () => {
  const material = materialEl.value;
  const max = maxThickness[material];
  thicknessEl.max = max;
  if (parseInt(thicknessEl.value) > max) {
    thicknessEl.value = max;
    thicknessValueEl.textContent = max;
  }
});

// Обновление значения толщины
thicknessEl.addEventListener('input', () => {
  thicknessValueEl.textContent = thicknessEl.value;
});

// Расчёт стоимости
calculateBtn.addEventListener('click', calculate);

function calculate() {
  const material = materialEl.value;
  const thickness = parseInt(thicknessEl.value);
  const length = parseFloat(lengthEl.value);
  const quantity = parseInt(quantityEl.value);
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  
  if (!length || length <= 0 || !quantity || quantity <= 0) {
    showError('Пожалуйста, заполните все поля корректно');
    return;
  }
  
  // Получаем базовую цену (интерполяция между ближайшими значениями)
  const basePrice = getPrice(material, thickness);
  
  // Расчёт базовой стоимости
  let cost = basePrice * length * quantity;
  
  // Применяем модификаторы
  if (orderType === 'urgent') {
    cost *= 1.30;
  } else if (orderType === 'series' && quantity >= 50) {
    cost *= 0.85;
  }
  
  // Минимальный заказ
  const minOrder = 1500;
  const finalCost = Math.max(cost, minOrder);
  
  showResult(finalCost, basePrice, length, quantity, orderType);
}

function getPrice(material, thickness) {
  const priceTable = prices[material];
  const thicknesses = Object.keys(priceTable).map(Number).sort((a, b) => a - b);
  
  // Точное совпадение
  if (priceTable[thickness]) {
    return priceTable[thickness];
  }
  
  // Интерполяция
  let lower = thicknesses[0];
  let upper = thicknesses[thicknesses.length - 1];
  
  for (let i = 0; i < thicknesses.length - 1; i++) {
    if (thickness > thicknesses[i] && thickness < thicknesses[i + 1]) {
      lower = thicknesses[i];
      upper = thicknesses[i + 1];
      break;
    }
  }
  
  const lowerPrice = priceTable[lower];
  const upperPrice = priceTable[upper];
  const ratio = (thickness - lower) / (upper - lower);
  
  return Math.round(lowerPrice + (upperPrice - lowerPrice) * ratio);
}

function showResult(cost, basePrice, length, quantity, orderType) {
  const orderTypeText = {
    standard: 'Стандартный (1-3 дня)',
    urgent: 'Срочный (+30%)',
    series: 'Серийный 50+ (-15%)'
  };
  
  resultEl.innerHTML = `
    <div class="result-content">
      <div class="result-header">
        <h3>Результат расчёта</h3>
      </div>
      
      <div class="result-breakdown">
        <div class="breakdown-item">
          <span>Базовая цена резки:</span>
          <strong>${basePrice} ₽/пог.м</strong>
        </div>
        <div class="breakdown-item">
          <span>Длина реза:</span>
          <strong>${length} м</strong>
        </div>
        <div class="breakdown-item">
          <span>Количество деталей:</span>
          <strong>${quantity} шт</strong>
        </div>
        <div class="breakdown-item">
          <span>Тип заказа:</span>
          <strong>${orderTypeText[orderType]}</strong>
        </div>
      </div>
      
      <div class="result-total">
        <span>Ориентировочная стоимость:</span>
        <div class="total-price">${Math.round(cost).toLocaleString('ru-RU')} ₽</div>
      </div>
      
      <div class="result-note">
        <p>Это предварительный расчёт. Точная стоимость определяется после анализа чертежа.</p>
      </div>
      
      <a href="/contacts/" class="btn btn-primary btn-block">Получить точный расчёт</a>
    </div>
  `;
  
  resultEl.classList.add('show');
}

function showError(message) {
  resultEl.innerHTML = `
    <div class="result-error">
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
  resultEl.classList.add('show');
}
