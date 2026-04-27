#!/usr/bin/env python3
"""Fail CI if prohibited Unicode (bidi / zero-width / NB hyphen) appears in tracked text files."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Extensions to scan (tracked files only).
TEXT_SUFFIXES = (
    ".md",
    ".html",
    ".yml",
    ".yaml",
    ".js",
    ".css",
    ".txt",
    ".xml",
    ".liquid",
    ".rb",
    ".scss",
    ".svg",
)


def forbidden_codepoints() -> set[int]:
    out: set[int] = set()
    # U+200E–U+200F (direction marks)
    out.update(range(0x200E, 0x2010))
    # U+202A–U+202E (bidi embedding / override)
    out.update(range(0x202A, 0x202F))
    # U+2066–U+2069 (isolate controls)
    out.update(range(0x2066, 0x206A))
    for o in (0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF):
        out.add(o)
    # Non-breaking hyphen (often triggers "hidden unicode" reviews)
    out.add(0x2011)
    return out


FORBIDDEN = forbidden_codepoints()

LABELS: dict[int, str] = {
    0x200B: "ZERO WIDTH SPACE",
    0x200C: "ZERO WIDTH NON-JOINER",
    0x200D: "ZERO WIDTH JOINER",
    0x200E: "LEFT-TO-RIGHT MARK",
    0x200F: "RIGHT-TO-LEFT MARK",
    0x202A: "LRE",
    0x202B: "RLE",
    0x202C: "PDF",
    0x202D: "LRO",
    0x202E: "RLO",
    0x2060: "WORD JOINER",
    0x2066: "LRI",
    0x2067: "RLI",
    0x2068: "FSI",
    0x2069: "PDI",
    0xFEFF: "BOM/ZWNBSP",
    0x2011: "NON-BREAKING HYPHEN",
}


def tracked_text_files() -> list[Path]:
    raw = subprocess.check_output(
        ["git", "-c", "core.quotepath=false", "ls-files", "-z"],
        cwd=REPO_ROOT,
    )
    paths: list[Path] = []
    for rel in raw.split(b"\0"):
        if not rel:
            continue
        p = REPO_ROOT / rel.decode("utf-8")
        if not p.is_file():
            continue
        if p.suffix.lower() in TEXT_SUFFIXES:
            paths.append(p)
    return sorted(paths)


def scan_file(path: Path) -> list[tuple[int, int, str]]:
    """Return list of (line, col, description)."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return [(1, 0, "file is not valid UTF-8")]
    issues: list[tuple[int, int, str]] = []
    line_start = 0
    line_no = 1
    for i, ch in enumerate(text):
        if ch == "\n":
            line_start = i + 1
            line_no += 1
            continue
        o = ord(ch)
        if o in FORBIDDEN:
            col = i - line_start + 1
            name = LABELS.get(o, f"U+{o:04X}")
            issues.append((line_no, col, f"{name} (U+{o:04X})"))
    return issues


def main() -> int:
    bad = False
    for path in tracked_text_files():
        rel = path.relative_to(REPO_ROOT)
        issues = scan_file(path)
        if not issues:
            continue
        bad = True
        for line_no, col, desc in issues:
            print(f"{rel}:{line_no}:{col}: prohibited character: {desc}", file=sys.stderr)
    if bad:
        print(
            "Prohibited Unicode found (bidi / zero-width / BOM / U+2011). "
            "Use ASCII hyphen in compound words; em dash U+2014 and guillemets are OK.",
            file=sys.stderr,
        )
        return 1
    print("OK: no prohibited bidi/zero-width/U+2011 characters in scanned text files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
