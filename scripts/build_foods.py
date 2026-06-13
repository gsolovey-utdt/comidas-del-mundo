#!/usr/bin/env python3
"""
build_foods.py — regenera data/foods.js a partir de un CSV.

El CSV puede ser un archivo local o una URL (ej. el "publicar en la web → CSV"
de Google Sheets). Si no se pasa argumento, busca data/foods.csv en el repo.

Uso:
    # archivo local
    python scripts/build_foods.py
    python scripts/build_foods.py data/foods.csv

    # URL de Google Sheets publicado como CSV
    python scripts/build_foods.py "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"

Columnas esperadas en el CSV (header en la primera fila):
    food_name, country, image, answer_label, fun_fact

`answer_label` es la frase corta de feedback, ej. "La Paella es de".

Los distractores ya NO se autoran: se generan en runtime por continente
(ver CONTINENT_BY_COUNTRY / pickDistractors en app.js). Las columnas
`distractors_*` quedan ignoradas si todavía están en el CSV/Sheet.

Columnas ignoradas si están presentes (legacy): type, food_familiarity,
extra_fun_facts, notes, distractors_easy, distractors_medium, distractors_hard.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "app.js"
DEFAULT_CSV = ROOT / "data" / "foods.csv"
OUT_JS = ROOT / "data" / "foods.js"
IMAGES_DIR = ROOT

REQUIRED_COLUMNS = [
    "food_name",
    "country",
    "image",
    "answer_label",
    "fun_fact",
]
LIST_SPLIT_RE = re.compile(r"\s*\|\s*")


def normalize_country(value: str) -> str:
    """Réplica de normalizeCountry() en app.js: sin tildes, minúsculas, espacios colapsados."""
    s = unicodedata.normalize("NFD", value or "")
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def load_country_meta_keys(app_js: Path) -> set[str]:
    """Extrae las claves de COUNTRY_META en app.js para validar contra ellas."""
    text = app_js.read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_META\s*=\s*\{(.*?)\};", text, re.DOTALL)
    if not m:
        raise SystemExit("No encontré COUNTRY_META en app.js")
    block = m.group(1)
    # Extrae las claves: pueden estar entre comillas ("reino unido") o no (japon).
    keys = set()
    for key_match in re.finditer(r'(?:"([^"]+)"|([a-zA-Z_][a-zA-Z_0-9 ]*))\s*:\s*\{', block):
        key = key_match.group(1) or key_match.group(2)
        keys.add(normalize_country(key))
    return keys


def read_csv_source(source: str) -> str:
    """Lee el CSV desde una URL o un path local y devuelve el texto."""
    if source.startswith(("http://", "https://")):
        print(f"GET {source}", file=sys.stderr)
        with urllib.request.urlopen(source, timeout=30) as resp:
            raw = resp.read()
    else:
        raw = Path(source).read_bytes()
    # Sacamos BOM si vino de Sheets/Excel.
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
    return raw.decode("utf-8")


def split_list(cell: str) -> list[str]:
    if not cell:
        return []
    return [part.strip() for part in LIST_SPLIT_RE.split(cell) if part.strip()]


def parse_rows(csv_text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        raise SystemExit("CSV vacío o sin header")
    missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing:
        raise SystemExit(f"Faltan columnas obligatorias: {missing}")
    return [row for row in reader if any((v or "").strip() for v in row.values())]


def validate_row(row: dict, idx: int, country_keys: set[str]) -> tuple[dict | None, list[str]]:
    errors: list[str] = []

    def field(name: str) -> str:
        return (row.get(name) or "").strip()

    food_name = field("food_name")
    country = field("country")
    image = field("image")
    answer_label = field("answer_label")
    fun_fact = field("fun_fact")

    if not food_name:
        errors.append("food_name vacío")
    if not country:
        errors.append("country vacío")
    elif normalize_country(country) not in country_keys:
        errors.append(
            f"country '{country}' no está en COUNTRY_META — agregalo en app.js o corregí el nombre"
        )
    if not image:
        errors.append("image vacía")
    elif not (IMAGES_DIR / image).exists():
        # Sólo warning: lo emitimos como warning aparte, no falla.
        pass
    if not fun_fact:
        errors.append("fun_fact vacío")

    if errors:
        return None, errors

    food = {
        "food_name": food_name,
        "country": country,
        "image": image,
        "answer_label": answer_label,
        "fun_fact": fun_fact,
    }
    return food, []


def js_string(value: str) -> str:
    """Serializa un string como string literal de JS (compatible con JSON)."""
    return json.dumps(value, ensure_ascii=False)


def emit_foods_js(foods: list[dict]) -> str:
    lines = [
        "// AUTO-GENERADO desde data/foods.csv — NO EDITAR A MANO.",
        "// Para regenerar: `python scripts/build_foods.py [csv_path_o_url]`",
        "window.FOODS_DATA = [",
    ]
    for food in foods:
        lines.append("  {")
        lines.append(f'    food_name: {js_string(food["food_name"])},')
        lines.append(f'    country: {js_string(food["country"])},')
        lines.append(f'    image: {js_string(food["image"])},')
        lines.append(f'    answer_label: {js_string(food["answer_label"])},')
        lines.append(f'    fun_fact: {js_string(food["fun_fact"])},')
        lines.append("  },")
    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source",
        nargs="?",
        default=str(DEFAULT_CSV),
        help="Path local o URL del CSV (default: data/foods.csv)",
    )
    parser.add_argument("--out", default=str(OUT_JS), help="Path de salida del .js")
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Valida e imprime resumen, no escribe nada",
    )
    args = parser.parse_args()

    country_keys = load_country_meta_keys(APP_JS)
    csv_text = read_csv_source(args.source)
    rows = parse_rows(csv_text)

    foods: list[dict] = []
    errors: list[str] = []
    warnings: list[str] = []

    for idx, row in enumerate(rows, start=2):  # fila 2 = primera de datos
        food, row_errors = validate_row(row, idx, country_keys)
        if row_errors:
            for e in row_errors:
                errors.append(f"fila {idx} ({(row.get('food_name') or '').strip() or '?'}): {e}")
            continue
        # warnings: imagen faltante
        if food["image"] and not (IMAGES_DIR / food["image"]).exists():
            warnings.append(
                f"fila {idx} ({food['food_name']}): imagen no existe en disco: {food['image']}"
            )
        foods.append(food)

    if warnings:
        print(f"⚠ {len(warnings)} warnings:", file=sys.stderr)
        for w in warnings:
            print(f"  - {w}", file=sys.stderr)

    if errors:
        print(f"✗ {len(errors)} errores — no se escribió nada:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    js_text = emit_foods_js(foods)

    if args.dry_run:
        print(f"OK (dry-run): {len(foods)} comidas válidas", file=sys.stderr)
        return 0

    out_path = Path(args.out)
    out_path.write_text(js_text, encoding="utf-8")
    print(f"OK: {len(foods)} comidas → {out_path}", file=sys.stderr)

    # resumen extra: países usados
    countries_used = sorted({f["country"] for f in foods})
    print(f"   países: {len(countries_used)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
