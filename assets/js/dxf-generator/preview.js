/**
 * SVG Preview — renders shape geometry as SVG for visual feedback.
 * Mirrors DXF generation — same inputs, visual output.
 */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvg(width, height) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    return svg;
  }

  function px(v) { return Math.round(v * 100) / 100; }

  function addLine(g, x1, y1, x2, y2, style) {
    var line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', px(x1));
    line.setAttribute('y1', px(y1));
    line.setAttribute('x2', px(x2));
    line.setAttribute('y2', px(y2));
    line.setAttribute('stroke', style.stroke || '#ff6b2b');
    line.setAttribute('stroke-width', style.strokeWidth || 1.5);
    line.setAttribute('stroke-linecap', 'round');
    g.appendChild(line);
  }

  function addCircle(g, cx, cy, r, style) {
    var circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', px(cx));
    circle.setAttribute('cy', px(cy));
    circle.setAttribute('r', px(r));
    circle.setAttribute('fill', style.fill || 'none');
    circle.setAttribute('stroke', style.stroke || '#ff6b2b');
    circle.setAttribute('stroke-width', style.strokeWidth || 1.5);
    g.appendChild(circle);
  }

  function addPolyline(g, points, closed, style) {
    var poly = document.createElementNS(SVG_NS, closed ? 'polygon' : 'polyline');
    var ptsStr = points.map(function (p) { return px(p[0]) + ',' + px(p[1]); }).join(' ');
    poly.setAttribute('points', ptsStr);
    poly.setAttribute('fill', style.fill || 'none');
    poly.setAttribute('stroke', style.stroke || '#ff6b2b');
    poly.setAttribute('stroke-width', style.strokeWidth || 1.5);
    poly.setAttribute('stroke-linejoin', 'round');
    g.appendChild(poly);
  }

  /**
   * Main preview function.
   * @param {SVGElement|string} container — DOM element or ID
   * @param {object} shapeData — { type, params, viewBox }
   *
   * shapeData.viewBox = { x, y, w, h } — SVG viewBox in mm
   * We scale mm → pixels with auto-fit.
   */
  function renderPreview(container, shapeData) {
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    if (!container) return;

    container.innerHTML = '';

    var vb = shapeData.viewBox || { x: -80, y: -80, w: 160, h: 160 };
    var svg = createSvg(vb.w, vb.h);
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);

    // Grid — 10mm major, 5mm minor, 2mm fine, axes
    var gridFine = document.createElementNS(SVG_NS, 'g');
    var gridMinor = document.createElementNS(SVG_NS, 'g');
    var gridMajor = document.createElementNS(SVG_NS, 'g');
    var gridAxes = document.createElementNS(SVG_NS, 'g');

    var fineStep = 2;
    var startX = Math.floor(vb.x / fineStep) * fineStep;
    var startY = Math.floor(vb.y / fineStep) * fineStep;

    for (var gx = startX; gx <= vb.x + vb.w; gx += fineStep) {
      if (gx % 10 === 0) { addLine(gridMajor, gx, vb.y, gx, vb.y + vb.h, { stroke: '#ffffff', strokeWidth: 0.4 }); }
      else if (gx % 5 === 0) { addLine(gridMinor, gx, vb.y, gx, vb.y + vb.h, { stroke: '#ffffff', strokeWidth: 0.2 }); }
      else { addLine(gridFine, gx, vb.y, gx, vb.y + vb.h, { stroke: '#ffffff', strokeWidth: 0.1 }); }
    }
    for (var gy = startY; gy <= vb.y + vb.h; gy += fineStep) {
      if (gy % 10 === 0) { addLine(gridMajor, vb.x, gy, vb.x + vb.w, gy, { stroke: '#ffffff', strokeWidth: 0.4 }); }
      else if (gy % 5 === 0) { addLine(gridMinor, vb.x, gy, vb.x + vb.w, gy, { stroke: '#ffffff', strokeWidth: 0.2 }); }
      else { addLine(gridFine, vb.x, gy, vb.x + vb.w, gy, { stroke: '#ffffff', strokeWidth: 0.1 }); }
    }

    addLine(gridAxes, 0, vb.y, 0, vb.y + vb.h, { stroke: 'rgba(255,107,43,0.5)', strokeWidth: 0.6 });
    addLine(gridAxes, vb.x, 0, vb.x + vb.w, 0, { stroke: 'rgba(255,107,43,0.5)', strokeWidth: 0.6 });

    gridFine.style.opacity = '0.08';
    gridMinor.style.opacity = '0.15';
    gridMajor.style.opacity = '0.25';
    gridAxes.style.opacity = '0.5';

    svg.appendChild(gridFine);
    svg.appendChild(gridMinor);
    svg.appendChild(gridMajor);
    svg.appendChild(gridAxes);

    // Cut layer (orange)
    var cut = document.createElementNS(SVG_NS, 'g');
    cut.setAttribute('id', 'preview-cut');
    svg.appendChild(cut);

    // Hole layer (blue)
    var holes = document.createElementNS(SVG_NS, 'g');
    holes.setAttribute('id', 'preview-holes');
    holes.style.opacity = '0.7';

    // Render based on type
    var shapeG = document.createElementNS(SVG_NS, 'g');
    shapeG.setAttribute('id', 'preview-shape');
    svg.appendChild(shapeG);

    if (shapeData.type === 'rectangle') {
      renderRectanglePreview(shapeG, shapeData.params);
    } else if (shapeData.type === 'circle') {
      renderCirclePreview(shapeG, shapeData.params);
    }

    svg.appendChild(holes);
    container.appendChild(svg);
  }

  function renderRectanglePreview(g, p) {
    var w = Number(p.width) || 100;
    var h = Number(p.height) || 100;
    var cr = Number(p.cornerRadius) || 0;
    var x = -w / 2;
    var y = -h / 2;

    if (cr > 0) {
      // Simplified rounded rect (svg rect with rx)
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', px(x));
      rect.setAttribute('y', px(y));
      rect.setAttribute('width', px(w));
      rect.setAttribute('height', px(h));
      rect.setAttribute('rx', px(cr));
      rect.setAttribute('ry', px(cr));
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#ff6b2b');
      rect.setAttribute('stroke-width', '1.5');
      g.appendChild(rect);
    } else {
      addPolyline(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, { stroke: '#ff6b2b' });
    }

    // All holes drawn by visual editor — enableHolePlacement handles markers
  }

  function renderCirclePreview(g, p) {
    var outerD = Number(p.outerDia) || 100;

    addCircle(g, 0, 0, outerD / 2, { stroke: '#ff6b2b' });

    var innerD = Number(p.innerDia) || 0;
    if (innerD > 0) {
      addCircle(g, 0, 0, innerD / 2, { stroke: '#4a9eff' });
    }

    // Holes from visual editor are drawn by enableHolePlacement
  }

  function renderBracketPreview(g, p) {
    var type = p.type || 'L';
    var stroke = '#ff6b2b';
    var holeStroke = '#4a9eff';

    if (type === 'L') {
      var leg1 = Number(p.leg1) || 50;
      var leg2 = Number(p.leg2) || 50;
      var t = Number(p.thickness) || 3;

      addPolyline(g, [
        [-t, leg2 + t], [leg1 + t, leg2 + t], [leg1 + t, -t],
        [0, -t], [0, 0], [-t, 0]
      ], true, { stroke: stroke });

      // Default holes
      if (!p.holes || p.holes.length === 0) {
        addCircle(g, -t / 2, leg2 / 2, 3, { stroke: holeStroke });
        addCircle(g, leg1 / 2, -t / 2, 3, { stroke: holeStroke });
      }
    } else if (type === 'P') {
      var w = Number(p.width) || 60;
      var h = Number(p.height) || 40;
      var flange1 = Number(p.flange1) || 15;
      var flange2 = Number(p.flange2) || 15;
      var t = Number(p.thickness) || 3;
      var x0 = -w / 2;

      addPolyline(g, [
        [x0, 0], [x0, h], [x0 + flange1, h], [x0 + flange1, h - t],
        [x0 + t, h - t], [x0 + t, t], [x0 + flange2, t], [x0 + flange2, 0],
        [x0 + w - flange2, 0], [x0 + w - flange2, t], [x0 + w - t, t],
        [x0 + w - t, h - t], [x0 + w - flange1, h - t], [x0 + w - flange1, h],
        [x0 + w, h], [x0 + w, 0]
      ], true, { stroke: stroke });
    } else if (type === 'Z') {
      var w = Number(p.width) || 50;
      var h = Number(p.height) || 40;
      var topFlange = Number(p.topFlange) || 15;
      var bottomFlange = Number(p.bottomFlange) || 15;
      var t = Number(p.thickness) || 3;

      addPolyline(g, [
        [0, h], [topFlange, h], [topFlange, h - t], [w, h - t],
        [w, 0], [w - bottomFlange, 0], [w - bottomFlange, t], [0, t]
      ], true, { stroke: stroke });
    } else if (type === 'T') {
      var stemH = Number(p.stemHeight) || 60;
      var stemW = Number(p.stemWidth) || 30;
      var barW = Number(p.barWidth) || 80;
      var t = Number(p.thickness) || 3;
      var hsw = stemW / 2;
      var hbw = barW / 2;

      addPolyline(g, [
        [-hsw, -stemH], [hsw, -stemH], [hsw, 0],
        [hbw, 0], [hbw, t], [-hbw, t], [-hbw, 0], [-hsw, 0]
      ], true, { stroke: stroke });
    }

    // Custom holes
    if (p.holes && p.holes.length) {
      for (var j = 0; j < p.holes.length; j++) {
        var hole = p.holes[j];
        addCircle(g, Number(hole.cx) || 0, Number(hole.cy) || 0, (Number(hole.d) || 5) / 2, { stroke: holeStroke });
      }
    }
  }

  /**
   * Enable interactive hole placement on the preview SVG.
   * @param {string|Element} container — preview container element or ID
   * @param {Array} holes — shared array of {cx, cy, d}
   * @param {number} defaultDia — default hole diameter in mm
   * @param {function} onChange — callback(holes) when holes change
   */
  var selectedHoleIndex = -1;

  function enableHolePlacement(container, holes, defaultDia, onChange, snapGrid) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;

    var svg = container.querySelector('svg');
    if (!svg) return;

    defaultDia = defaultDia || 6;
    snapGrid = (snapGrid !== false);
    selectedHoleIndex = -1;

    var holeLayer = svg.querySelector('#preview-holes-layer');
    if (!holeLayer) {
      holeLayer = document.createElementNS(SVG_NS, 'g');
      holeLayer.setAttribute('id', 'preview-holes-layer');
      holeLayer.style.cursor = 'crosshair';
      svg.appendChild(holeLayer);
    }

    renderHoleMarkers(holeLayer, holes, -1);

    // Click on empty space → add hole
    svg.onclick = function(e) {
      if (e.target.closest('.hole-marker')) return;

      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var svgPt = pt.matrixTransform(ctm.inverse());

      var cx = Math.round(svgPt.x * 100) / 100;
      var cy = Math.round(svgPt.y * 100) / 100;

      if (snapGrid) {
        cx = Math.round(cx / 5) * 5;
        cy = Math.round(cy / 5) * 5;
      }

      holes.push({ cx: cx, cy: cy, d: defaultDia, shape: 'circle' });
      selectedHoleIndex = holes.length - 1;
      renderHoleMarkers(holeLayer, holes, selectedHoleIndex);
      if (onChange) onChange(holes);
    };

    // Re-render when holes array changes externally
    var _push = holes.push;
    holes.push = function() {
      var r = _push.apply(this, arguments);
      renderHoleMarkers(holeLayer, holes, selectedHoleIndex);
      if (onChange) onChange(holes);
      return r;
    };
    holes.removeAt = function(idx) {
      if (idx >= 0 && idx < this.length) {
        this.splice(idx, 1);
        selectedHoleIndex = -1;
        renderHoleMarkers(holeLayer, holes, -1);
        if (onChange) onChange(holes);
      }
    };
    holes.clear = function() {
      this.length = 0;
      selectedHoleIndex = -1;
      renderHoleMarkers(holeLayer, holes, -1);
      if (onChange) onChange(holes);
    };
  }

  function renderHoleMarkers(layer, holes, selectedIdx) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);

    for (var i = 0; i < holes.length; i++) {
      var h = holes[i];
      var cx = Number(h.cx) || 0;
      var cy = Number(h.cy) || 0;
      var r = (Number(h.d) || 6) / 2;
      var isSelected = (i === selectedIdx);

      var g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'hole-marker');
      g.style.cursor = 'pointer';
      g.setAttribute('data-index', i);

      var isSlot = (h.shape === 'slot');
      var slotLen = Number(h.slotLen) || h.d * 3;
      var slotOri = h.slotOri || 'h';
      var sColor = isSelected ? '#fff' : '#4a9eff';
      var sWidth = isSelected ? '2.5' : '1.5';
      var sFill = isSelected ? 'rgba(74,158,255,0.35)' : 'rgba(74,158,255,0.12)';

      if (isSlot) {
        // Slot — rounded rectangle
        var hw = h.d / 2;
        var halfLen = slotLen / 2 - hw;
        var rx, ry, rw, rh;
        if (slotOri === 'v') {
          rx = cx - hw; ry = cy - halfLen - hw;
          rw = h.d; rh = slotLen;
        } else {
          rx = cx - halfLen - hw; ry = cy - hw;
          rw = slotLen; rh = h.d;
        }
        var slotRect = document.createElementNS(SVG_NS, 'rect');
        slotRect.setAttribute('x', rx);
        slotRect.setAttribute('y', ry);
        slotRect.setAttribute('width', rw);
        slotRect.setAttribute('height', rh);
        slotRect.setAttribute('rx', hw);
        slotRect.setAttribute('ry', hw);
        slotRect.setAttribute('fill', sFill);
        slotRect.setAttribute('stroke', sColor);
        slotRect.setAttribute('stroke-width', sWidth);
        g.appendChild(slotRect);
      } else {
        // Circle
        var circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', sFill);
        circle.setAttribute('stroke', sColor);
        circle.setAttribute('stroke-width', sWidth);
        g.appendChild(circle);
      }

      // Crosshair
      var cs = r + 4;
      var cross = document.createElementNS(SVG_NS, 'path');
      cross.setAttribute('d', 'M' + (cx - cs) + ',' + cy + 'H' + (cx + cs) + 'M' + cx + ',' + (cy - cs) + 'V' + (cy + cs));
      cross.setAttribute('stroke', sColor);
      cross.setAttribute('stroke-width', isSelected ? '1.2' : '0.6');
      cross.setAttribute('opacity', isSelected ? '0.9' : '0.4');
      g.appendChild(cross);

      // Label
      var label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', cx + cs + 2);
      label.setAttribute('y', cy - cs);
      label.setAttribute('fill', sColor);
      label.setAttribute('font-size', isSelected ? '11' : '9');
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('font-weight', isSelected ? 'bold' : 'normal');
      label.textContent = (isSlot ? '▬' + h.d + '×' + slotLen : '⌀' + h.d) + ' (' + (cx >= 0 ? '+' : '') + cx.toFixed(1) + ',' + (cy >= 0 ? '+' : '') + cy.toFixed(1) + ')';
      g.appendChild(label);

      // Click → select
      g.onclick = function(e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-index'));
        selectedHoleIndex = (selectedHoleIndex === idx) ? -1 : idx;
        renderHoleMarkers(layer, holes, selectedHoleIndex);
        if (onChange) onChange(holes);
      };

      // Double-click → delete
      g.ondblclick = function(e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-index'));
        holes.splice(idx, 1);
        selectedHoleIndex = -1;
        renderHoleMarkers(layer, holes, -1);
        if (onChange) onChange(holes);
      };

      // Hover
      g.onmouseenter = function() {
        if (parseInt(this.getAttribute('data-index')) !== selectedHoleIndex) {
          this.style.opacity = '0.7';
        }
      };
      g.onmouseleave = function() { this.style.opacity = '1'; };

      layer.appendChild(g);
    }
  }

  global.DxfPreview = {
    render: renderPreview,
    createSvg: createSvg,
    enableHolePlacement: enableHolePlacement
  };
})(typeof window !== 'undefined' ? window : global);
