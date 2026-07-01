/**
 * DXF Generator Core — pure-JS DXF writer for laser cutting.
 * Produces valid R12 DXF (minimal) with LINE, CIRCLE, ARC, LWPOLYLINE.
 *
 * Usage:
 *   var doc = new DxfDocument();
 *   doc.line(x1, y1, x2, y2);
 *   doc.circle(cx, cy, r);
 *   doc.polyline(points, { closed: true });
 *   doc.arc(cx, cy, r, startAngle, endAngle);
 *   var dxfString = doc.toString();
 */

(function (global) {
  'use strict';

  /**
   * Round to 3 decimal places (≈0.001mm — sufficient for laser).
   */
  function r(v) {
    return Math.round(v * 100) / 100;
  }

  /**
   * DxfDocument — accumulates entities and outputs valid DXF.
   */
  function DxfDocument() {
    this.entities = [];
    this._layer = '0';
  }

  DxfDocument.prototype.layer = function (name) {
    this._layer = name;
  };

  DxfDocument.prototype.line = function (x1, y1, x2, y2) {
    this.entities.push({
      type: 'LINE',
      data: [
        [8, this._layer],
        [10, r(x1)], [20, r(y1)], [30, 0],
        [11, r(x2)], [21, r(y2)], [31, 0]
      ]
    });
  };

  DxfDocument.prototype.circle = function (cx, cy, radius) {
    this.entities.push({
      type: 'CIRCLE',
      data: [
        [8, this._layer],
        [10, r(cx)], [20, r(cy)], [30, 0],
        [40, r(radius)]
      ]
    });
  };

  DxfDocument.prototype.arc = function (cx, cy, radius, startAngleDeg, endAngleDeg) {
    this.entities.push({
      type: 'ARC',
      data: [
        [8, this._layer],
        [10, r(cx)], [20, r(cy)], [30, 0],
        [40, r(radius)],
        [50, r(startAngleDeg)],
        [51, r(endAngleDeg)]
      ]
    });
  };

  /**
   * Polyline (LWPOLYLINE — lightweight, R14+).
   * points: [[x1,y1], [x2,y2], ...]
   * opts: { closed: bool, bulge: number[] }
   */
  DxfDocument.prototype.polyline = function (points, opts) {
    opts = opts || {};
    var n = points.length;
    if (n < 2) return;

    var data = [[8, this._layer], [90, n]];

    // flag 1 = closed
    var flags = opts.closed ? 1 : 0;
    data.push([70, flags]);

    for (var i = 0; i < n; i++) {
      data.push([10, r(points[i][0])]);
      data.push([20, r(points[i][1])]);
      data.push([30, 0]);

      var bulge = (opts.bulges && opts.bulges[i]) ? opts.bulges[i] : 0;
      data.push([42, r(bulge)]);
    }

    this.entities.push({ type: 'LWPOLYLINE', data: data });
  };

  /**
   * Rectangle with optional corner radius (via polyline).
   */
  DxfDocument.prototype.rectangle = function (x, y, w, h, cornerRadius) {
    x = r(x); y = r(y); w = r(w); h = r(h);
    var pts;

    if (cornerRadius && cornerRadius > 0) {
      var cr = Math.min(cornerRadius, w / 2, h / 2);
      // 8 vertices for filleted rectangle (arc approximated — 2 lines per corner)
      pts = [
        [x + cr, y],           [x + w - cr, y],
        [x + w, y],            [x + w, y + cr],
        [x + w, y + h - cr],   [x + w, y + h],
        [x + w - cr, y + h],   [x + cr, y + h],
        [x, y + h],            [x, y + h - cr],
        [x, y + cr],           [x, y]
      ];
      // bulges for arc corners — bulgeVal at indices 1, 5, 7, 11
      // (arc FROM vertex i TO vertex i+1)
      var bulgeVal = Math.tan(Math.PI / 8);
      var bulges = [0, bulgeVal, 0, 0, 0, bulgeVal, 0, bulgeVal, 0, 0, 0, bulgeVal];
      this.polyline(pts, { closed: true, bulges: bulges });
    } else {
      pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      this.polyline(pts, { closed: true });
    }
  };

  /**
   * Regular polygon (n-gon) inscribed in circle.
   */
  DxfDocument.prototype.polygon = function (cx, cy, radius, sides) {
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      pts.push([cx + r(radius * Math.cos(angle)), cy + r(radius * Math.sin(angle))]);
    }
    this.polyline(pts, { closed: true });
  };

  /**
   * Slot / oblong hole: rectangle + two half-circles on ends.
   * orientation: 'h' (horizontal) or 'v' (vertical)
   */
  DxfDocument.prototype.slot = function (cx, cy, length, width, orientation) {
    var hw = width / 2;
    var hl = length / 2 - hw; // straight part half-length

    if (hl <= 0) {
      this.circle(cx, cy, hw);
      return;
    }

    // Single polyline with bulges for semicircular ends (positive = outward)
    var pts, bulges;
    if (orientation === 'v') {
      pts = [
        [cx - hw, cy - hl],  // 0: bottom-left
        [cx - hw, cy + hl],  // 1: top-left
        [cx + hw, cy + hl],  // 2: top-right
        [cx + hw, cy - hl]   // 3: bottom-right
      ];
      bulges = [1, 0, 1, 0];
    } else {
      pts = [
        [cx - hl, cy - hw],  // 0: left-bottom
        [cx + hl, cy - hw],  // 1: right-bottom
        [cx + hl, cy + hw],  // 2: right-top
        [cx - hl, cy + hw]   // 3: left-top
      ];
      bulges = [0, 1, 0, 1];
    }
    this.polyline(pts, { closed: true, bulges: bulges });
  };

  /**
   * Holes array — batch of circles (for bolt patterns etc).
   */
  DxfDocument.prototype.holes = function (positions, diameter) {
    var r = diameter / 2;
    var self = this;
    positions.forEach(function (p) {
      self.circle(p[0], p[1], r);
    });
  };

  /**
   * Bolt circle pattern.
   */
  DxfDocument.prototype.boltCircle = function (cx, cy, boltCircleDia, holeDia, count) {
    var br = boltCircleDia / 2;
    var self = this;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      self.circle(
        r(cx + br * Math.cos(angle)),
        r(cy + br * Math.sin(angle)),
        holeDia / 2
      );
    }
  };

  /**
   * Return complete DXF string (R12 minimal).
   */
  DxfDocument.prototype.toString = function () {
    var lines = [];
    // Header
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('9', '$ACADVER', '1', 'AC1009'); // R12
    lines.push('0', 'ENDSEC');

    // Tables (minimal, required by some readers)
    lines.push('0', 'SECTION', '2', 'TABLES');
    lines.push('0', 'TABLE', '2', 'LAYER', '70', '0');
    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');

    // Entities
    lines.push('0', 'SECTION', '2', 'ENTITIES');
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      lines.push('0', ent.type);
      for (var j = 0; j < ent.data.length; j++) {
        lines.push(ent.data[j][0].toString(), ent.data[j][1].toString());
      }
    }
    lines.push('0', 'ENDSEC');
    lines.push('0', 'EOF');

    return lines.join('\n');
  };

  /**
   * Trigger download in browser.
   */
  DxfDocument.prototype.download = function (filename) {
    var dxf = this.toString();
    var blob = new Blob([dxf], { type: 'application/dxf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'detail.dxf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---- Geometry utilities (exported separately) ----

  /**
   * Calculate total cut length for a set of shape params.
   * Returns length in meters.
   */
  DxfDocument.cutLength = {
    rectangleOutline: function (w, h, cornerRadius) {
      if (cornerRadius && cornerRadius > 0) {
        var cr = Math.min(cornerRadius, w / 2, h / 2);
        return 2 * (w - 2 * cr) + 2 * (h - 2 * cr) + 2 * Math.PI * cr;
      }
      return 2 * w + 2 * h;
    },

    circleOutline: function (diameter) {
      return Math.PI * diameter;
    },

    holePerimeter: function (d, count) {
      return Math.PI * d * (count || 1);
    },

    bracketOutline: function (w1, h1, w2, h2, type) {
      // Approximate: sum of all outer edges
      if (type === 'L') {
        return w1 + h1 + w2 + h2;
      } else if (type === 'P') {
        return 2 * w1 + 2 * h1 + 2 * w2;
      } else if (type === 'Z') {
        return 2 * w1 + h1 + w2 + 2 * h2;
      }
      return 2 * w1 + 2 * h1;
    }
  };

  // Export
  global.DxfDocument = DxfDocument;
})(typeof window !== 'undefined' ? window : global);
