import sqlite3
import json
import os
import sys

DB_FILE = 'database.db'
TEMPLATE_FILE = 'template.html'
OUTPUT_FILE = 'home.html'

def build():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} not found. Run your Flask app once to create it.")
        return
    if not os.path.exists(TEMPLATE_FILE):
        print(f"Error: {TEMPLATE_FILE} not found. Make sure your source HTML is named template.html")
        return

    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT id, title, section, content_raw, translation, gloss_data FROM wiki")
        rows = [dict(row) for row in cursor.fetchall()]
        json_data = json.dumps(rows, indent=4)
        conn.close()

        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            html_content = f.read()

        marker = "let archiveData = [];"
        if marker not in html_content:
            print("Error: Could not find 'let archiveData = [];' in template.html")
            return

        updated_html = html_content.replace(marker, f"let archiveData = {json_data};")

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(updated_html)

        print(f"Successfully baked {len(rows)} manuscripts into {OUTPUT_FILE}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    build()
