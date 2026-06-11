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
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.background = '#1a1a2e';
    svg.style.borderRadius = '8px';
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

    // Grid
    var grid = document.createElementNS(SVG_NS, 'g');
    grid.style.opacity = '0.1';
    var gridStep = 10;
    for (var gx = Math.floor(vb.x / gridStep) * gridStep; gx <= vb.x + vb.w; gx += gridStep) {
      addLine(grid, gx, vb.y, gx, vb.y + vb.h, { stroke: '#ffffff', strokeWidth: 0.3 });
    }
    for (var gy = Math.floor(vb.y / gridStep) * gridStep; gy <= vb.y + vb.h; gy += gridStep) {
      addLine(grid, vb.x, gy, vb.x + vb.w, gy, { stroke: '#ffffff', strokeWidth: 0.3 });
    }
    svg.appendChild(grid);

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
    } else if (shapeData.type === 'bracket') {
      renderBracketPreview(shapeG, shapeData.params);
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

    // Center hole
    var ch = Number(p.centerHoleDia) || 0;
    if (ch > 0) {
      addCircle(g, 0, 0, ch / 2, { stroke: '#4a9eff' });
    }

    // Bolt circle
    var bcDia = Number(p.boltCircleDia) || 0;
    var bcCount = Number(p.boltCount) || 0;
    var bcHoleDia = Number(p.boltHoleDia) || 0;
    if (bcDia > 0 && bcCount >= 3 && bcHoleDia > 0) {
      var br = bcDia / 2;
      // bolt circle reference (dashed)
      addCircle(g, 0, 0, br, { stroke: '#ffffff', strokeWidth: 0.3 });
      for (var i = 0; i < bcCount; i++) {
        var angle = (Math.PI * 2 * i) / bcCount - Math.PI / 2;
        addCircle(g, br * Math.cos(angle), br * Math.sin(angle), bcHoleDia / 2, { stroke: '#4a9eff' });
      }
    }

    // Custom holes
    if (p.holes && p.holes.length) {
      for (var j = 0; j < p.holes.length; j++) {
        var hole = p.holes[j];
        addCircle(g, Number(hole.cx) || 0, Number(hole.cy) || 0, (Number(hole.d) || 5) / 2, { stroke: '#4a9eff' });
      }
    }
  }

  function renderCirclePreview(g, p) {
    var outerD = Number(p.outerDia) || 100;

    addCircle(g, 0, 0, outerD / 2, { stroke: '#ff6b2b' });

    var innerD = Number(p.innerDia) || 0;
    if (innerD > 0) {
      addCircle(g, 0, 0, innerD / 2, { stroke: '#4a9eff' });
    }

    var bcDia = Number(p.boltCircleDia) || 0;
    var bcCount = Number(p.boltCount) || 0;
    var bcHoleDia = Number(p.boltHoleDia) || 0;
    if (bcDia > 0 && bcCount >= 3 && bcHoleDia > 0) {
      var br = bcDia / 2;
      addCircle(g, 0, 0, br, { stroke: '#ffffff', strokeWidth: 0.3 });
      for (var i = 0; i < bcCount; i++) {
        var angle = (Math.PI * 2 * i) / bcCount - Math.PI / 2;
        addCircle(g, br * Math.cos(angle), br * Math.sin(angle), bcHoleDia / 2, { stroke: '#4a9eff' });
      }
    }
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
    }

    // Custom holes
    if (p.holes && p.holes.length) {
      for (var j = 0; j < p.holes.length; j++) {
        var hole = p.holes[j];
        addCircle(g, Number(hole.cx) || 0, Number(hole.cy) || 0, (Number(hole.d) || 5) / 2, { stroke: holeStroke });
      }
    }
  }

  global.DxfPreview = {
    render: renderPreview,
    createSvg: createSvg
  };
})(typeof window !== 'undefined' ? window : global);
