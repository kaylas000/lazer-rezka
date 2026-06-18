#!/usr/bin/env python3
"""
FreeCAD DXF Generator v2 — читает JSON-файл параметров, генерирует DXF.
Вызов: freecadcmd.exe < generate_v2.py
       (параметры передаются через файл _scripts/freecad/params.json)

Форматы:
{
  "type": "plate",
  "width": 100, "height": 80, "thickness": 3,
  "holes": [{"cx":0,"cy":0,"d":10}, {"cx":30,"cy":-20,"d":6}],
  "slots": [{"cx":20,"cy":0,"len":40,"w":8,"ori":"h"}]
}
{
  "type": "flange",
  "outer": 200, "inner": 50,
  "bolts": 6, "bolt_circle": 150, "bolt_dia": 8
}
{
  "type": "bracket_l",
  "leg1": 60, "leg2": 40, "width": 30, "thickness": 4,
  "holes": [{"cx":-2,"cy":20,"d":6}, {"cx":30,"cy":-2,"d":6}]
}
"""
import FreeCAD, Part, importDXF, os, sys, json, math
from FreeCAD import Base

# Определяем корень проекта относительно CWD
CWD = os.getcwd()
PROJECT_ROOT = CWD
while not os.path.exists(os.path.join(PROJECT_ROOT, '_config.yml')) and PROJECT_ROOT != os.path.dirname(PROJECT_ROOT):
    PROJECT_ROOT = os.path.dirname(PROJECT_ROOT)

SCRIPT_DIR = os.path.join(PROJECT_ROOT, '_scripts', 'freecad')
PARAMS_FILE = os.path.join(SCRIPT_DIR, 'params.json')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, '_site', 'assets', 'files')

def load_params():
    if os.path.exists(PARAMS_FILE):
        with open(PARAMS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    print('NO_PARAMS')
    sys.exit(1)

def make_hole(shape, cx, cy, d):
    c = Part.Circle(Base.Vector(cx, cy, 0), Base.Vector(0, 0, 1), d/2)
    face = Part.Face(Part.Wire(c.toShape()))
    return shape.cut(face)

def make_slot(shape, cx, cy, length, width, ori):
    hw = width / 2
    hl = length / 2 - hw
    if hl <= 0:
        return make_hole(shape, cx, cy, width)

    if ori == 'v':
        rect = Part.makePlane(width, length - width, Base.Vector(cx - hw, cy - hl, 0), Base.Vector(0, 0, 1))
        c1 = Part.Circle(Base.Vector(cx, cy + hl, 0), Base.Vector(0, 0, 1), hw)
        c2 = Part.Circle(Base.Vector(cx, cy - hl, 0), Base.Vector(0, 0, 1), hw)
    else:
        rect = Part.makePlane(length - width, width, Base.Vector(cx - hl, cy - hw, 0), Base.Vector(0, 0, 1))
        c1 = Part.Circle(Base.Vector(cx + hl, cy, 0), Base.Vector(0, 0, 1), hw)
        c2 = Part.Circle(Base.Vector(cx - hl, cy, 0), Base.Vector(0, 0, 1), hw)

    face = Part.Face(Part.Wire(c1.toShape()))
    face = face.fuse(Part.Face(Part.Wire(c2.toShape())))
    slot = rect.fuse(face)
    return shape.cut(slot)

def make_plate(p):
    w, h = p.get('width', 100), p.get('height', 80)
    shape = Part.makePlane(w, h, Base.Vector(-w/2, -h/2, 0), Base.Vector(0, 0, 1))

    for hole in p.get('holes', []):
        shape = make_hole(shape, hole['cx'], hole['cy'], hole['d'])

    for slot in p.get('slots', []):
        shape = make_slot(shape, slot['cx'], slot['cy'], slot['len'], slot['w'], slot.get('ori', 'h'))

    return shape

def make_flange(p):
    outer, inner = p.get('outer', 200), p.get('inner', 0)
    oc = Part.Circle(Base.Vector(0, 0, 0), Base.Vector(0, 0, 1), outer/2)
    shape = Part.Face(Part.Wire(oc.toShape()))

    if inner > 0:
        ic = Part.Circle(Base.Vector(0, 0, 0), Base.Vector(0, 0, 1), inner/2)
        shape = shape.cut(Part.Face(Part.Wire(ic.toShape())))

    bolts = p.get('bolts', 0)
    bc = p.get('bolt_circle', 0)
    bd = p.get('bolt_dia', 6)
    for i in range(bolts):
        if bc > 0:
            a = 2 * math.pi * i / bolts
            bx, by = bc/2 * math.cos(a), bc/2 * math.sin(a)
            shape = make_hole(shape, bx, by, bd)

    for hole in p.get('holes', []):
        shape = make_hole(shape, hole['cx'], hole['cy'], hole['d'])

    return shape

def make_bracket_l(p):
    l1, l2 = p.get('leg1', 60), p.get('leg2', 40)
    t = p.get('thickness', 4)
    w = p.get('width', 30)

    # L-образный контур
    from FreeCAD import Part as P
    pts = [
        Base.Vector(-t, l2 + t, 0),
        Base.Vector(l1 + t, l2 + t, 0),
        Base.Vector(l1 + t, -t, 0),
        Base.Vector(0, -t, 0),
        Base.Vector(0, 0, 0),
        Base.Vector(-t, 0, 0),
    ]
    wire = P.makePolygon(pts + [pts[0]])
    shape = Part.Face(wire)

    for hole in p.get('holes', []):
        shape = make_hole(shape, hole['cx'], hole['cy'], hole['d'])

    return shape

def main():
    params = load_params()
    ptype = params.get('type', 'plate')

    doc = FreeCAD.newDocument('GenPart')

    if ptype == 'plate':
        shape = make_plate(params)
    elif ptype == 'flange':
        shape = make_flange(params)
    elif ptype == 'bracket_l':
        shape = make_bracket_l(params)
    else:
        print(f'UNKNOWN_TYPE:{ptype}')
        sys.exit(1)

    obj = doc.addObject('Part::Feature', ptype.title())
    obj.Shape = shape
    doc.recompute()

    fname = params.get('output', f'{ptype}_{params.get("width",params.get("outer","part"))}.dxf')
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, fname)

    importDXF.export(doc.Objects, filepath)

    # Подсчёт длины реза
    edges = shape.Edges
    cut_len_mm = sum(e.Length for e in edges) / 2  # делим на 2 т.к. каждая кромка учтена дважды
    cut_len_m = round(cut_len_mm / 1000, 3)

    print(f'DXF_OK:{filepath}:{cut_len_m}')
    FreeCAD.closeDocument('GenPart')


if __name__ == '__main__':
    main()
