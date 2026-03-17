from flask import Flask, render_template, request, jsonify
import sqlite3
import json
import os

app = Flask(__name__)
DB_FILE = 'database.db'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS wiki (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            section TEXT,
            content_raw TEXT,
            translation TEXT,
            gloss_data TEXT
        )''')
    # Create required asset folders if they don't exist
    for folder in ['static/assets', 'static/lexicon']:
        if not os.path.exists(folder):
            os.makedirs(folder)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/save', methods=['POST'])
def save_article():
    data = request.json
    article_id = data.get('id')
    with get_db() as conn:
        if article_id:
            # Update existing record
            conn.execute('''UPDATE wiki SET title=?, section=?, content_raw=?, 
                            translation=?, gloss_data=? WHERE id=?''',
                         (data['title'], data['section'], data['raw'], 
                          data['translation'], json.dumps(data['gloss']), article_id))
        else:
            # Insert new record
            conn.execute('''INSERT INTO wiki (title, section, content_raw, translation, gloss_data) 
                            VALUES (?,?,?,?,?)''',
                         (data['title'], data['section'], data['raw'], 
                          data['translation'], json.dumps(data['gloss'])))
        conn.commit()
    return jsonify({"status": "success"})

@app.route('/api/article/<int:article_id>')
def get_article(article_id):
    with get_db() as conn:
        article = conn.execute('SELECT * FROM wiki WHERE id = ?', (article_id,)).fetchone()
        return jsonify(dict(article))

@app.route('/api/delete/<int:article_id>', methods=['DELETE'])
def delete_article(article_id):
    with get_db() as conn:
        conn.execute('DELETE FROM wiki WHERE id = ?', (article_id,))
        conn.commit()
    return jsonify({"status": "success"})

@app.route('/api/search')
def search():
    q = request.args.get('q', '')
    with get_db() as conn:
        items = conn.execute("SELECT * FROM wiki WHERE title LIKE ? OR section LIKE ? OR content_raw LIKE ?", 
                             (f'%{q}%', f'%{q}%', f'%{q}%')).fetchall()
        return jsonify([dict(ix) for ix in items])

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)