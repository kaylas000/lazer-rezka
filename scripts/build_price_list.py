#!/usr/bin/env python3
"""
Generate price-list PDF from _data/business.yml (NAP) and _data/prices.yml (tables).

Default output: assets/files/price-list.pdf (repo root).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml
from fpdf import FPDF

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BUSINESS = REPO_ROOT / "_data" / "business.yml"
DEFAULT_PRICES = REPO_ROOT / "_data" / "prices.yml"
DEFAULT_OUTPUT = REPO_ROOT / "assets" / "files" / "price-list.pdf"
FONT_REGULAR = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
FONT_BOLD = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")


def tel_uri(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    if not digits:
        raise ValueError("phone has no digits")
    return "tel:+" + digits


def thickness_prices(node: dict) -> dict[int, int]:
    out: dict[int, int] = {}
    mm = (node or {}).get("thickness_mm") or {}
    for k, v in mm.items():
        out[int(k)] = int(v)
    return out


def band_price_range(laser_key: str, from_mm: int, to_mm: int, laser_root: dict) -> tuple[int, int]:
    price_map = thickness_prices(laser_root[laser_key])
    vals = [price_map[t] for t in range(from_mm, to_mm + 1) if t in price_map]
    if not vals:
        raise ValueError(f"No prices for {laser_key} in {from_mm}-{to_mm}")
    return min(vals), max(vals)


def format_band(min_p: int, max_p: int) -> str:
    return str(min_p) if min_p == max_p else f"{min_p}-{max_p}"


def build_laser_rows(prices: dict) -> list[list[str]]:
    acc = prices.get("accuracy", {}).get("laser_table", "±0.01 мм")
    laser_root = prices["laser"]
    rows: list[list[str]] = []
    for tbl in prices["calculator_laser_tables"]:
        lk = tbl["laser_key"]
        label = tbl["material_label"]
        for band in tbl["bands"]:
            lo, hi = int(band["from_mm"]), int(band["to_mm"])
            mn, mx = band_price_range(lk, lo, hi, laser_root)
            rows.append([label, f"{lo}-{hi}", format_band(mn, mx), acc])
    return rows


def build_extra_rows(prices: dict) -> list[list[str]]:
    rows = []
    for item in prices.get("additional_services", []):
        rows.append([item["service"], item["description"], item["surcharge"]])
    return rows


def footer_text(prices: dict) -> str:
    mo = prices.get("min_order", 1500)
    return (
        f"Минимальный заказ: {mo} ₽. Скидки на объём: от 50 деталей — 15%. "
        "Доставка по Москве — от 500 ₽. Цены ориентировочные; итоговая стоимость — после анализа чертежа."
    )


def build_pdf(biz: dict, prices: dict, output_path: Path) -> None:
    phone = str(biz["phone"])
    email = str(biz["email"])
    hours = str(biz.get("hours", ""))
    site = str(biz.get("url", "https://ceh-lazer-rezka.ru"))
    addr = biz.get("address", {})
    address_line = (
        f"{addr.get('locality', '')}, {addr.get('street', '')}, {addr.get('region', '')}"
    ).strip(", ")

    tel = tel_uri(phone)
    mailto = f"mailto:{email}"

    if not FONT_REGULAR.is_file():
        sys.exit(f"Font not found: {FONT_REGULAR} (install fonts-dejavu-core or similar)")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.add_font("DejaVu", "", str(FONT_REGULAR))
    if FONT_BOLD.is_file():
        pdf.add_font("DejaVu", "B", str(FONT_BOLD))
    else:
        pdf.add_font("DejaVu", "B", str(FONT_REGULAR))

    def draw_table(title: str, headers: list[str], rows: list[list[str]], widths: list[float]) -> None:
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        line_h = 7
        pdf.set_font("DejaVu", "B", 9)
        for h, w in zip(headers, widths):
            pdf.cell(w, line_h, h, border=1, align="C")
        pdf.ln(line_h)
        pdf.set_font("DejaVu", "", 9)
        for row in rows:
            if pdf.get_y() > 265:
                pdf.add_page()
            for cell, w in zip(row, widths):
                pdf.cell(w, line_h, str(cell)[:48], border=1, align="L")
            pdf.ln(line_h)

    pdf.set_font("DejaVu", "B", 16)
    pdf.cell(0, 10, "Цех лазерной резки — прайс-лист", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 10)
    pdf.cell(0, 6, site, link=site, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("DejaVu", "", 11)
    pdf.multi_cell(0, 6, f"Адрес: {address_line}\nРежим работы: {hours}")
    pdf.ln(3)

    pdf.set_font("DejaVu", "B", 12)
    pdf.cell(0, 8, "Контакты", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 11)
    pdf.write(6, "Телефон: ")
    pdf.set_text_color(0, 102, 204)
    pdf.write(6, phone, link=tel)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(8)
    pdf.write(6, "Email: ")
    pdf.set_text_color(0, 102, 204)
    pdf.write(6, email, link=mailto)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(12)

    laser_headers = ["Материал", "Толщина, мм", "Цена, ₽/п.м", "Точность"]
    laser_w = [42, 32, 38, 38]
    draw_table("Лазерная резка металлов", laser_headers, build_laser_rows(prices), laser_w)

    pdf.ln(4)
    extra_headers = ["Услуга", "Описание", "Наценка / от"]
    extra_w = [45, 85, 50]
    draw_table("Дополнительные услуги", extra_headers, build_extra_rows(prices), extra_w)

    pdf.ln(4)
    pdf.set_font("DejaVu", "", 10)
    pdf.multi_cell(0, 6, footer_text(prices))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build price-list PDF from YAML data.")
    p.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output PDF path (default: {DEFAULT_OUTPUT.relative_to(REPO_ROOT)})",
    )
    p.add_argument(
        "--prices",
        type=Path,
        default=DEFAULT_PRICES,
        help=f"Path to prices.yml (default: {DEFAULT_PRICES.relative_to(REPO_ROOT)})",
    )
    p.add_argument(
        "--business",
        type=Path,
        default=DEFAULT_BUSINESS,
        help=f"Path to business.yml (default: {DEFAULT_BUSINESS.relative_to(REPO_ROOT)})",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    out = args.output
    if not out.is_absolute():
        out = (REPO_ROOT / out).resolve()

    prices_path = args.prices
    if not prices_path.is_absolute():
        prices_path = (REPO_ROOT / prices_path).resolve()
    biz_path = args.business
    if not biz_path.is_absolute():
        biz_path = (REPO_ROOT / biz_path).resolve()

    if not prices_path.is_file():
        sys.exit(f"Missing {prices_path}")
    if not biz_path.is_file():
        sys.exit(f"Missing {biz_path}")

    prices = yaml.safe_load(prices_path.read_text(encoding="utf-8"))
    biz = yaml.safe_load(biz_path.read_text(encoding="utf-8"))
    build_pdf(biz, prices, out)
    try:
        rel = out.relative_to(REPO_ROOT)
        printed = str(rel)
    except ValueError:
        printed = str(out)
    print(f"OK: wrote {printed}")


if __name__ == "__main__":
    main()
