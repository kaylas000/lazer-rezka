/**
 * Rectangle shape generator — пластины, фланцы, прокладки.
 *
 * Params:
 *   width, height (mm)       — outer dimensions
 *   cornerRadius (mm)        — corner fillet radius (0 = sharp)
 *   holes: [{cx, cy, d}]     — hole positions relative to center
 *   centerHoleDia (mm)       — central hole (0 = none)
 *   boltCircleDia, boltCount, boltHoleDia — bolt circle pattern
 */
(function (global) {
  'use strict';

  /**
   * @param {DxfDocument} doc
   * @param {object} p — shape parameters
   * @returns {object} — { cutLengthMeters: number }
   */
  function generateRectangle(doc, p) {
    var w = Number(p.width) || 100;
    var h = Number(p.height) || 100;
    var cr = Number(p.cornerRadius) || 0;

    // 1. Outer contour
    var x = -w / 2;
    var y = -h / 2;
    doc.rectangle(x, y, w, h, cr);

    // 2. Central hole
    var ch = Number(p.centerHoleDia) || 0;
    if (ch > 0) {
      doc.circle(0, 0, ch / 2);
    }

    // 3. Custom holes
    if (p.holes && p.holes.length) {
      for (var i = 0; i < p.holes.length; i++) {
        var hole = p.holes[i];
        var hx = Number(hole.cx) || 0;
        var hy = Number(hole.cy) || 0;
        var hd = Number(hole.d) || 5;
        if (hd > 0) {
          doc.circle(hx, hy, hd / 2);
        }
      }
    }

    // 4. Bolt circle pattern
    var bcDia = Number(p.boltCircleDia) || 0;
    var bcCount = Number(p.boltCount) || 0;
    var bcHoleDia = Number(p.boltHoleDia) || 5;
    if (bcDia > 0 && bcCount >= 3) {
      doc.boltCircle(0, 0, bcDia, bcHoleDia, bcCount);
    }

    // Calculate cut length
    var cutLen = DxfDocument.cutLength.rectangleOutline(w, h, cr) / 1000; // mm → m
    cutLen += DxfDocument.cutLength.holePerimeter(ch, ch > 0 ? 1 : 0) / 1000;
    cutLen += DxfDocument.cutLength.holePerimeter(bcHoleDia, bcCount * (bcDia > 0 ? 1 : 0)) / 1000;
    if (p.holes && p.holes.length) {
      for (var j = 0; j < p.holes.length; j++) {
        cutLen += DxfDocument.cutLength.holePerimeter(Number(p.holes[j].d) || 0, 1) / 1000;
      }
    }

    return { cutLengthMeters: cutLen };
  }

  global.generateRectangle = generateRectangle;
})(typeof window !== 'undefined' ? window : global);
