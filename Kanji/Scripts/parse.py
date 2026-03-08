import csv
import json


def safe_int(value):
    """Returns an integer if possible, otherwise returns 0."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0  # Or None, depending on how you want to handle it in HTML


def parse_radicals(input_file, output_file):
    roots = []

    with open(input_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # We use .get() to avoid KeyErrors and safe_int to avoid ValueErrors
            entry = {
                "ID": row.get("Radical ID#", "0"),
                "Alias": row.get("Radical ID#", "0"),
                "Radical": row.get("Radical", ""),
                "Strokes": safe_int(row.get("Stroke#")),
                "Definitions": row.get("Meaning", "").split(", "),
                "Readings": {
                    "Japanese": row.get("Reading-J", ""),
                    "Romaji": row.get("Reading-R", ""),
                },
                "Position": {
                    "Name": row.get("Position-J", ""),
                    "Romaji": row.get("Position-R", ""),
                },
            }
            roots.append(entry)

    with open(output_file, mode="w", encoding="utf-8") as f:
        json.dump(roots, f, indent=4, ensure_ascii=False)

    print(f"Successfully parsed {len(roots)} radicals into {output_file}")


if __name__ == "__main__":
    parse_radicals("raw.csv", "roots.json")
