@echo off
REM Генератор DXF через FreeCAD
REM Использование: run.bat [plate|flange|bracket_l]
REM Параметры читаются из params.json
cd /d "%~dp0..\.."
echo exec(open('_scripts/freecad/generate_v2.py').read()) | "C:\Program Files\FreeCAD 1.0\bin\freecadcmd.exe" 2>&1 | findstr "DXF_OK Error Trace"
