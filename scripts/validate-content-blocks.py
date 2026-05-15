#!/usr/bin/env python3
"""
Validate every TYPO3 ContentBlock config.yaml in the factory-core
extension. Catches the class of bug that broke 0.10.0 in the wild:

  - { label: Center Dark (centered text, dark bg), value: center-dark }

The unquoted comma inside the flow mapping splits the item into TWO keys,
dropping `value` entirely. TYPO3's DefaultTcaSchema then hits
"Undefined array key 'value'" and the DB analyzer crashes before any
Collection table is created.

Checks per config.yaml:
  1. YAML parses cleanly.
  2. Every Select field has an `items` list (unless `itemsProcFunc` is set).
  3. Every entry in every `items` list has a `value` key.
  4. Every items entry is a mapping (catches legacy `[label, value]` form
     leaking in).

Exits non-zero on any failure, printing every offence.

Run locally:
  python3 scripts/validate-content-blocks.py
Run on a specific directory:
  python3 scripts/validate-content-blocks.py factory-core/typo3-extension
"""

from __future__ import annotations

import glob
import os
import sys
from pathlib import Path

try:
    import yaml  # PyYAML — pre-installed on GitHub ubuntu-latest runners
except ImportError:
    print("ERROR: PyYAML not available. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


def find_configs(root: Path) -> list[Path]:
    patterns = [
        "factory-core/typo3-extension/ContentBlocks/ContentElements/*/config.yaml",
        "factory-core/typo3-extension/ContentBlocks/RecordTypes/*/config.yaml",
        # Allow running with the typo3-extension dir as the root too:
        "ContentBlocks/ContentElements/*/config.yaml",
        "ContentBlocks/RecordTypes/*/config.yaml",
    ]
    matches: set[Path] = set()
    for pattern in patterns:
        matches.update(Path(p) for p in glob.glob(str(root / pattern)))
    return sorted(matches)


ALLOWED_ITEM_KEYS = {"label", "value", "icon", "group", "description"}

# content-blocks reads these keys off the field-definition map *as attributes*
# of the underlying TCA field config (e.g. `size` = input width, `default` =
# default value, `eval` = TCA eval string). If a sub-field is given one of
# these as an *identifier*, content-blocks parses it as a config attribute
# instead and silently drops the DB column — INSERTs then fail with
# "Unknown column 'size' in 'field list'" on the auto-generated child table.
# This list mirrors content-blocks 1.3 FieldType properties; extend as new
# ones are discovered.
RESERVED_IDENTIFIERS = {
    "size", "default", "eval", "max", "min", "mode", "placeholder",
    "readOnly", "required", "valuePicker", "is_in", "autocomplete",
}


def validate_field(field: dict, path_hint: str, errors: list[str]) -> None:
    """Walk a single TCA-style field definition for Select-items integrity."""
    if not isinstance(field, dict):
        return

    ident = field.get("identifier")
    if isinstance(ident, str) and ident in RESERVED_IDENTIFIERS:
        errors.append(
            f"{path_hint}: identifier '{ident}' collides with a content-blocks "
            f"reserved field-config key — the DB column will be silently "
            f"dropped. Rename to e.g. button_{ident} / file_{ident}."
        )

    if field.get("type") == "Select":
        has_proc = bool(field.get("itemsProcFunc"))
        items = field.get("items")
        if items is None and not has_proc:
            errors.append(f"{path_hint}: Select field has no items[] and no itemsProcFunc")
        elif items is not None:
            if not isinstance(items, list):
                errors.append(f"{path_hint}: items is not a list ({type(items).__name__})")
            else:
                for i, item in enumerate(items):
                    item_hint = f"{path_hint}.items[{i}]"
                    if not isinstance(item, dict):
                        errors.append(
                            f"{item_hint}: expected mapping ({{label, value}}), "
                            f"got {type(item).__name__}: {item!r}"
                        )
                        continue
                    if "value" not in item:
                        errors.append(
                            f"{item_hint}: missing 'value' key (likely an "
                            f"unquoted comma in the label): {item!r}"
                        )
                    if "label" not in item:
                        errors.append(f"{item_hint}: missing 'label' key: {item!r}")
                    # Detect parser-corrupted items: an unquoted comma inside a
                    # flow mapping splits the value across spurious extra keys.
                    # PyYAML keeps `value` intact but injects garbage keys like
                    # `"dark bg)": null` — those signal the same bug class as
                    # the missing-value case.
                    extras = set(item.keys()) - ALLOWED_ITEM_KEYS
                    if extras:
                        errors.append(
                            f"{item_hint}: unexpected key(s) {sorted(extras)!r} — "
                            f"likely an unquoted comma in the label split the "
                            f"flow mapping. Wrap the label in single quotes: "
                            f"{item!r}"
                        )

    # Recurse into Collection children
    children = field.get("fields")
    if isinstance(children, list):
        identifier = field.get("identifier", "?")
        for child in children:
            validate_field(child, f"{path_hint}.fields[{identifier}]", errors)


def validate_config(config_path: Path, errors: list[str]) -> None:
    rel = config_path
    try:
        with config_path.open() as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        errors.append(f"{rel}: YAML parse error — {e}")
        return

    if not isinstance(data, dict):
        errors.append(f"{rel}: top-level is not a mapping")
        return

    name = data.get("name", "?")
    fields = data.get("fields")
    if not isinstance(fields, list):
        errors.append(f"{rel} ({name}): 'fields' is not a list")
        return

    for field in fields:
        ident = field.get("identifier", "?") if isinstance(field, dict) else "?"
        validate_field(field, f"{rel}:{ident}", errors)


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    root = root.resolve()
    configs = find_configs(root)
    if not configs:
        print(f"No ContentBlock configs found under {root}", file=sys.stderr)
        return 2

    errors: list[str] = []
    for config in configs:
        validate_config(config, errors)

    if errors:
        print(f"❌ {len(errors)} issue(s) across {len(configs)} configs:", file=sys.stderr)
        for err in errors:
            print(f"  • {err}", file=sys.stderr)
        return 1

    print(f"✓ {len(configs)} ContentBlock configs validated cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
