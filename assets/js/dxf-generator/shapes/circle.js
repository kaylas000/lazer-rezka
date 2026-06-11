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

    // 3. Bolt circle pattern
    var bcDia = Number(p.boltCircleDia) || 0;
    var bcCount = Number(p.boltCount) || 0;
    var bcHoleDia = Number(p.boltHoleDia) || 0;
    if (bcDia > 0 && bcCount >= 3 && bcHoleDia > 0) {
      doc.boltCircle(0, 0, bcDia, bcHoleDia, bcCount);
    }

    // 4. Extra holes at specific angles
    if (p.extraHoles && p.extraHoles.length) {
      for (var i = 0; i < p.extraHoles.length; i++) {
        var h = p.extraHoles[i];
        var dist = Number(h.dist) || 0;
        var angleDeg = Number(h.angle) || 0;
        var dia = Number(h.d) || 5;
        if (dia > 0) {
          var angleRad = (angleDeg - 90) * Math.PI / 180; // 0° = top
          var hx = dist * Math.cos(angleRad);
          var hy = dist * Math.sin(angleRad);
          doc.circle(hx, hy, dia / 2);
        }
      }
    }

    // Calculate cut length
    var cutLen = DxfDocument.cutLength.circleOutline(outerD) / 1000;
    if (innerD > 0) cutLen += DxfDocument.cutLength.circleOutline(innerD) / 1000;
    cutLen += DxfDocument.cutLength.holePerimeter(bcHoleDia, bcCount * (bcDia > 0 ? 1 : 0)) / 1000;
    if (p.extraHoles && p.extraHoles.length) {
      for (var j = 0; j < p.extraHoles.length; j++) {
        cutLen += DxfDocument.cutLength.holePerimeter(Number(p.extraHoles[j].d) || 0, 1) / 1000;
      }
    }

    return { cutLengthMeters: cutLen };
  }

  global.generateCircle = generateCircle;
})(typeof window !== 'undefined' ? window : global);
