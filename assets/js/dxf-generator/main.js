/**
 * DXF Generator Main Controller v3
 * Visual hole editor: click preview to place, table to edit precisely.
 */
(function () {
  'use strict';

  var currentShape = 'rectangle';
  var currentParams = {};
  var currentCutLength = 0;
  var currentDxf = null;

  // Hole arrays: each hole = {cx, cy, d}
  var rectangleHoles = [];
  var circleHoles = [];
  var bracketHoles = [];

  function getCurrentHoles() {
    if (currentShape === 'rectangle') return rectangleHoles;
    if (currentShape === 'circle') return circleHoles;
    return bracketHoles;
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initFormListeners();
    initActionButtons();
    initBracketTypeSwitch();
    updateAll();
  });

  // ===== TABS =====
  function initTabs() {
    var tabs = document.querySelectorAll('.dxf-tab-btn');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentShape = btn.dataset.shape;
        document.querySelectorAll('.dxf-shape-form').forEach(function (f) { f.classList.remove('is-visible'); });
        var formEl = document.getElementById('form-' + currentShape);
        if (formEl) formEl.classList.add('is-visible');
        updateAll();
      });
    });
  }

  // ===== FORM LISTENERS =====
  function initFormListeners() {
    document.querySelectorAll('.dxf-shape-form input, .dxf-shape-form select').forEach(function (input) {
      // Skip hole table inputs — handled separately
      if (input.closest('.dxf-holes-table')) return;
      input.addEventListener('input', debounce(updateAll, 200));
      input.addEventListener('change', debounce(updateAll, 200));
    });
  }

  // ===== CLEAR HOLES + HOLE TABLE EDIT =====
  document.addEventListener('click', function(e) {
    // Clear button
    if (e.target.classList.contains('clear-holes-btn') || e.target.closest('.clear-holes-btn')) {
      var holes = getCurrentHoles();
      holes.length = 0;
      syncHoleTable(holes);
      updateAll();
    }
    // Delete hole from table
    if (e.target.classList.contains('hole-delete-btn') || e.target.closest('.hole-delete-btn')) {
      var btn = e.target.closest('.hole-delete-btn');
      var idx = parseInt(btn.getAttribute('data-idx'));
      if (idx >= 0) {
        var holes = getCurrentHoles();
        holes.splice(idx, 1);
        syncHoleTable(holes);
        updateAll();
      }
    }
  });

  // Hole table input changes
  document.addEventListener('input', function(e) {
    if (e.target.closest('.dxf-holes-table')) {
      var holes = getCurrentHoles();
      readHoleTable(holes);
      updateAll();
    }
  });

  // ===== ACTION BUTTONS =====
  function initActionButtons() {
    var downloadBtn = document.getElementById('dxf-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        if (!currentDxf) { alert('Сначала настройте параметры детали'); return; }
        currentDxf.download('detail-' + currentShape + '-' + Date.now() + '.dxf');
      });
    }

    var calcBtn = document.getElementById('dxf-calc-btn');
    if (calcBtn) calcBtn.addEventListener('click', updateAll);
  }

  // ===== COLLECT PARAMS =====
  function collectParams() {
    var p = {};
    var form = document.getElementById('form-' + currentShape);
    if (!form) return p;

    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function (input) {
      if (!input.name) return;
      if (input.closest('.dxf-holes-table')) return; // skip hole table
      if (input.closest('.dxf-bracket-fields') && !input.closest('.dxf-bracket-fields').classList.contains('is-visible')) return;
      var val = input.value;
      if (input.type === 'number' || input.type === 'range') val = parseFloat(val) || 0;
      p[input.name] = val;
    });

    // Holes from visual array (with individual diameters)
    var holes = getCurrentHoles();
    p.holes = holes.length > 0 ? holes.slice() : null;
    p.extraHoles = null;

    if (currentShape === 'bracket') p.type = p.bracketType || 'L';

    return p;
  }

  // ===== HOLE TABLE SYNC =====
  function getHoleTableId() {
    if (currentShape === 'rectangle') return 'rectHolesTable';
    if (currentShape === 'circle') return 'circleHolesTable';
    return 'bracketHolesTable';
  }

  function getHoleCountId() {
    if (currentShape === 'rectangle') return 'rectHoleCount';
    if (currentShape === 'circle') return 'circleHoleCount';
    return 'bracketHoleCount';
  }

  function syncHoleTable(holes) {
    var table = document.getElementById(getHoleTableId());
    var countEl = document.getElementById(getHoleCountId());
    if (!table) return;

    var tbody = table.querySelector('tbody');
    if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }

    tbody.innerHTML = '';

    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td style="padding:2px 4px;"><input type="number" value="' + h.cx.toFixed(2) + '" data-field="cx" data-idx="' + i +
        '" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:4px 6px;border-radius:4px;font-size:13px;" step="0.01"></td>' +
        '<td style="padding:2px 4px;"><input type="number" value="' + h.cy.toFixed(2) + '" data-field="cy" data-idx="' + i +
        '" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:4px 6px;border-radius:4px;font-size:13px;" step="0.01"></td>' +
        '<td style="padding:2px 4px;"><input type="number" value="' + h.d.toFixed(2) + '" data-field="d" data-idx="' + i +
        '" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:4px 6px;border-radius:4px;font-size:13px;" step="0.01" min="0.5"></td>' +
        '<td style="padding:2px 4px;text-align:center;"><button class="hole-delete-btn" data-idx="' + i +
        '" style="background:none;border:none;color:var(--error);cursor:pointer;font-size:16px;padding:2px 6px;">&times;</button></td>';
      tbody.appendChild(tr);
    }

    if (countEl) countEl.textContent = holes.length;
  }

  function readHoleTable(holes) {
    var table = document.getElementById(getHoleTableId());
    if (!table) return;
    var inputs = table.querySelectorAll('input[data-idx]');
    inputs.forEach(function (input) {
      var idx = parseInt(input.getAttribute('data-idx'));
      var field = input.getAttribute('data-field');
      var val = parseFloat(input.value) || 0;
      if (idx >= 0 && idx < holes.length) {
        holes[idx][field] = Math.round(val * 100) / 100;
      }
    });
  }

  // ===== UPDATE ALL =====
  function updateAll() {
    currentParams = collectParams();
    generateAndPreview();
    updatePrice();
  }

  function generateAndPreview() {
    currentDxf = new DxfDocument();

    var result = { cutLengthMeters: 0 };
    if (currentShape === 'rectangle') result = generateRectangle(currentDxf, currentParams);
    else if (currentShape === 'circle') result = generateCircle(currentDxf, currentParams);
    else if (currentShape === 'bracket') result = generateBracket(currentDxf, currentParams);

    currentCutLength = result.cutLengthMeters;

    var vb = calcViewBox(currentParams, currentShape);
    DxfPreview.render('dxf-preview', { type: currentShape, params: currentParams, viewBox: vb });

    // Enable visual hole placement
    var holeDiaEl = document.querySelector('#form-' + currentShape + ' input[id^="holeDia"]');
    var holeDia = holeDiaEl ? (parseFloat(holeDiaEl.value) || 6) : 6;
    var holes = getCurrentHoles();
    DxfPreview.enableHolePlacement('dxf-preview', holes, holeDia, function(updated) {
      syncHoleTable(holes);
      updatePrice();
    });

    // Sync table after preview render
    syncHoleTable(holes);
  }

  function calcViewBox(p, shape) {
    var margin = 0.05; // 5% margin — деталь почти вплотную
    if (shape === 'rectangle') {
      var w = (Number(p.width) || 100);
      var h = (Number(p.height) || 100);
      var size = Math.max(w, h) * (1 + margin * 2);
      // Keep square viewBox centered
      var half = size / 2;
      return { x: -half, y: -half, w: size, h: size };
    } else if (shape === 'circle') {
      var d = (Number(p.outerDia) || 100);
      var size = d * (1 + margin * 2);
      return { x: -size / 2, y: -size / 2, w: size, h: size };
    } else if (shape === 'bracket') {
      if ((p.bracketType || 'L') === 'L') {
        var l1 = (Number(p.leg1) || 50);
        var l2 = (Number(p.leg2) || 50);
        var maxDim = Math.max(l1 + 10, l2 + 10);
        var size = maxDim * (1 + margin * 2);
        return { x: -size * 0.4, y: -size * 0.4, w: size, h: size };
      } else {
        var bw = (Number(p.width) || 60);
        var bh = (Number(p.height) || 40);
        var maxDim = Math.max(bw, bh);
        var size = maxDim * (1 + margin * 2);
        return { x: -size / 2, y: -size / 2, w: size, h: size };
      }
    }
    return { x: -55, y: -55, w: 110, h: 110 };
  }

  function updatePrice() {
    var container = document.getElementById('dxf-price-estimate');
    if (!container) return;
    var material = currentParams.material || 'steel';
    var thickness = Number(currentParams.materialThickness || currentParams.thickness) || 3;
    var qty = Number(currentParams.qty) || 1;
    if (currentCutLength <= 0) {
      container.innerHTML = '<p class="dxf-placeholder">Настройте параметры детали</p>';
      return;
    }
    var est = DxfCalculator.estimatePrice(currentCutLength, material, thickness, qty);
    container.innerHTML = DxfCalculator.formatEstimateHtml(est);
    window.__LAST_ESTIMATE__ = est;
  }

  function initBracketTypeSwitch() {
    var typeSelect = document.querySelector('#form-bracket select[name="bracketType"]');
    if (!typeSelect) return;
    typeSelect.addEventListener('change', function () {
      document.querySelectorAll('.dxf-bracket-fields').forEach(function (f) {
        f.classList.toggle('is-visible', f.dataset.type === this.value);
      }.bind(this));
      updateAll();
    });
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }
})();
