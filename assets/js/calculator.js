// Калькулятор стоимости лазерной резки
// Цены и минимальный заказ - из window.__PRICES_DATA__ / window.__MIN_ORDER__ (Jekyll + _data/prices.yml)

function thicknessMapFromYaml(node) {
  const out = {};
  if (!node || !node.thickness_mm) return out;
  for (const [k, v] of Object.entries(node.thickness_mm)) {
    out[parseInt(k, 10)] = Number(v);
  }
  return out;
}

const raw = window.__PRICES_DATA__ && window.__PRICES_DATA__.laser ? window.__PRICES_DATA__.laser : null;
const prices = raw
  ? {
      steel: thicknessMapFromYaml(raw.steel),
      stainless: thicknessMapFromYaml(raw.stainless),
      aluminum: thicknessMapFromYaml(raw.aluminum),
    }
  : {};

const MIN_ORDER =
  typeof window.__MIN_ORDER__ === 'number' && !Number.isNaN(window.__MIN_ORDER__)
    ? window.__MIN_ORDER__
    : 1500;

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
  const priceList = prices[material];
  if (!priceList || Object.keys(priceList).length === 0) return;

  const availableThicknesses = Object.keys(priceList).map(Number);
  const maxThickness = Math.max(...availableThicknesses);
  const minThickness = Math.min(...availableThicknesses);

  thicknessSlider.max = maxThickness;
  thicknessSlider.min = minThickness;
  thicknessSlider.value = minThickness;
  thicknessValue.textContent = minThickness;

  const rangeLabels = document.querySelector('.range-labels');
  rangeLabels.innerHTML = `<span>${minThickness} мм</span><span>${maxThickness} мм</span>`;
});

// Функция расчёта
calculateBtn.addEventListener('click', () => {
  const material = materialSelect.value;
  const thickness = parseInt(thicknessSlider.value, 10);
  const length = parseFloat(lengthInput.value);
  const quantity = parseInt(quantityInput.value, 10);
  const orderType = document.querySelector('input[name="orderType"]:checked').value;

  const bending = document.getElementById('bending')?.checked || false;
  const painting = document.getElementById('painting')?.checked || false;
  const sandblasting = document.getElementById('sandblasting')?.checked || false;

  if (!length || length <= 0) {
    showError('Укажите длину реза');
    return;
  }

  if (!quantity || quantity <= 0) {
    showError('Укажите количество деталей');
    return;
  }

  let pricePerMeter = getPriceForThickness(material, thickness);
  let totalPrice = pricePerMeter * length * quantity;

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

  if (totalPrice < MIN_ORDER) {
    totalPrice = MIN_ORDER;
  }

  showResult({
    material: materialSelect.options[materialSelect.selectedIndex].text,
    thickness,
    length,
    quantity,
    pricePerMeter,
    coefficient,
    coefficientText,
    additionalServices,
    totalPrice: Math.round(totalPrice),
  });
});

function getPriceForThickness(material, thickness) {
  const priceList = prices[material];
  if (!priceList || Object.keys(priceList).length === 0) {
    return 0;
  }

  if (priceList[thickness]) {
    return priceList[thickness];
  }

  const thicknesses = Object.keys(priceList)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < thicknesses.length - 1; i++) {
    if (thickness > thicknesses[i] && thickness < thicknesses[i + 1]) {
      const t1 = thicknesses[i];
      const t2 = thicknesses[i + 1];
      const p1 = priceList[t1];
      const p2 = priceList[t2];
      return p1 + ((p2 - p1) * (thickness - t1)) / (t2 - t1);
    }
  }

  return priceList[thicknesses[thicknesses.length - 1]];
}

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

function showError(message) {
  const html = `
    <div class="result-error">
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;

  resultDiv.innerHTML = html;
}

function openOrderForm() {
  const material = materialSelect.options[materialSelect.selectedIndex].text;
  const thickness = thicknessSlider.value;
  const length = lengthInput.value;
  const quantity = quantityInput.value;

  const params = new URLSearchParams({
    material,
    thickness,
    length,
    quantity,
  });

  window.location.href = `/contacts/?${params.toString()}`;
}

document.addEventListener('DOMContentLoaded', () => {
  materialSelect.dispatchEvent(new Event('change'));
});
