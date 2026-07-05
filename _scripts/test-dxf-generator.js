/**
 * Quick DXF validation test — Node.js.
 * Run: node _scripts/test-dxf-generator.js
 */
'use strict';

// Load core and shapes (UMD — exports to global)
require('../assets/js/dxf-generator/core.js');
require('../assets/js/dxf-generator/shapes/rectangle.js');
require('../assets/js/dxf-generator/shapes/circle.js');
require('../assets/js/dxf-generator/shapes/bracket.js');

var errors = [];
var passed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { errors.push(msg); }
}

function validateDxf(dxfStr, label) {
  var lines = dxfStr.split('\n');

  // Must start with 0, SECTION
  assert(lines[0] === '0', label + ': first line must be 0');
  assert(lines[1] === 'SECTION', label + ': must start with SECTION');

  // Must have ENTITIES section
  var hasEntities = lines.some(function (l, i) {
    return l === 'SECTION' && lines[i + 1] === '2' && lines[i + 2] === 'ENTITIES';
  });
  assert(hasEntities, label + ': must have ENTITIES section');

  // Must end with EOF
  assert(lines[lines.length - 1] === 'EOF', label + ': must end with EOF');

  // Must have even number of lines (code-value pairs)
  assert(lines.length % 2 === 0, label + ': must have even line count (got ' + lines.length + ')');

  // Count entities
  var entityCount = 0;
  for (var i = 0; i < lines.length; i++) {
    var code = parseInt(lines[i]);
    var val = lines[i + 1];
    // Entity types appear at group code 0
    if (code === 0 && ['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE'].indexOf(val) >= 0) {
      entityCount++;
    }
  }
  assert(entityCount > 0, label + ': must have at least 1 entity (got ' + entityCount + ')');

  return entityCount;
}

// ===== TEST 1: Rectangle plate =====
console.log('--- Test 1: Rectangle plate ---');
var doc1 = new DxfDocument();
var r1 = generateRectangle(doc1, {
  width: 100, height: 80, cornerRadius: 5,
  centerHoleDia: 10,
  boltCircleDia: 60, boltCount: 4, boltHoleDia: 6
});
var dxf1 = doc1.toString();
var n1 = validateDxf(dxf1, 'Rectangle');
console.log('  Entities: ' + n1 + ', Cut length: ' + r1.cutLengthMeters.toFixed(3) + ' m');
assert(r1.cutLengthMeters > 0, 'Rectangle: cut length must be > 0');

// ===== TEST 2: Circle flange =====
console.log('--- Test 2: Circle flange ---');
var doc2 = new DxfDocument();
var r2 = generateCircle(doc2, {
  outerDia: 200, innerDia: 50,
  boltCircleDia: 150, boltCount: 6, boltHoleDia: 8
});
var dxf2 = doc2.toString();
var n2 = validateDxf(dxf2, 'Circle');
console.log('  Entities: ' + n2 + ', Cut length: ' + r2.cutLengthMeters.toFixed(3) + ' m');
assert(n2 >= 8, 'Circle: should have outer + inner + 6 bolt holes (8 entities)');

// ===== TEST 3: L-bracket =====
console.log('--- Test 3: L-bracket ---');
var doc3 = new DxfDocument();
var r3 = generateBracket(doc3, {
  type: 'L', leg1: 60, leg2: 40, width: 30, thickness: 4
});
var dxf3 = doc3.toString();
var n3 = validateDxf(dxf3, 'L-bracket');
console.log('  Entities: ' + n3 + ', Cut length: ' + r3.cutLengthMeters.toFixed(3) + ' m');
assert(n3 >= 1, 'L-bracket: must have at least outline');

// ===== TEST 4: P-bracket =====
console.log('--- Test 4: P-bracket ---');
var doc4 = new DxfDocument();
var r4 = generateBracket(doc4, {
  type: 'P', width: 80, height: 50, flange1: 20, flange2: 20, thickness: 3
});
var dxf4 = doc4.toString();
var n4 = validateDxf(dxf4, 'P-bracket');
console.log('  Entities: ' + n4 + ', Cut length: ' + r4.cutLengthMeters.toFixed(3) + ' m');
assert(n4 >= 1, 'P-bracket: must have at least outline');

