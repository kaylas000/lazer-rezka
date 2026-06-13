/**
 * DXF Generator Main Controller v4 — slot support
 * Visual hole editor: click preview to place, table to edit precisely.
 * Build: SLOT-20260612
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

  function getCurrentHoles() {
    if (currentShape === 'rectangle') return rectangleHoles;
    return circleHoles;
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initFormListeners();
    initActionButtons();
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
      return;
    }
    // Delete hole
    if (e.target.classList.contains('hole-delete-btn') || e.target.closest('.hole-delete-btn')) {
      var delBtn = e.target.closest('.hole-delete-btn');
      var delIdx = parseInt(delBtn.getAttribute('data-idx'));
      if (delIdx >= 0) {
        var delHoles = getCurrentHoles();
        delHoles.splice(delIdx, 1);
        syncHoleTable(delHoles);
        updateAll();
      }
      return;
    }
    // Shape toggle button (КРУГ ↔ ПАЗ)
    if (e.target.classList.contains('shape-toggle-btn') || e.target.closest('.shape-toggle-btn')) {
      var shBtn = e.target.closest('.shape-toggle-btn');
      var shIdx = parseInt(shBtn.getAttribute('data-idx'));
      var shHoles = getCurrentHoles();
      if (shIdx >= 0 && shIdx < shHoles.length) {
        shHoles[shIdx].shape = shHoles[shIdx].shape === 'slot' ? 'circle' : 'slot';
        if (shHoles[shIdx].shape === 'slot' && !shHoles[shIdx].slotLen) {
          shHoles[shIdx].slotLen = shHoles[shIdx].d * 3;
          shHoles[shIdx].slotOri = 'h';
        }
        syncHoleTable(shHoles);
        updateAll();
      }
      return;
    }
    // Orientation toggle (Гор ↔ Верт)
    if (e.target.classList.contains('ori-toggle-btn') || e.target.closest('.ori-toggle-btn')) {
      var oriBtn = e.target.closest('.ori-toggle-btn');
      var oriIdx = parseInt(oriBtn.getAttribute('data-idx'));
      var oriHoles = getCurrentHoles();
      if (oriIdx >= 0 && oriIdx < oriHoles.length) {
        oriHoles[oriIdx].slotOri = oriHoles[oriIdx].slotOri === 'v' ? 'h' : 'v';
        syncHoleTable(oriHoles);
        updateAll();
      }
      return;
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
      var val = input.value;
      if (input.type === 'number' || input.type === 'range') val = parseFloat(val) || 0;
      p[input.name] = val;
    });

    // Holes from visual array (with individual diameters)
    var holes = getCurrentHoles();
    p.holes = holes.length > 0 ? holes.slice() : null;
    p.extraHoles = null;

    return p;
  }

  // ===== HOLE TABLE SYNC =====
  function getHoleTableId() {
    if (currentShape === 'rectangle') return 'rectHolesTable';
    return 'circleHolesTable';
  }

  function getHoleCountId() {
    if (currentShape === 'rectangle') return 'rectHoleCount';
    return 'circleHoleCount';
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
      var shape = h.shape || 'circle';
      var isSlot = shape === 'slot';
      var tr = document.createElement('tr');
      var slotLen = h.slotLen || h.d * 3 || 18;
      var slotOri = h.slotOri || 'h';
      tr.innerHTML =
        '<td style="padding:1px;"><input type="number" value="' + h.cx.toFixed(1) + '" data-field="cx" data-idx="' + i +
        '" style="width:100%;box-sizing:border-box;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:2px;border-radius:2px;font-size:11px;height:24px;" step="0.1"></td>' +
        '<td style="padding:1px;"><input type="number" value="' + h.cy.toFixed(1) + '" data-field="cy" data-idx="' + i +
        '" style="width:100%;box-sizing:border-box;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:2px;border-radius:2px;font-size:11px;height:24px;" step="0.1"></td>' +
        '<td style="padding:1px;"><input type="number" value="' + h.d.toFixed(1) + '" data-field="d" data-idx="' + i +
        '" style="width:100%;box-sizing:border-box;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:2px;border-radius:2px;font-size:11px;height:24px;" step="0.1" min="0.5"></td>' +
        '<td style="padding:1px;text-align:center;"><button class="shape-toggle-btn" data-idx="' + i +
        '" style="width:100%;height:24px;background:' + (isSlot ? 'rgba(255,107,43,0.2)' : 'rgba(74,158,255,0.2)') +
        ';border:1px solid ' + (isSlot ? 'var(--accent-orange)' : '#4a9eff') +
        ';color:' + (isSlot ? 'var(--accent-orange)' : '#4a9eff') +
        ';border-radius:2px;font-size:10px;cursor:pointer;padding:0 2px;font-weight:bold;line-height:22px;">' +
        (isSlot ? 'ПАЗ' : 'КРУГ') + '</button></td>' +
        (isSlot
          ? '<td style="padding:1px;"><input type="number" value="' + slotLen.toFixed(1) + '" data-field="slotLen" data-idx="' + i +
            '" style="width:100%;box-sizing:border-box;background:var(--bg-primary);border:1px solid var(--border-default);color:var(--text-primary);padding:2px;border-radius:2px;font-size:11px;height:24px;" step="0.1" min="1" title="Длина паза">' +
            '<button class="ori-toggle-btn" data-idx="' + i +
            '" style="width:100%;height:24px;background:rgba(255,255,255,0.05);border:1px solid var(--border-default);color:var(--text-muted);border-radius:2px;font-size:10px;cursor:pointer;padding:0 2px;margin-top:1px;">' +
            (slotOri==='h' ? 'Гор' : 'Верт') + '</button></td>'
          : '<td style="padding:1px;"></td>') +
        '<td style="padding:1px;text-align:center;width:24px;"><button class="hole-delete-btn" data-idx="' + i +
        '" style="background:none;border:none;color:var(--error);cursor:pointer;font-size:16px;padding:0;line-height:24px;">&times;</button></td>';
      tbody.appendChild(tr);
    }

    if (countEl) countEl.textContent = holes.length;
  }

  function readHoleTable(holes) {
    var table = document.getElementById(getHoleTableId());
    if (!table) return;
    // Read number inputs
    table.querySelectorAll('input[data-idx]').forEach(function (input) {
      var idx = parseInt(input.getAttribute('data-idx'));
      var field = input.getAttribute('data-field');
      var val = parseFloat(input.value) || 0;
      if (idx >= 0 && idx < holes.length) {
        holes[idx][field] = Math.round(val * 100) / 100;
      }
    });
    // Shape is toggled by button — already handled by click events
    // Slot orientation is toggled by button — already handled
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

    currentCutLength = result.cutLengthMeters;

    var vb = calcViewBox(currentParams, currentShape);
    DxfPreview.render('dxf-preview', { type: currentShape, params: currentParams, viewBox: vb });

    // Enable visual hole placement
    var holeDiaEl = document.querySelector('#form-' + currentShape + ' input[id^="holeDia"]');
    var holeDia = holeDiaEl ? (parseFloat(holeDiaEl.value) || 6) : 6;
    var holes = getCurrentHoles();
    var snapCb = document.querySelector('#form-' + currentShape + ' input[type=checkbox]');
    var snapOn = !snapCb || snapCb.checked;
    DxfPreview.enableHolePlacement('dxf-preview', holes, holeDia, function(updated) {
      syncHoleTable(holes);
      updatePrice();
    }, snapOn);

    // Sync table after preview render
    syncHoleTable(holes);
  }

  function calcViewBox(p, shape) {
    var m = 0.08; // 8% margin around detail in the square
    var size;
    if (shape === 'rectangle') {
      var w = (Number(p.width) || 100);
      var h = (Number(p.height) || 100);
      size = Math.max(w, h) * (1 + m);
    } else if (shape === 'circle') {
      size = (Number(p.outerDia) || 100) * (1 + m);
    } else {
      size = 110;
    }
    var half = size / 2;
    return { x: -half, y: -half, w: size, h: size };
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

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }
})();
