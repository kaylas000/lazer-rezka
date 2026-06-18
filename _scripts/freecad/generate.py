#!/usr/bin/env python3
"""
FreeCAD DXF Generator — параметрические чертежи для лазерной резки.
Использование:
  "C:/Program Files/FreeCAD 1.0/bin/freecadcmd.exe" _scripts/freecad/generate.py [тип] [параметры]

Примеры:
  # Пластина 100x80 мм, толщина 3 мм, отверстие 10 мм по центру
  freecadcmd.exe generate.py plate --width 100 --height 80 --thickness 3 --hole 0,0,10

  # Фланец диаметр 200 мм, центральное отв. 50 мм, 6 болтовых отверстий
  freecadcmd.exe generate.py flange --outer 200 --inner 50 --bolts 6 --bolt-dia 8 --bolt-circle 150

  # Прямоугольник с пазом
  freecadcmd.exe generate.py plate --width 150 --height 100 --slot 30,0,50,8,h

Выход: DXF-файл в _site/assets/files/
"""

import sys
import os
import json
import math
import argparse

# FreeCAD импорты (работают только внутри freecadcmd)
import FreeCAD
import Part
import Sketcher
import importDXF
from FreeCAD import Base

FREECAD = FreeCAD

def mm(v):
    return float(v)


def create_plate(doc, params):
    """Прямоугольная пластина с отверстиями и пазами."""
    w = mm(params.get('width', 100))
    h = mm(params.get('height', 80))
    t = mm(params.get('thickness', 3))
    r = mm(params.get('radius', 0))  # corner radius

    # Создаём эскиз на плоскости XY
    sketch = doc.addObject('Sketcher::SketchObject', 'PlateSketch')
    sketch.Placement = FreeCAD.Placement(
        FreeCAD.Vector(0, 0, 0),
        FreeCAD.Rotation(0, 0, 0, 1)
    )

    # Прямоугольник от центра
    x0, y0 = -w/2, -h/2
    x1, y1 = w/2, h/2

    if r > 0:
        # Прямоугольник со скруглёнными углами
        sketch.addGeometry(Part.makeLine(
            FreeCAD.Vector(x0 + r, y0, 0),
            FreeCAD.Vector(x1 - r, y0, 0)
        ), False)
        sketch.addGeometry(Part.makeLine(
            FreeCAD.Vector(x1 - r, y0, 0),
            FreeCAD.Vector(x1, y0 + r, 0)
        ), False)
        # ... упрощённо: используем прямоугольник + филе
        # В реальности сложнее, используем Part.makePlane + makeFillet
    else:
        # Простой прямоугольник
        lines = [
            Part.makeLine(FreeCAD.Vector(x0, y0, 0), FreeCAD.Vector(x1, y0, 0)),
            Part.makeLine(FreeCAD.Vector(x1, y0, 0), FreeCAD.Vector(x1, y1, 0)),
            Part.makeLine(FreeCAD.Vector(x1, y1, 0), FreeCAD.Vector(x0, y1, 0)),
            Part.makeLine(FreeCAD.Vector(x0, y1, 0), FreeCAD.Vector(x0, y0, 0)),
        ]
        for line in lines:
            sketch.addGeometry(line, False)

    doc.recompute()

    # Отверстия — вырезаем через Part::Cut
    # Создаём базовую пластину
    plate_shape = Part.makePlane(w, h, FreeCAD.Vector(-w/2, -h/2, 0), FreeCAD.Vector(0, 0, 1))
    plate_obj = doc.addObject('Part::Feature', 'Plate')
    plate_obj.Shape = plate_shape

    # Отверстия — круги
    holes = params.get('holes', [])
    if isinstance(holes, str):
        holes = [h.split(',') for h in holes.split(';') if h.strip()]
        holes = [{'cx': float(h[0]), 'cy': float(h[1]), 'd': float(h[2])} for h in holes if len(h) >= 3]

    for i, hole in enumerate(holes):
        cx = mm(hole.get('cx', 0))
        cy = mm(hole.get('cy', 0))
        d = mm(hole.get('d', 6))
        hole_circle = Part.Circle(FreeCAD.Vector(cx, cy, 0), FreeCAD.Vector(0, 0, 1), d/2)
        hole_shape = Part.Face(Part.Wire(hole_circle.toShape()))
        # Вырез через булеву операцию
        plate_shape = plate_shape.cut(hole_shape)

    # Пазы
    slots = params.get('slots', [])
    if isinstance(slots, str):
        slots = [s.split(',') for s in slots.split(';') if s.strip()]
        slots = [{'cx': float(s[0]), 'cy': float(s[1]), 'len': float(s[2]), 'w': float(s[3]), 'ori': s[4]} for s in slots if len(s) >= 5]

    for slot in slots:
        cx = mm(slot.get('cx', 0))
        cy = mm(slot.get('cy', 0))
        sl = mm(slot.get('len', 30))
        sw = mm(slot.get('w', 6))
        so = slot.get('ori', 'h')
        hw = sw / 2
        hl = sl / 2 - hw

        # Прямоугольник + два полукруга = паз
        if so == 'v':
            rect = Part.makePlane(sw, sl - sw,
                FreeCAD.Vector(cx - hw, cy - hl, 0),
                FreeCAD.Vector(0, 0, 1))
            circ1 = Part.Circle(FreeCAD.Vector(cx, cy + hl, 0), FreeCAD.Vector(0, 0, 1), hw)
            circ2 = Part.Circle(FreeCAD.Vector(cx, cy - hl, 0), FreeCAD.Vector(0, 0, 1), hw)
        else:
            rect = Part.makePlane(sl - sw, sw,
                FreeCAD.Vector(cx - hl, cy - hw, 0),
                FreeCAD.Vector(0, 0, 1))
            circ1 = Part.Circle(FreeCAD.Vector(cx + hl, cy, 0), FreeCAD.Vector(0, 0, 1), hw)
            circ2 = Part.Circle(FreeCAD.Vector(cx - hl, cy, 0), FreeCAD.Vector(0, 0, 1), hw)

        slot_face = rect.fuse(Part.Face(Part.Wire(circ1.toShape())))
        slot_face = slot_face.fuse(Part.Face(Part.Wire(circ2.toShape())))
        plate_shape = plate_shape.cut(slot_face)

    plate_obj.Shape = plate_shape
    doc.recompute()
    return plate_obj