// ===== TEST 5: Z-bracket =====
console.log('--- Test 5: Z-bracket ---');
var doc5 = new DxfDocument();
var r5 = generateBracket(doc5, {
  type: 'Z', width: 60, height: 45, topFlange: 15, bottomFlange: 15, thickness: 3
});
var dxf5 = doc5.toString();
var n5 = validateDxf(dxf5, 'Z-bracket');
console.log('  Entities: ' + n5 + ', Cut length: ' + r5.cutLengthMeters.toFixed(3) + ' m');
assert(n5 >= 1, 'Z-bracket: must have at least outline');

// ===== TEST 5b: Rectangle corners as LINE+ARC =====
console.log('--- Test 5b: Rectangle rounded corners (LINE+ARC) ---');
var docBulge = new DxfDocument();
generateRectangle(docBulge, {
  width: 200, height: 100, cornerRadius: 15,
  centerHoleDia: 0, boltCircleDia: 0, boltCount: 0, boltHoleDia: 0
});
var dxfBulge = docBulge.toString();
var bulgeLines = dxfBulge.split('\n');

// Count LINE and ARC entities
var lineCount = 0, arcCount = 0;
for (var b = 0; b < bulgeLines.length; b++) {
  if (bulgeLines[b] === 'LINE' && bulgeLines[b - 1] === '0') lineCount++;
  if (bulgeLines[b] === 'ARC' && bulgeLines[b - 1] === '0') arcCount++;
}
assert(lineCount === 4, 'Rounded rect: must have 4 LINE entities (got ' + lineCount + ')');
assert(arcCount === 4, 'Rounded rect: must have 4 ARC entities (got ' + arcCount + ')');
console.log('  Lines: ' + lineCount + ', Arcs: ' + arcCount);

// ===== TEST 6: Edge cases =====
console.log('--- Test 6: Edge cases ---');
var doc6 = new DxfDocument();
// Empty document
assert(doc6.toString().indexOf('EOF') > 0, 'Empty doc: must still produce valid DXF');
// Zero-dimension rectangle
generateRectangle(doc6, { width: 0, height: 0, cornerRadius: 0, centerHoleDia: 0 });
var dxf6 = doc6.toString();
var n6 = validateDxf(dxf6, 'Zero rect');
console.log('  Entities: ' + n6);

// ===== TEST 7: Bolt circle =====
console.log('--- Test 7: Bolt circle pattern ---');
var doc7 = new DxfDocument();
doc7.boltCircle(0, 0, 100, 8, 8);
var dxf7 = doc7.toString();
var n7 = validateDxf(dxf7, 'Bolt circle');
console.log('  Entities: ' + n7);
assert(n7 === 8, 'Bolt circle: 8 holes = 8 circle entities');

// ===== TEST 8: Slot =====
console.log('--- Test 8: Slot ---');
var doc8 = new DxfDocument();
doc8.slot(0, 0, 50, 10, 'h');
var dxf8 = doc8.toString();
var n8 = validateDxf(dxf8, 'Slot');
console.log('  Entities: ' + n8);
assert(n8 >= 1, 'Slot: must have at least 1 entity');

// ===== RESULTS =====
console.log('\n' + '='.repeat(50));
console.log('Passed: ' + passed + '/' + (passed + errors.length));
if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(function (e) { console.log('  FAIL: ' + e); });
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}

// Save sample DXF for inspection
var fs = require('fs');
var path = require('path');
var outDir = path.join(__dirname, '..', '_site', 'assets', 'files');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'sample-rectangle.dxf'), dxf1, 'utf-8');
fs.writeFileSync(path.join(outDir, 'sample-flange.dxf'), dxf2, 'utf-8');
fs.writeFileSync(path.join(outDir, 'sample-l-bracket.dxf'), dxf3, 'utf-8');
console.log('\nSample DXF files saved to _site/assets/files/');
