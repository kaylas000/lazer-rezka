/**
 * DXF Generator Main Controller
 * Ties together UI, shape generators, preview, calculator, and download.
 */
(function () {
  'use strict';

  var currentShape = 'rectangle';
  var currentParams = {};
  var currentCutLength = 0;
  var currentDxf = null;

  // Visual hole arrays (shared with preview)
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
    // Generate initial preview
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

        // Show/hide forms
        document.querySelectorAll('.dxf-shape-form').forEach(function (f) { f.classList.remove('is-visible'); });
        var formEl = document.getElementById('form-' + currentShape);
        if (formEl) formEl.classList.add('is-visible');

        updateAll();
      });
    });
  }

  // ===== FORM LISTENERS =====
  function initFormListeners() {
    // Any input change → update preview + price
    document.querySelectorAll('.dxf-shape-form input, .dxf-shape-form select').forEach(function (input) {
      input.addEventListener('input', debounce(updateAll, 200));
      input.addEventListener('change', debounce(updateAll, 200));
    });
  }

  // ===== CLEAR HOLES BUTTON =====
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('clear-holes-btn') || e.target.closest('.clear-holes-btn')) {
      var holes = getCurrentHoles();
      holes.length = 0;
      var holeLayer = document.querySelector('#preview-holes-layer');
      if (holeLayer) while (holeLayer.firstChild) holeLayer.removeChild(holeLayer.firstChild);
      updateAll();
    }
    // Update hole diameter when input changes
    if (e.target.id && e.target.id.startsWith('holeDiaInput')) {
      var holes = getCurrentHoles();
      var newDia = parseFloat(e.target.value) || 6;
      // Update default diameter — existing holes keep their diameters
      updateAll();
    }
  });

  // ===== ACTION BUTTONS =====
  function initActionButtons() {
    var downloadBtn = document.getElementById('dxf-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        if (!currentDxf) {
          alert('Сначала настройте параметры детали');
          return;
        }
        var filename = 'detail-' + currentShape + '-' + Date.now() + '.dxf';
        currentDxf.download(filename);
      });
    }

    var calcBtn = document.getElementById('dxf-calc-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', updateAll);
    }
  }

  // ===== COLLECT PARAMS =====
  function collectParams() {
    var p = {};
    var form = document.getElementById('form-' + currentShape);
    if (!form) return p;

    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function (input) {
      if (!input.name) return;
      // Skip hidden subform fields (different bracket types)
      var subform = input.closest('.dxf-bracket-fields');
      if (subform && !subform.classList.contains('is-visible')) return;

      var val = input.value;
      if (input.type === 'number' || input.type === 'range') {
        val = parseFloat(val) || 0;
      }
      p[input.name] = val;
    });

    // Holes are managed visually via preview clicks — set in generateAndPreview()
    p.holes = null;
    p.extraHoles = null;

    // Bracket: use materialThickness for price, thickness for geometry
    if (currentShape === 'bracket') {
      p.type = p.bracketType || 'L';
    }

    return p;
  }

  function parseExtraHoles(text) {
    // Format: "angle,dist,d; angle,dist,d"
    if (!text || !text.trim()) return null;
    var holes = [];
    var parts = text.split(';');
    for (var i = 0; i < parts.length; i++) {
      var vals = parts[i].split(',').map(function (v) { return parseFloat(v.trim()) || 0; });
      if (vals.length >= 3) {
        holes.push({ angle: vals[0], dist: vals[1], d: vals[2] });
      }
    }
    return holes.length > 0 ? holes : null;
  }

  function parseHoles(text) {
    // Format: "cx,cy,d; cx,cy,d" — semicolon-separated, comma-separated values
    if (!text || !text.trim()) return null;
    var holes = [];
    var parts = text.split(';');
    for (var i = 0; i < parts.length; i++) {
      var vals = parts[i].split(',').map(function (v) { return parseFloat(v.trim()) || 0; });
      if (vals.length >= 3) {
        holes.push({ cx: vals[0], cy: vals[1], d: vals[2] });
      }
    }
    return holes.length > 0 ? holes : null;
  }

  // ===== UPDATE ALL =====
  function updateAll() {
    currentParams = collectParams();
    generateAndPreview();
    updatePrice();
  }

  function generateAndPreview() {
    currentDxf = new DxfDocument();

    // Attach visual holes to params
    var holes = getCurrentHoles();
    if (currentShape === 'rectangle') {
      currentParams.holes = holes.length > 0 ? holes : null;
    } else if (currentShape === 'circle') {
      currentParams.extraHoles = holes.length > 0 ? holes : null;
    } else if (currentShape === 'bracket') {
      currentParams.holes = holes.length > 0 ? holes : null;
    }

    var result = { cutLengthMeters: 0 };
    if (currentShape === 'rectangle') {
      result = generateRectangle(currentDxf, currentParams);
    } else if (currentShape === 'circle') {
      result = generateCircle(currentDxf, currentParams);
    } else if (currentShape === 'bracket') {
      result = generateBracket(currentDxf, currentParams);
    }

    currentCutLength = result.cutLengthMeters;

    // Auto-calculate viewBox
    var vb = calcViewBox(currentParams, currentShape);
    DxfPreview.render('dxf-preview', { type: currentShape, params: currentParams, viewBox: vb });

    // Enable visual hole placement — use visible hole diameter input
    var holeDiaEl = document.querySelector('#form-' + currentShape + ' input[id^="holeDiaInput"]');
    var holeDia = holeDiaEl ? (parseFloat(holeDiaEl.value) || 6) : 6;
    DxfPreview.enableHolePlacement('dxf-preview', holes, holeDia, function(updated) {
      updatePrice();
    });
  }

  function calcViewBox(p, shape) {
    var margin = 20;
    if (shape === 'rectangle') {
      var w = (Number(p.width) || 100);
      var h = (Number(p.height) || 100);
      var size = Math.max(w, h) + margin * 2;
      return { x: -size / 2, y: -size / 2, w: size, h: size };
    } else if (shape === 'circle') {
      var d = (Number(p.outerDia) || 100) + margin * 2;
      return { x: -d / 2, y: -d / 2, w: d, h: d };
    } else if (shape === 'bracket') {
      if (p.bracketType === 'L' || !p.bracketType) {
        var l1 = (Number(p.leg1) || 50) + 20 + margin;
        var l2 = (Number(p.leg2) || 50) + 20 + margin;
        return { x: -margin - 30, y: -margin - 30, w: l1 + 30 + margin, h: l2 + 30 + margin };
      } else {
        var bw = (Number(p.width) || 60) + margin * 2;
        var bh = (Number(p.height) || 40) + margin * 2;
        return { x: -bw / 2, y: -bh / 2, w: bw, h: bh };
      }
    }
    return { x: -120, y: -120, w: 240, h: 240 };
  }

  function updatePrice() {
    var container = document.getElementById('dxf-price-estimate');
    if (!container) return;

    var material = currentParams.material || 'steel';
    // Bracket: materialThickness for pricing, thickness for geometry
    var thickness = Number(currentParams.materialThickness || currentParams.thickness) || 3;
    var qty = Number(currentParams.qty) || 1;

    if (currentCutLength <= 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">Настройте параметры детали</p>';
      return;
    }

    var est = DxfCalculator.estimatePrice(currentCutLength, material, thickness, qty);
    container.innerHTML = DxfCalculator.formatEstimateHtml(est);

    // Store estimate data for the order button
    window.__LAST_ESTIMATE__ = est;
  }

  // ===== BRACKET TYPE SWITCH =====
  function initBracketTypeSwitch() {
    var typeSelect = document.querySelector('#form-bracket select[name="bracketType"]');
    if (!typeSelect) return;

    typeSelect.addEventListener('change', function () {
      var val = this.value;
      document.querySelectorAll('.dxf-bracket-fields').forEach(function (f) {
        f.classList.toggle('is-visible', f.dataset.type === val);
      });
      updateAll();
    });
  }

  // ===== UTILS =====
  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }
})();
