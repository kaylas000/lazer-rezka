/**
 * Calculator Bridge — price estimation from cut length.
 * Uses existing price data (window.__PRICES_DATA__) injected from _data/prices.yml.
 *
 * API:
 *   estimatePrice(cutLengthMeters, material, thickness, qty)
 *   → { pricePerMeter, totalCutMeters, cutPrice, minOrder, finalPrice, isEstimate }
 */
(function (global) {
  'use strict';

  var MIN_ORDER = 3000;

  /**
   * Get price per meter for given material and thickness (mm).
   * Uses same interpolation logic as calculator-v2.js.
   */
  function getPricePerMeter(material, thicknessMm) {
    var prices = (window.__PRICES_DATA__ && window.__PRICES_DATA__.laser) || {};
    var list = prices[material] && prices[material].thickness_mm;
    if (!list) return 0;

    if (list[thicknessMm]) return list[thicknessMm];

    var keys = Object.keys(list).map(Number).sort(function (a, b) { return a - b; });
    if (thicknessMm < keys[0]) return list[keys[0]];

    for (var i = 0; i < keys.length - 1; i++) {
      if (thicknessMm > keys[i] && thicknessMm < keys[i + 1]) {
        return list[keys[i]] + (list[keys[i + 1]] - list[keys[i]]) *
          (thicknessMm - keys[i]) / (keys[i + 1] - keys[i]);
      }
    }
    return list[keys[keys.length - 1]];
  }

  /**
   * Estimate total price for a batch of parts.
   *
   * @param {number} cutLenM — total cut length per part (meters)
   * @param {string} material — 'steel' | 'stainless' | 'stainless_316' | 'aluminum'
   * @param {number} thickness — mm
   * @param {number} qty — number of parts
   * @returns {object}
   */
  function estimatePrice(cutLenM, material, thickness, qty) {
    qty = qty || 1;
    var ppm = getPricePerMeter(material, thickness);
    var totalCutM = cutLenM * qty;
    var cutPrice = Math.round(ppm * totalCutM);
    var finalPrice = Math.max(cutPrice, MIN_ORDER);

    return {
      pricePerMeter: Math.round(ppm),
      totalCutMeters: Math.round(totalCutM * 1000) / 1000,
      cutPrice: cutPrice,
      minOrder: MIN_ORDER,
      finalPrice: finalPrice,
      isEstimate: true,
      material: material,
      thickness: thickness,
      qty: qty
    };
  }

  /**
   * Format price estimate as HTML for display.
   */
  function formatEstimateHtml(est) {
    var html = '';
    html += '<div class="dxf-estimate">';
    html += '<div class="dxf-estimate-row"><span>Материал:</span><strong>' + materialLabel(est.material) + ', ' + est.thickness + ' мм</strong></div>';
    html += '<div class="dxf-estimate-row"><span>Длина реза (1 деталь):</span><strong>' + (Math.round(est.totalCutMeters * 1000 / est.qty) / 1000).toFixed(3) + ' м</strong></div>';
    if (est.qty > 1) {
      html += '<div class="dxf-estimate-row"><span>Общая длина реза:</span><strong>' + est.totalCutMeters.toFixed(3) + ' м</strong></div>';
    }
    html += '<div class="dxf-estimate-row"><span>Цена за п.м.:</span><strong>' + est.pricePerMeter + ' ₽</strong></div>';
    html += '<div class="dxf-estimate-row" style="border-top:1px solid rgba(255,107,43,0.2);padding-top:8px;margin-top:8px;"><span>Стоимость резки:</span><strong>' + est.cutPrice.toLocaleString('ru-RU') + ' ₽</strong></div>';
    if (est.cutPrice < est.minOrder) {
      html += '<div class="dxf-estimate-row"><span>Минимальный заказ:</span><strong>' + est.minOrder.toLocaleString('ru-RU') + ' ₽</strong></div>';
    }
    html += '<div class="dxf-estimate-total"><span>Итого (примерно):</span><strong>' + est.finalPrice.toLocaleString('ru-RU') + ' ₽</strong></div>';
    html += '<div class="dxf-estimate-note">* Точная цена после проверки чертежа. Не учтена точка входа лазера.</div>';
    html += '</div>';
    return html;
  }

  function materialLabel(key) {
    var map = {
      steel: 'Сталь Ст3, 09Г2С',
      stainless: 'Нержавейка AISI 304',
      stainless_316: 'Нержавейка AISI 316',
      aluminum: 'Алюминий АД31, АМГ'
    };
    return map[key] || key;
  }

  global.DxfCalculator = {
    estimatePrice: estimatePrice,
    formatEstimateHtml: formatEstimateHtml,
    getPricePerMeter: getPricePerMeter,
    MIN_ORDER: MIN_ORDER
  };
})(typeof window !== 'undefined' ? window : global);
