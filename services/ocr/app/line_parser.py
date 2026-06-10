from __future__ import annotations

import csv
import io
import re
from typing import Any

from app.models import LineItem

PRICE_RE = re.compile(r"(?<!\d)(\d{1,5}[.,]\d{2})(?!\d)")
QTY_RE = re.compile(r"\b(\d+(?:[.,]\d+)?)\s*(?:x|pcs|pc|kg|g|l|ml)?\b", re.IGNORECASE)
SKIP_RE = re.compile(
    r"\b(total|subtotal|vat|tax|amount due|invoice|delivery|payment|balance)\b",
    re.IGNORECASE,
)


def _to_float(value: str | float | int | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = str(value).strip().replace(",", ".")
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def parse_csv(content: bytes) -> tuple[str, list[LineItem]]:
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return text, parse_text_lines(text)

    headers = {_normalize_header(name): name for name in reader.fieldnames if name}
    description_key = next(
        (
            headers[key]
            for key in headers
            if any(token in key for token in ("description", "product", "item", "name"))
        ),
        reader.fieldnames[0],
    )
    quantity_key = next(
        (headers[key] for key in headers if "qty" in key or "quantity" in key),
        None,
    )
    price_key = next(
        (
            headers[key]
            for key in headers
            if any(token in key for token in ("price", "cost", "amount", "unit"))
        ),
        None,
    )

    items: list[LineItem] = []
    for row in reader:
        description = (row.get(description_key) or "").strip()
        if not description or SKIP_RE.search(description):
            continue
        items.append(
            LineItem(
                description=description,
                quantity=_to_float(row.get(quantity_key)) if quantity_key else None,
                unit_price=_to_float(row.get(price_key)) if price_key else None,
            )
        )

    return text, items or parse_text_lines(text)


def parse_text_lines(text: str) -> list[LineItem]:
    items: list[LineItem] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if len(line) < 4 or SKIP_RE.search(line):
            continue

        prices = [float(match.replace(",", ".")) for match in PRICE_RE.findall(line)]
        if not prices:
            continue

        unit_price = prices[-1]
        description = PRICE_RE.sub("", line)
        description = QTY_RE.sub("", description)
        description = re.sub(r"\s{2,}", " ", description).strip(" -|\t")

        if len(description) < 2:
            continue

        qty_match = QTY_RE.search(line)
        quantity = _to_float(qty_match.group(1)) if qty_match else None

        items.append(
            LineItem(
                description=description,
                quantity=quantity,
                unit_price=unit_price,
            )
        )

    return items


def parse_pdf_tables(tables: list[list[list[Any]]]) -> list[LineItem]:
    items: list[LineItem] = []
    for table in tables:
        if not table or len(table) < 2:
            continue

        header = [_normalize_header(str(cell or "")) for cell in table[0]]
        description_idx = next(
            (
                index
                for index, value in enumerate(header)
                if any(token in value for token in ("description", "product", "item", "name"))
            ),
            0,
        )
        quantity_idx = next(
            (index for index, value in enumerate(header) if "qty" in value or "quantity" in value),
            None,
        )
        price_idx = next(
            (
                index
                for index, value in enumerate(header)
                if any(token in value for token in ("price", "cost", "amount", "unit"))
            ),
            None,
        )

        for row in table[1:]:
            if description_idx >= len(row):
                continue
            description = str(row[description_idx] or "").strip()
            if not description or SKIP_RE.search(description):
                continue
            items.append(
                LineItem(
                    description=description,
                    quantity=_to_float(row[quantity_idx]) if quantity_idx is not None and quantity_idx < len(row) else None,
                    unit_price=_to_float(row[price_idx]) if price_idx is not None and price_idx < len(row) else None,
                )
            )

    return items