def create_flange(doc, params):
    """Круглый фланец с отверстиями."""
    outer = mm(params.get('outer', 200))
    inner = mm(params.get('inner', 0))
    t = mm(params.get('thickness', 3))

    # Внешний круг
    outer_circle = Part.Circle(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), outer/2)
    flange_face = Part.Face(Part.Wire(outer_circle.toShape()))

    # Внутреннее отверстие
    if inner > 0:
        inner_circle = Part.Circle(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), inner/2)
        inner_face = Part.Face(Part.Wire(inner_circle.toShape()))
        flange_face = flange_face.cut(inner_face)

    # Болтовые отверстия
    bolts = int(params.get('bolts', 0))
    bc_dia = mm(params.get('bolt_circle', 0))
    bolt_dia = mm(params.get('bolt_dia', 6))

    if bolts > 0 and bc_dia > 0:
        for i in range(bolts):
            angle = 2 * math.pi * i / bolts
            bx = (bc_dia / 2) * math.cos(angle)
            by = (bc_dia / 2) * math.sin(angle)
            bolt_circle = Part.Circle(
                FreeCAD.Vector(bx, by, 0),
                FreeCAD.Vector(0, 0, 1),
                bolt_dia / 2
            )
            bolt_face = Part.Face(Part.Wire(bolt_circle.toShape()))
            flange_face = flange_face.cut(bolt_face)

    flange_obj = doc.addObject('Part::Feature', 'Flange')
    flange_obj.Shape = flange_face
    doc.recompute()
    return flange_obj


def export_dxf(doc, filename):
    """Экспорт в DXF."""
    import importDXF
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '_site', 'assets', 'files')
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)

    importDXF.export(doc.Objects, filepath)
    return filepath


def main():
    parser = argparse.ArgumentParser(description='FreeCAD DXF Generator')
    parser.add_argument('type', choices=['plate', 'flange'], help='Тип детали')
    parser.add_argument('--params', type=str, default='{}', help='JSON с параметрами')
    parser.add_argument('--output', type=str, default='generated.dxf', help='Имя выходного файла')

    args = parser.parse_args()
    params = json.loads(args.params)

    doc = FreeCAD.newDocument('Generated')

    if args.type == 'plate':
        create_plate(doc, params)
    elif args.type == 'flange':
        create_flange(doc, params)

    filepath = export_dxf(doc, args.output)
    print(f'DXF_READY:{filepath}')
    FreeCAD.closeDocument('Generated')


if __name__ == '__main__':
    main()
