/**
 * Bracket shape generator — кронштейны (Г, П, Z-образные).
 *
 * Params:
 *   type: 'L' | 'P' | 'Z'
 *   All dimensions in mm.
 *
 *   L-bracket:
 *     leg1, leg2       — leg lengths
 *     width            — bracket width
 *     thickness        — material thickness (for inner cutout)
 *     holes: [{cx, cy, d}] — mounting holes
 *
 *   P-bracket (channel):
 *     width, height    — outer width & height
 *     flange1, flange2 — top & bottom flange lengths
 *     thickness        — material thickness
 *     holes: [...]
 *
 *   Z-bracket:
 *     width, height    — dimensions
 *     topFlange, bottomFlange
 *     thickness
 *     holes: [...]
 */
(function (global) {
  'use strict';

  function generateBracket(doc, p) {
    var type = p.type || 'L';

    if (type === 'L') {
      return buildLBracket(doc, p);
    } else if (type === 'P') {
      return buildPBracket(doc, p);
    } else if (type === 'Z') {
      return buildZBracket(doc, p);
    }
    return { cutLengthMeters: 0 };
  }

  /**
   * L-bracket: two legs, 90° angle.
   * Drawn with origin at the inner corner.
   */
  function buildLBracket(doc, p) {
    var leg1 = Number(p.leg1) || 50;    // horizontal leg length
    var leg2 = Number(p.leg2) || 50;    // vertical leg length
    var w = Number(p.width) || 30;      // bracket width
    var t = Number(p.thickness) || 3;   // material thickness

    // Outer contour — clockwise from origin (inner corner)
    var pts = [
      [-t, 0],               // inner corner left
      [-t, leg2 + t],        // top-left outer
      [0, leg2 + t],         // top-right outer
      [leg1 + t, leg2 + t],  // far-top-right
      [leg1 + t, 0],         // far-bottom-right
      [leg1 + t, -t],        // far-bottom-inner
      [0, -t],               // bottom-left inner
      [0, 0]                 // back to inner corner
    ];

    // But we need to also cut the inner corner (the L shape):
    var outerPts = [
      [-t, leg2 + t],        // start top-left
      [leg1 + t, leg2 + t],  // top-right corner
      [leg1 + t, -t],        // bottom-right
      [0, -t],               // bottom-inner corner
      [0, 0],                // inner corner
      [-t, 0],               // inner-right
      [-t, leg2 + t]         // back to start
    ];

    doc.polyline(outerPts, { closed: true });

    // Mounting holes
    if (p.holes && p.holes.length) {
      for (var i = 0; i < p.holes.length; i++) {
        var h = p.holes[i];
        var hd = Number(h.d) || 5;
        if (hd > 0) {
          doc.circle(Number(h.cx) || 0, Number(h.cy) || 0, hd / 2);
        }
      }
    }

    // Default holes if none specified: centered on each leg
    if (!p.holes || p.holes.length === 0) {
      var holeDia = 6;
      var halfW = w / 2;
      // Hole on vertical leg
      var vx = -t / 2;
      var vy = leg2 / 2;
      doc.circle(vx, vy, holeDia / 2);
      // Hole on horizontal leg
      var hx = leg1 / 2;
      var hy = -t / 2;
      doc.circle(hx, hy, holeDia / 2);
    }

    var cutLen = (leg1 + t + Math.abs(-t) + leg2 + t + Math.abs(-t) + w + Math.abs(w)) / 1000;
    return { cutLengthMeters: cutLen };
  }

  /**
   * P-bracket (channel / П-образный).
   */
  function buildPBracket(doc, p) {
    var w = Number(p.width) || 60;       // total width
    var h = Number(p.height) || 40;      // total height
    var flange1 = Number(p.flange1) || 15; // top flange
    var flange2 = Number(p.flange2) || 15; // bottom flange
    var t = Number(p.thickness) || 3;

    // Outer contour
    var x0 = -w / 2;
    var pts = [
      [x0, 0],                  // bottom-left outer
      [x0, h],                  // top-left outer
      [x0 + flange1, h],        // top-left flange tip
      [x0 + flange1, h - t],    // top-left flange inner
      [x0 + t, h - t],          // top-left inner corner
      [x0 + t, t],              // bottom-left inner corner
      [x0 + flange2, t],        // bottom-left flange inner
      [x0 + flange2, 0],        // bottom-left flange tip
      [x0 + w - flange2, 0],    // bottom-right flange tip
      [x0 + w - flange2, t],    // bottom-right flange inner
      [x0 + w - t, t],          // bottom-right inner corner
      [x0 + w - t, h - t],      // top-right inner corner
      [x0 + w - flange1, h - t],// top-right flange inner
      [x0 + w - flange1, h],    // top-right flange tip
      [x0 + w, h],              // top-right outer
      [x0 + w, 0]               // bottom-right outer
    ];
    doc.polyline(pts, { closed: true });

    // Mounting holes on flanges
    if (p.holes && p.holes.length) {
      for (var i = 0; i < p.holes.length; i++) {
        var h = p.holes[i];
        var hd = Number(h.d) || 5;
        if (hd > 0) {
          doc.circle(Number(h.cx) || 0, Number(h.cy) || 0, hd / 2);
        }
      }
    } else {
      // Default holes
      var holeD = 6;
      var cx = (x0 + flange1 / 2) + (w - flange1 - flange2) / 4;
      doc.circle(x0 + flange1 / 2, h - t / 2, holeD / 2);
      doc.circle(x0 + w - flange2 / 2, t / 2, holeD / 2);
    }

    var perim = 2 * w + 2 * h + 2 * flange1 + 2 * flange2;
    return { cutLengthMeters: perim / 1000 };
  }

  /**
   * Z-bracket.
   */
  function buildZBracket(doc, p) {
    var w = Number(p.width) || 50;
    var h = Number(p.height) || 40;
    var topFlange = Number(p.topFlange) || 15;
    var bottomFlange = Number(p.bottomFlange) || 15;
    var t = Number(p.thickness) || 3;

    var pts = [
      [0, h],                        // top-left outer
      [topFlange, h],                // top-left tip
      [topFlange, h - t],            // top-left inner
      [w, h - t],                    // top-right inner
      [w, 0],                        // top-right outer
      [w - bottomFlange, 0],         // bottom-right tip
      [w - bottomFlange, t],         // bottom-right inner
      [0, t]                         // bottom-left inner
    ];
    doc.polyline(pts, { closed: true });

    // Default holes
    if (p.holes && p.holes.length) {
      for (var i = 0; i < p.holes.length; i++) {
        var h = p.holes[i];
        var hd = Number(h.d) || 5;
        if (hd > 0) {
          doc.circle(Number(h.cx) || 0, Number(h.cy) || 0, hd / 2);
        }
      }
    } else {
      doc.circle(topFlange / 2, h - t / 2, 3);
      doc.circle(w - bottomFlange / 2, t / 2, 3);
    }

    var perim = 2 * w + 2 * h + topFlange + bottomFlange;
    return { cutLengthMeters: perim / 1000 };
  }

  global.generateBracket = generateBracket;
})(typeof window !== 'undefined' ? window : global);
