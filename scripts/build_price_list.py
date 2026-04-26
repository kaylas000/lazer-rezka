#!/usr/bin/env python3
"""
Generate assets/files/price-list.pdf from _data/business.yml (NAP) and
fixed price tables aligned with the public calculator page.

Run from the repository root:
  pip install -r requirements/price-list.txt
  python3 scripts/build_price_list.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml
from fpdf import FPDF

REPO_ROOT = Path(__file__).resolve().parent.parent
BUSINESS_YML = REPO_ROOT / "_data" / "business.yml"
OUTPUT_PDF = REPO_ROOT / "assets" / "files" / "price-list.pdf"
FONT_REGULAR = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
FONT_BOLD = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")


def tel_uri(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    if not digits:
        raise ValueError("phone has no digits")
    return "tel:+" + digits


def load_business() -> dict:
    if not BUSINESS_YML.is_file():
        sys.exit(f"Missing {BUSINESS_YML}")
    return yaml.safe_load(BUSINESS_YML.read_text(encoding="utf-8"))


def build_pdf(biz: dict) -> None:
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
    laser_rows = [
        ["Сталь Ст3", "1-2", "80-90", "±0.01 мм"],
        ["Сталь Ст3", "3-5", "100-120", "±0.01 мм"],
        ["Сталь Ст3", "6-8", "130-150", "±0.01 мм"],
        ["Сталь Ст3", "10-12", "180-220", "±0.01 мм"],
        ["Сталь Ст3", "15-20", "280-350", "±0.01 мм"],
        ["Нержавейка AISI 304", "1-2", "120-140", "±0.01 мм"],
        ["Нержавейка AISI 304", "3-5", "160-200", "±0.01 мм"],
        ["Нержавейка AISI 304", "6-8", "220-260", "±0.01 мм"],
        ["Нержавейка AISI 304", "10-12", "320-400", "±0.01 мм"],
        ["Алюминий АД31", "1-3", "100-120", "±0.01 мм"],
        ["Алюминий АД31", "4-6", "130-150", "±0.01 мм"],
        ["Алюминий АД31", "8-10", "180-220", "±0.01 мм"],
    ]
    draw_table("Лазерная резка металлов", laser_headers, laser_rows, laser_w)

    pdf.ln(4)
    extra_headers = ["Услуга", "Описание", "Наценка / от"]
    extra_w = [45, 85, 50]
    extra_rows = [
        ["Гибка металла", "Листовой металл до 4 мм", "+20%"],
        ["Порошковая покраска", "Любой цвет по RAL", "+40%"],
        ["Пескоструйная обработка", "Очистка и подготовка", "+15%"],
        ["Сварочные работы", "Сварка стали и нержавейки", "от 500 ₽"],
        ["Гравировка", "Лазерная гравировка", "от 300 ₽"],
        ["Срочный заказ", "Выполнение в день обращения", "+30%"],
        ["Серийный заказ", "От 50 деталей", "-15%"],
    ]
    draw_table("Дополнительные услуги", extra_headers, extra_rows, extra_w)

    pdf.ln(4)
    pdf.set_font("DejaVu", "", 10)
    pdf.multi_cell(
        0,
        6,
        "Минимальный заказ: 1500 ₽. Скидки на объём: от 50 деталей — 15%. "
        "Доставка по Москве — от 500 ₽. Цены ориентировочные; итоговая стоимость — после анализа чертежа.",
    )

    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT_PDF))


def main() -> None:
    biz = load_business()
    build_pdf(biz)
    print(f"OK: wrote {OUTPUT_PDF.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
