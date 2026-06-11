/**
 * Circle shape generator — фланцы, кольца, диски.
 *
 * Params:
 *   outerDia (mm)            — outer diameter
 *   innerDia (mm)            — inner hole diameter (0 = solid disk)
 *   boltCircleDia, boltCount, boltHoleDia — bolt circle pattern
 *   extraHoles: [{angle, d, dist}] — additional holes at angle/dist from center
 */
(function (global) {
  'use strict';

  function generateCircle(doc, p) {
    var outerD = Number(p.outerDia) || 100;
    var innerD = Number(p.innerDia) || 0;

    // 1. Outer circle
    doc.circle(0, 0, outerD / 2);

    // 2. Inner hole (ring)
    if (innerD > 0 && innerD < outerD) {
      doc.circle(0, 0, innerD / 2);
    }

    // 3. Bolt circle pattern (programmatic use, not exposed in UI)
    var bcDia = Number(p.boltCircleDia) || 0;
    var bcCount = Number(p.boltCount) || 0;
    var bcHoleDia = Number(p.boltHoleDia) || 0;
    if (bcDia > 0 && bcCount >= 3 && bcHoleDia > 0) {
      doc.boltCircle(0, 0, bcDia, bcHoleDia, bcCount);
    }

    // 4. Holes from visual editor — each with its own cx, cy, d
    if (p.holes && p.holes.length) {
      for (var i = 0; i < p.holes.length; i++) {
        var h = p.holes[i];
        var hd = Number(h.d) || 5;
        if (hd > 0) {
          doc.circle(Number(h.cx) || 0, Number(h.cy) || 0, hd / 2);
        }
      }
    }

    // Calculate cut length
    var cutLen = DxfDocument.cutLength.circleOutline(outerD) / 1000;
    if (innerD > 0) cutLen += DxfDocument.cutLength.circleOutline(innerD) / 1000;
    cutLen += DxfDocument.cutLength.holePerimeter(bcHoleDia, bcCount * (bcDia > 0 ? 1 : 0)) / 1000;
    if (p.holes && p.holes.length) {
      for (var j = 0; j < p.holes.length; j++) {
        cutLen += DxfDocument.cutLength.holePerimeter(Number(p.holes[j].d) || 0, 1) / 1000;
      }
    }

    return { cutLengthMeters: cutLen };
  }

  global.generateCircle = generateCircle;
})(typeof window !== 'undefined' ? window : global);
