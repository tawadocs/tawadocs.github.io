const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DICTIONARY_PATH = path.join(__dirname, 'dictionary.json');
const SS_PATH = path.join(__dirname, 'public/ss.html');
const DOCS_PATH = path.join(__dirname, 'lang/docs');
const MP_DOCS_PATH = path.join(__dirname, 'lang/docs-mp');

app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure doc directories exist
[DOCS_PATH, MP_DOCS_PATH].forEach(p => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });

let dictionary = JSON.parse(fs.readFileSync(DICTIONARY_PATH, 'utf8'));
let semanticSpaceMap = {}; // Server-side cache for deep searching

/**
 * Syncs the semanticSpaceMap from the ss.html file
 * This allows the search route to check lipamanka definitions
 */
const refreshSemanticMap = () => {
  if (!fs.existsSync(SS_PATH)) return;
  const html = fs.readFileSync(SS_PATH, 'utf8');
  // Regex to extract ID and the associated paragraph text
  const regex = /<summary id="(.*?)">.*?<\/summary>\s*<p>(.*?)<\/p>/gs;
  let match;
  semanticSpaceMap = {};
  while ((match = regex.exec(html)) !== null) {
    semanticSpaceMap[match[1]] = match[2].toLowerCase();
  }
};
refreshSemanticMap(); // Initial sync

const numericalSort = (a, b) => {
  const numA = parseInt(a.match(/^\d+/) || 0);
  const numB = parseInt(b.match(/^\d+/) || 0);
  return numA - numB || a.localeCompare(b);
};

// --- DICTIONARY & SEARCH ROUTES ---

app.get('/search', (req, res) => {
  const query = req.query.q?.toLowerCase();
  let results = [...dictionary];

  if (query) {
    // 1. Filter: Check Word, Definitions, AND Semantic Space
    results = results.filter(entry => {
      const wordMatch = entry.word.toLowerCase().includes(query);
      const defMatch = entry.definitions.some(d => d.text.toLowerCase().includes(query));
      const ssMatch = semanticSpaceMap[entry.id]?.includes(query);
      return wordMatch || defMatch || ssMatch;
    });

    // 2. Sort: Weighted Priority
    results.sort((a, b) => {
      const wordA = a.word.toLowerCase();
      const wordB = b.word.toLowerCase();

      // Priority 1: Exact word match
      if (wordA === query && wordB !== query) return -1;
      if (wordB === query && wordA !== query) return 1;

      // Priority 2: Word starts with query
      const startsA = wordA.startsWith(query), startsB = wordB.startsWith(query);
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;

      // Priority 3: Word contains query
      const incA = wordA.includes(query), incB = wordB.includes(query);
      if (incA && !incB) return -1;
      if (!incA && incB) return 1;

      // Priority 4: Definition match
      const defA = a.definitions.some(d => d.text.toLowerCase().includes(query));
      const defB = b.definitions.some(d => d.text.toLowerCase().includes(query));
      if (defA && !defB) return -1;
      if (!defA && defB) return 1;

      // Priority 5: Semantic Space match (Deprioritized)
      const ssA = semanticSpaceMap[a.id]?.includes(query);
      const ssB = semanticSpaceMap[b.id]?.includes(query);
      if (ssA && !ssB) return 1; // Send 'a' to the bottom
      if (!ssA && ssB) return -1;

      return wordA.localeCompare(wordB);
    });
  } else {
    results.sort((a, b) => a.word.localeCompare(b.word));
  }
  res.json(results);
});

app.post('/word/:originalWord', (req, res) => {
  const originalWord = req.params.originalWord.toLowerCase();
  if (originalWord === '_new') {
    dictionary.push(req.body);
  } else {
    const idx = dictionary.findIndex(e => e.word.toLowerCase() === originalWord);
    if (idx !== -1) dictionary[idx] = req.body;
  }
  dictionary.sort((a, b) => a.word.localeCompare(b.word));
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2));
  res.json({ success: true });
});

app.delete('/word/:word', (req, res) => {
  const word = req.params.word.toLowerCase();
  dictionary = dictionary.filter(e => e.word.toLowerCase() !== word);
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2));
  res.json({ success: true });
});

// --- SEMANTIC SPACE (ss.html) MANAGEMENT ---

app.post('/semantic-space/:id', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  
  if (!fs.existsSync(SS_PATH)) {
    fs.writeFileSync(SS_PATH, '<!DOCTYPE html><html><body></body></html>');
  }

  let html = fs.readFileSync(SS_PATH, 'utf8');

  // Regex to find existing entry
  const regex = new RegExp(`(<summary id="${id}">.*?</summary>\\s*<p>)(.*?)(</p>)`, 's');
  
  if (regex.test(html)) {
    // Update existing
    html = html.replace(regex, `$1${text}$3`);
  } else {
    // Append new entry before closing body tag
    const newEntry = `
<details open>
    <summary id="${id}">${id}</summary>
    <p>${text}</p>
</details>
<br>
`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${newEntry}</body>`);
    } else {
      html += newEntry;
    }
  }

  fs.writeFileSync(SS_PATH, html);
  refreshSemanticMap(); // Sync search engine with the new data
  res.json({ success: true });
});

// --- DOCS SEARCH LOGIC ---

const handleDocsRequest = (dirPath, req, res) => {
  const query = req.query.q?.toLowerCase();
  let files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

  if (query) {
    files = files.filter(f => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf8').toLowerCase();
      return f.toLowerCase().includes(query) || content.includes(query);
    });
  }
  res.json(files.sort(numericalSort));
};

app.get('/api/docs', (req, res) => handleDocsRequest(DOCS_PATH, req, res));
app.get('/api/docs/:name', (req, res) => res.send(fs.readFileSync(path.join(DOCS_PATH, req.params.name), 'utf8')));
app.get('/api/docs-mp', (req, res) => handleDocsRequest(MP_DOCS_PATH, req, res));
app.get('/api/docs-mp/:name', (req, res) => res.send(fs.readFileSync(path.join(MP_DOCS_PATH, req.params.name), 'utf8')));

app.listen(PORT, () => console.log(`Tawa Server: http://localhost:${PORT}`));