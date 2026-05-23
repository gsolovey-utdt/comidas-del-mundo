#!/usr/bin/env python3
"""
foods_to_csv.py — bootstrap one-shot.

Lee data/foods.js (formato `window.FOODS_DATA = [...]`) y escribe data/foods.csv
con una fila por comida. Se usa una sola vez para arrancar la planilla.

Uso:
    python scripts/foods_to_csv.py
    python scripts/foods_to_csv.py --out data/foods.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOODS_JS = ROOT / "data" / "foods.js"
DEFAULT_OUT = ROOT / "data" / "foods.csv"

COLUMNS = [
    "food_name",
    "country",
    "image",
    "answer_label",
    "fun_fact",
    "distractors_easy",
    "distractors_medium",
    "distractors_hard",
]

LIST_SEP = " | "


def js_object_literal_to_json(s: str) -> str:
    """Convierte el cuerpo de `window.FOODS_DATA = [...]` a JSON válido.

    - Quotea claves bareword (food_name: → "food_name":).
    - Elimina trailing commas antes de } o ].
    - Respeta string literals (no toca lo que está adentro de comillas).
    """
    out: list[str] = []
    i = 0
    n = len(s)
    in_string = False
    while i < n:
        c = s[i]
        if in_string:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(s[i + 1])
                i += 2
                continue
            if c == '"':
                in_string = False
            i += 1
            continue
        if c == '"':
            in_string = True
            out.append(c)
            i += 1
            continue
        # bareword key
        if c.isalpha() or c == "_":
            j = i
            while j < n and (s[j].isalnum() or s[j] == "_"):
                j += 1
            k = j
            while k < n and s[k] in " \t\r\n":
                k += 1
            word = s[i:j]
            if k < n and s[k] == ":" and word not in ("true", "false", "null"):
                out.append('"' + word + '"')
            else:
                out.append(word)
            i = j
            continue
        # trailing comma
        if c == ",":
            k = i + 1
            while k < n and s[k] in " \t\r\n":
                k += 1
            if k < n and s[k] in "}]":
                i += 1
                continue
        out.append(c)
        i += 1
    return "".join(out)


def load_foods(js_path: Path) -> list[dict]:
    text = js_path.read_text(encoding="utf-8-sig")
    # Saltar comentarios de línea al principio (header AUTO-GENERADO).
    text = re.sub(r"^\s*//.*$", "", text, flags=re.MULTILINE).strip()
    prefix = "window.FOODS_DATA"
    if not text.startswith(prefix):
        raise SystemExit(f"{js_path} no empieza con `window.FOODS_DATA`")
    text = text[len(prefix):].lstrip()
    if not text.startswith("="):
        raise SystemExit(f"{js_path}: esperaba '=' después de window.FOODS_DATA")
    text = text[1:].strip()
    if text.endswith(";"):
        text = text[:-1].rstrip()
    json_text = js_object_literal_to_json(text)
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        # Para debug: dejar el JSON intermedio a mano
        debug = js_path.with_suffix(".debug.json")
        debug.write_text(json_text, encoding="utf-8")
        raise SystemExit(
            f"No pude parsear {js_path}: {e}. Volqué el intento a {debug}"
        )


def row_for(food: dict) -> dict[str, str]:
    distractors = food.get("distractors", {}) or {}
    return {
        "food_name": food.get("food_name", ""),
        "country": food.get("country", ""),
        "image": food.get("image", ""),
        "answer_label": food.get("answer_label", ""),
        "fun_fact": food.get("fun_fact", ""),
        "distractors_easy": LIST_SEP.join(distractors.get("easy", []) or []),
        "distractors_medium": LIST_SEP.join(distractors.get("medium", []) or []),
        "distractors_hard": LIST_SEP.join(distractors.get("hard", []) or []),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="src", default=str(FOODS_JS),
                        help="Ruta a data/foods.js")
    parser.add_argument("--out", default=str(DEFAULT_OUT),
                        help="Ruta de salida del CSV")
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)

    foods = load_foods(src)
    out.parent.mkdir(parents=True, exist_ok=True)
    # newline="" + utf-8-sig para que Excel/Sheets reconozca acentos y comas.
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for food in foods:
            writer.writerow(row_for(food))

    print(f"OK: {len(foods)} comidas → {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
