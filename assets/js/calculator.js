// Калькулятор стоимости лазерной резки

// Прайс-лист (цена за погонный метр в рублях)
const prices = {
  steel: {
    1: 80, 2: 90, 3: 100, 4: 110, 5: 120, 6: 130, 8: 150, 10: 180, 12: 220, 15: 280, 20: 350
  },
  stainless: {
    1: 120, 2: 140, 3: 160, 4: 180, 5: 200, 6: 220, 8: 260, 10: 320, 12: 400
  },
  aluminum: {
    1: 100, 2: 110, 3: 120, 4: 130, 5: 140, 6: 150, 8: 180, 10: 220
  }
};

// Минимальная стоимость заказа
const MIN_ORDER = 1500;

// Элементы
const materialSelect = document.getElementById('material');
const thicknessSlider = document.getElementById('thickness');
const thicknessValue = document.getElementById('thicknessValue');
const lengthInput = document.getElementById('length');
const quantityInput = document.getElementById('quantity');
const calculateBtn = document.getElementById('calculateBtn');
const resultDiv = document.getElementById('result');

// Обновление значения толщины
thicknessSlider.addEventListener('input', () => {
  thicknessValue.textContent = thicknessSlider.value;
});

// Обновление диапазона толщины при смене материала
materialSelect.addEventListener('change', () => {
  const material = materialSelect.value;
  const availableThicknesses = Object.keys(prices[material]).map(Number);
  const maxThickness = Math.max(...availableThicknesses);
  const minThickness = Math.min(...availableThicknesses);
  
  thicknessSlider.max = maxThickness;
  thicknessSlider.min = minThickness;
  thicknessSlider.value = minThickness;
  thicknessValue.textContent = minThickness;
  
  // Обновляем подписи
  const rangeLabels = document.querySelector('.range-labels');
  rangeLabels.innerHTML = `<span>${minThickness} мм</span><span>${maxThickness} мм</span>`;
});

// Функция расчёта
calculateBtn.addEventListener('click', () => {
  const material = materialSelect.value;
  const thickness = parseInt(thicknessSlider.value);
  const length = parseFloat(lengthInput.value);
  const quantity = parseInt(quantityInput.value);
  const orderType = document.querySelector('input[name="orderType"]:checked').value;
  
  // Дополнительные услуги
  const bending = document.getElementById('bending')?.checked || false;
  const painting = document.getElementById('painting')?.checked || false;
  const sandblasting = document.getElementById('sandblasting')?.checked || false;
  
  // Валидация
  if (!length || length <= 0) {
    showError('Укажите длину реза');
    return;
  }
  
  if (!quantity || quantity <= 0) {
    showError('Укажите количество деталей');
    return;
  }
  
  // Получаем цену за погонный метр
  let pricePerMeter = getPriceForThickness(material, thickness);
  
  // Базовая стоимость
  let totalPrice = pricePerMeter * length * quantity;
  
  // Коэффициенты
  let coefficient = 1;
  let coefficientText = '';
  const additionalServices = [];
  
  if (orderType === 'urgent') {
    coefficient = 1.3;
    coefficientText = 'Срочный заказ: +30%';
  } else if (orderType === 'series') {
    coefficient = 0.85;
    coefficientText = 'Серийный заказ: -15%';
  }
  
  totalPrice = totalPrice * coefficient;
  
  // Дополнительные услуги
  if (bending) {
    totalPrice *= 1.2;
    additionalServices.push('Гибка металла: +20%');
  }
  if (painting) {
    totalPrice *= 1.4;
    additionalServices.push('Порошковая покраска: +40%');
  }
  if (sandblasting) {
    totalPrice *= 1.15;
    additionalServices.push('Пескоструйная обработка: +15%');
  }
  
  // Минимальный заказ
  if (totalPrice < MIN_ORDER) {
    totalPrice = MIN_ORDER;
  }
  
  // Показываем результат
  showResult({
    material: materialSelect.options[materialSelect.selectedIndex].text,
    thickness,
    length,
    quantity,
    pricePerMeter,
    coefficient,
    coefficientText,
    additionalServices,
    totalPrice: Math.round(totalPrice)
  });
});

// Получение цены с интерполяцией
function getPriceForThickness(material, thickness) {
  const priceList = prices[material];
  
  // Если точное значение есть
  if (priceList[thickness]) {
    return priceList[thickness];
  }
  
  // Интерполяция между ближайшими значениями
  const thicknesses = Object.keys(priceList).map(Number).sort((a, b) => a - b);
  
  for (let i = 0; i < thicknesses.length - 1; i++) {
    if (thickness > thicknesses[i] && thickness < thicknesses[i + 1]) {
      const t1 = thicknesses[i];
      const t2 = thicknesses[i + 1];
      const p1 = priceList[t1];
      const p2 = priceList[t2];
      
      // Линейная интерполяция
      return p1 + (p2 - p1) * (thickness - t1) / (t2 - t1);
    }
  }
  
  // Если толщина больше максимальной
  return priceList[thicknesses[thicknesses.length - 1]];
}

// Показать результат
function showResult(data) {
  const html = `
    <div class="result-content">
      <div class="result-header">
        <h3>Расчёт стоимости</h3>
      </div>
      
      <div class="result-details">
        <div class="result-row">
          <span>Материал:</span>
          <strong>${data.material}</strong>
        </div>
        <div class="result-row">
          <span>Толщина:</span>
          <strong>${data.thickness} мм</strong>
        </div>
        <div class="result-row">
          <span>Длина реза:</span>
          <strong>${data.length} м</strong>
        </div>
        <div class="result-row">
          <span>Количество:</span>
          <strong>${data.quantity} шт</strong>
        </div>
        <div class="result-row">
          <span>Цена за п.м.:</span>
          <strong>${Math.round(data.pricePerMeter)} ₽</strong>
        </div>
        ${data.coefficientText ? `
        <div class="result-row highlight">
          <span>${data.coefficientText}</span>
        </div>
        ` : ''}
        ${data.additionalServices && data.additionalServices.length > 0 ? data.additionalServices.map(service => `
        <div class="result-row highlight">
          <span>${service}</span>
        </div>
        `).join('') : ''}
      </div>
      
      <div class="result-total">
        <span>Итого:</span>
        <strong>${data.totalPrice.toLocaleString('ru-RU')} ₽</strong>
      </div>
      
      <div class="result-actions">
        <button class="btn btn-primary btn-block" onclick="openOrderForm()">Заказать</button>
        <button class="btn btn-secondary btn-block" onclick="window.print()">Распечатать</button>
      </div>
      
      <div class="result-note">
        <small>* Окончательная цена зависит от сложности контура и уточняется после анализа чертежа</small>
      </div>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показать ошибку
function showError(message) {
  const html = `
    <div class="result-error">
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
  
  resultDiv.innerHTML = html;
}

// Открыть форму заказа
function openOrderForm() {
  const material = materialSelect.options[materialSelect.selectedIndex].text;
  const thickness = thicknessSlider.value;
  const length = lengthInput.value;
  const quantity = quantityInput.value;
  
  // Переход на страницу контактов с параметрами
  const params = new URLSearchParams({
    material,
    thickness,
    length,
    quantity
  });
  
  window.location.href = `/contacts/?${params.toString()}`;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Установить начальные значения диапазона
  materialSelect.dispatchEvent(new Event('change'));
});
