// Калькулятор v2 — полноценный расчёт по каждой услуге
(function() {
  var prices = window.__PRICES_DATA__ || {};
  var MIN_ORDER = window.__MIN_ORDER__ || 1500;
  var summaryItems = [];

  // ===== ТАБЫ =====
  document.querySelectorAll('.calc-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.calc-tab-btn').forEach(function(b) { b.classList.remove('is-active'); });
      document.querySelectorAll('.calc-tab-pane').forEach(function(p) { p.classList.remove('is-active'); });
      btn.classList.add('is-active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('is-active');
    });
  });

  // ===== ЛАЗЕРНАЯ РЕЗКА =====
  var laserMaterial = document.getElementById('laserMaterial');
  var laserThickness = document.getElementById('laserThickness');
  var laserThicknessVal = document.getElementById('laserThicknessVal');
  var laserData = {};

  laserMaterial.addEventListener('change', function() {
    var mat = laserMaterial.value;
    var list = prices.laser[mat]?.thickness_mm || {};
    var keys = Object.keys(list).map(Number).sort(function(a,b){return a-b;});
    if (!keys.length) return;
    laserThickness.min = keys[0];
    laserThickness.max = keys[keys.length-1];
    laserThickness.value = keys[0];
    laserThicknessVal.textContent = keys[0];
    document.querySelector('#tab-laser .range-labels').innerHTML = '<span>' + keys[0] + ' мм</span><span>' + keys[keys.length-1] + ' мм</span>';
  });

  laserThickness.addEventListener('input', function() {
    laserThicknessVal.textContent = laserThickness.value;
  });

  function getLaserPrice(mat, t) {
    var list = prices.laser[mat]?.thickness_mm || {};
    if (list[t]) return list[t];
    var keys = Object.keys(list).map(Number).sort(function(a,b){return a-b;});
    for (var i = 0; i < keys.length-1; i++) {
      if (t > keys[i] && t < keys[i+1]) {
        return list[keys[i]] + (list[keys[i+1]] - list[keys[i]]) * (t - keys[i]) / (keys[i+1] - keys[i]);
      }
    }
    return 0;
  }

  document.getElementById('laserCalcBtn').addEventListener('click', function() {
    var mat = laserMaterial.value;
    var t = parseInt(laserThickness.value);
    var len = parseFloat(document.getElementById('laserLength').value);
    var qty = parseInt(document.getElementById('laserQty').value);
    if (!len || len <= 0 || !qty || qty <= 0) return;
    var ppm = getLaserPrice(mat, t);
    var total = Math.round(ppm * len * qty);
    if (total < MIN_ORDER) total = MIN_ORDER;
    document.getElementById('laserResult').innerHTML = renderResult(laserMaterial.options[laserMaterial.selectedIndex].text, t + ' мм', len, qty, ppm, total);
    laserData = { name: 'Лазерная резка ' + laserMaterial.options[laserMaterial.selectedIndex].text, thickness: t, length: len, qty: qty, pricePerMeter: ppm, total: total };
  });

  document.getElementById('addLaserToSummary').addEventListener('click', function() {
    if (!laserData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(laserData);
    renderSummary();
  });

  // ===== ГИБКА =====
  var bendPrices = {1:80, 2:100, 3:120, 4:160};
  var bendData = {};
  document.getElementById('bendCalcBtn').addEventListener('click', function() {
    var t = parseInt(document.getElementById('bendThickness').value);
    var count = parseInt(document.getElementById('bendCount').value);
    var qty = parseInt(document.getElementById('bendQtyCalc').value);
    if (!count || count <= 0 || !qty || qty <= 0) return;
    var pricePerBend = bendPrices[t] || 120;
    var total = pricePerBend * count * qty;
    document.getElementById('bendResult').innerHTML = renderSimple('Гибка металла', t + ' мм', count + ' гибов', qty, pricePerBend, '₽/гиб', total);
    bendData = { name: 'Гибка металла ' + t + ' мм', count: count, qty: qty, pricePerUnit: pricePerBend, unit: 'гиб', total: total };
  });
  document.getElementById('addBendToSummary').addEventListener('click', function() {
    if (!bendData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(bendData);
    renderSummary();
  });

  // ===== ПОКРАСКА =====
  var paintData = {};
  document.getElementById('paintCalcBtn').addEventListener('click', function() {
    var area = parseFloat(document.getElementById('paintArea').value);
    var colorType = document.getElementById('paintColor').value;
    var qty = parseInt(document.getElementById('paintQty').value);
    if (!area || area <= 0 || !qty || qty <= 0) return;
    var ppm = (colorType === 'special') ? 700 : 550;
    var total = Math.round(ppm * area * qty);
    document.getElementById('paintResult').innerHTML = renderSimple('Порошковая покраска', (colorType === 'special' ? 'Спец. RAL' : 'Стандарт RAL'), area + ' м²', qty, ppm, '₽/м²', total);
    paintData = { name: 'Порошковая покраска ' + (colorType === 'special' ? 'спец.' : 'станд.'), area: area, qty: qty, pricePerUnit: ppm, unit: 'м²', total: total };
  });
  document.getElementById('addPaintToSummary').addEventListener('click', function() {
    if (!paintData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(paintData);
    renderSummary();
  });

  // ===== ПЕСКОСТРУЙ =====
  var sandData = {};
  document.getElementById('sandCalcBtn').addEventListener('click', function() {
    var area = parseFloat(document.getElementById('sandArea').value);
    var qty = parseInt(document.getElementById('sandQty').value);
    if (!area || area <= 0 || !qty || qty <= 0) return;
    var total = Math.round(350 * area * qty);
    document.getElementById('sandResult').innerHTML = renderSimple('Пескоструйная обработка', '', area + ' м²', qty, 350, '₽/м²', total);
    sandData = { name: 'Пескоструйная обработка', area: area, qty: qty, pricePerUnit: 350, unit: 'м²', total: total };
  });
  document.getElementById('addSandToSummary').addEventListener('click', function() {
    if (!sandData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(sandData);
    renderSummary();
  });

  // ===== СВАРКА =====
  var weldPrices = {tig_steel: 25, tig_ss: 35, mig: 18};
  var weldData = {};
  document.getElementById('weldCalcBtn').addEventListener('click', function() {
    var type = document.getElementById('weldType').value;
    var len = parseInt(document.getElementById('weldLength').value);
    var qty = parseInt(document.getElementById('weldQty').value);
    if (!len || len <= 0 || !qty || qty <= 0) return;
    var ppm = weldPrices[type] || 25;
    var total = ppm * len * qty;
    document.getElementById('weldResult').innerHTML = renderSimple('Сварка', document.getElementById('weldType').options[document.getElementById('weldType').selectedIndex].text.split(' — ')[0], len + ' см шва', qty, ppm, '₽/см', total);
    weldData = { name: 'Сварка ' + document.getElementById('weldType').options[document.getElementById('weldType').selectedIndex].text.split(' — ')[0], length: len, qty: qty, pricePerUnit: ppm, unit: 'см', total: total };
  });
  document.getElementById('addWeldToSummary').addEventListener('click', function() {
    if (!weldData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(weldData);
    renderSummary();
  });

  // ===== РЕЗЬБА =====
  var threadPrices = {m3_m6: 50, m8_m12: 80, m14_m24: 140};
  var threadData = {};
  document.getElementById('threadCalcBtn').addEventListener('click', function() {
    var size = document.getElementById('threadSize').value;
    var count = parseInt(document.getElementById('threadCount').value);
    if (!count || count <= 0) return;
    var ppm = threadPrices[size] || 50;
    var total = ppm * count;
    document.getElementById('threadResult').innerHTML = renderSimple('Нарезание резьбы', document.getElementById('threadSize').options[document.getElementById('threadSize').selectedIndex].text.split(' — ')[0], count + ' отв', 1, ppm, '₽/отв', total);
    threadData = { name: 'Резьба ' + document.getElementById('threadSize').options[document.getElementById('threadSize').selectedIndex].text.split(' — ')[0], count: count, pricePerUnit: ppm, unit: 'отв', total: total };
  });
  document.getElementById('addThreadToSummary').addEventListener('click', function() {
    if (!threadData.name) return alert('Сначала нажмите «Рассчитать»');
    summaryItems.push(threadData);
    renderSummary();
  });


  // ===== ИТОГ =====
  function renderSummary() {
    var html = '';
    var grand = 0;
    summaryItems.forEach(function(item, i) {
      grand += item.total;
      html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span>' + item.name + '</span><strong>' + item.total.toLocaleString('ru-RU') + ' ₽</strong></div>';
    });
    document.getElementById('summaryItems').innerHTML = html || '<p style="color:var(--text-muted)">Добавьте услуги из вкладок выше</p>';
    if (grand > 0) {
      document.getElementById('summaryTotal').style.display = 'block';
      document.getElementById('summaryTotal').innerHTML = 'Общая сумма: <span style="color:var(--accent-orange)">' + grand.toLocaleString('ru-RU') + ' ₽</span>';
    }
  }

  document.getElementById('clearSummaryBtn').addEventListener('click', function() {
    summaryItems = [];
    renderSummary();
    document.getElementById('summaryTotal').style.display = 'none';
  });

  // ===== HELPERS =====
  function renderResult(material, thickness, length, qty, ppm, total) {
    return '<div class="result-content"><div class="result-header"><h3>Расчёт стоимости</h3></div><div class="result-details"><div class="result-row"><span>Материал:</span><strong>' + material + '</strong></div><div class="result-row"><span>Толщина:</span><strong>' + thickness + '</strong></div><div class="result-row"><span>Длина реза:</span><strong>' + length + ' м</strong></div><div class="result-row"><span>Количество:</span><strong>' + qty + ' шт</strong></div><div class="result-row"><span>Цена за п.м.:</span><strong>' + Math.round(ppm) + ' ₽</strong></div><div class="result-row" style="border-top:1px solid rgba(255,107,43,0.2);padding-top:8px"><span>Резка:</span><strong>' + total.toLocaleString('ru-RU') + ' ₽</strong></div></div><div class="result-total"><span>Итого:</span><strong>' + total.toLocaleString('ru-RU') + ' ₽</strong></div><div class="result-note"><small>* Точная цена после анализа чертежа</small></div></div>';
  }

  function renderSimple(name, detail, amount, qty, price, unit, total) {
    return '<div class="result-content"><div class="result-header"><h3>Расчёт стоимости</h3></div><div class="result-details"><div class="result-row"><span>Услуга:</span><strong>' + name + '</strong></div><div class="result-row"><span>Параметры:</span><strong>' + (detail || '—') + '</strong></div><div class="result-row"><span>Количество:</span><strong>' + amount + ' × ' + (qty > 1 ? qty + ' дет.' : '') + '</strong></div><div class="result-row"><span>Цена:</span><strong>' + price + ' ' + unit + '</strong></div></div><div class="result-total"><span>Итого:</span><strong>' + total.toLocaleString('ru-RU') + ' ₽</strong></div><div class="result-note"><small>* Точная цена после анализа чертежа</small></div></div>';
  }
})();
