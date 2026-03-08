const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DICTIONARY_PATH = path.join(__dirname, "dictionary.json");
const SS_PATH = path.join(__dirname, "private/ss.html");
const DOCS_PATH = path.join(__dirname, "lang/docs");
const MP_DOCS_PATH = path.join(__dirname, "lang/docs-mp");

app.use(bodyParser.json());
app.use(express.static("private"));

// Ensure doc directories exist
[DOCS_PATH, MP_DOCS_PATH].forEach((p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

let dictionary = JSON.parse(fs.readFileSync(DICTIONARY_PATH, "utf8"));
let semanticSpaceMap = {}; // Server-side cache for deep searching

/**
 * Syncs the semanticSpaceMap from the ss.html file
 * This allows the search route to check lipamanka definitions
 */
const refreshSemanticMap = () => {
  if (!fs.existsSync(SS_PATH)) return;
  const html = fs.readFileSync(SS_PATH, "utf8");
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
app.get("/search", (req, res) => {
  const query = req.query.q?.toLowerCase();
  const sortByCompound = req.query.sort === "compound"; // Check for sort flag
  let results = [...dictionary];

  // Helper to determine if a word is a compound
  const isCompound = (word) => word.trim().includes(" ");

  const compoundSort = (a, b) => {
    const aComp = isCompound(a.word);
    const bComp = isCompound(b.word);

    if (aComp && !bComp) return 1; // a is compound, move down
    if (!aComp && bComp) return -1; // b is compound, move up
    return a.word.localeCompare(b.word); // Both same type, alphabetize
  };

  if (query) {
    results = results.filter((entry) => {
      const wordMatch = entry.word.toLowerCase().includes(query);
      const defMatch = entry.definitions.some((d) =>
        d.text.toLowerCase().includes(query),
      );
      const ssMatch = semanticSpaceMap[entry.id]?.includes(query);
      return wordMatch || defMatch || ssMatch;
    });

    results.sort((a, b) => {
      // If compound sorting is active, it overrides weighted search priority
      if (sortByCompound) return compoundSort(a, b);

      const wordA = a.word.toLowerCase();
      const wordB = b.word.toLowerCase();

      if (wordA === query && wordB !== query) return -1;
      if (wordB === query && wordA !== query) return 1;

      // ... (Keep your existing startsWith/includes priority logic here) ...

      return compoundSort(a, b); // Use compound logic as the final tie-breaker
    });
  } else {
    results.sort(compoundSort);
  }
  res.json(results);
});

app.post("/word/:originalWord", (req, res) => {
  const originalWord = req.params.originalWord.toLowerCase();
  if (originalWord === "_new") {
    dictionary.push(req.body);
  } else {
    const idx = dictionary.findIndex(
      (e) => e.word.toLowerCase() === originalWord,
    );
    if (idx !== -1) dictionary[idx] = req.body;
  }
  dictionary.sort((a, b) => a.word.localeCompare(b.word));
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2));
  res.json({ success: true });
});

app.delete("/word/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  dictionary = dictionary.filter((e) => e.word.toLowerCase() !== word);
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2));
  res.json({ success: true });
});

// --- SEMANTIC SPACE (ss.html) MANAGEMENT ---

app.post("/semantic-space/:id", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!fs.existsSync(SS_PATH)) {
    fs.writeFileSync(SS_PATH, "<!DOCTYPE html><html><body></body></html>");
  }

  let html = fs.readFileSync(SS_PATH, "utf8");

  // Regex to find existing entry
  const regex = new RegExp(
    `(<summary id="${id}">.*?</summary>\\s*<p>)(.*?)(</p>)`,
    "s",
  );

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
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${newEntry}</body>`);
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
  let files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));

  if (query) {
    files = files.filter((f) => {
      const content = fs
        .readFileSync(path.join(dirPath, f), "utf8")
        .toLowerCase();
      return f.toLowerCase().includes(query) || content.includes(query);
    });
  }
  res.json(files.sort(numericalSort));
};

app.get("/api/docs", (req, res) => handleDocsRequest(DOCS_PATH, req, res));
app.get("/api/docs/:name", (req, res) =>
  res.send(fs.readFileSync(path.join(DOCS_PATH, req.params.name), "utf8")),
);
app.get("/api/docs-mp", (req, res) =>
  handleDocsRequest(MP_DOCS_PATH, req, res),
);
app.get("/api/docs-mp/:name", (req, res) =>
  res.send(fs.readFileSync(path.join(MP_DOCS_PATH, req.params.name), "utf8")),
);

/// EXTENDED ///
// // --- NEW PATHS FOR EXTENDED ---
const EXT_DIR = path.join(__dirname, "Zz_ext");
const EXT_DICTIONARY_PATH = path.join(EXT_DIR, "dictionary.json");
const EXT_SS_PATH = path.join(EXT_DIR, "ss.html");

// Ensure Zz_ext directory and files exist
if (!fs.existsSync(EXT_DIR)) fs.mkdirSync(EXT_DIR, { recursive: true });
if (!fs.existsSync(EXT_DICTIONARY_PATH))
  fs.writeFileSync(EXT_DICTIONARY_PATH, "[]");
if (!fs.existsSync(EXT_SS_PATH))
  fs.writeFileSync(EXT_SS_PATH, "<!DOCTYPE html><html><body></body></html>");

let extDictionary = JSON.parse(fs.readFileSync(EXT_DICTIONARY_PATH, "utf8"));
let extSemanticSpaceMap = {};

// Refresh logic for Extended Semantic Map
const refreshExtSemanticMap = () => {
  if (!fs.existsSync(EXT_SS_PATH)) return;
  const html = fs.readFileSync(EXT_SS_PATH, "utf8");
  const regex = /<summary id="(.*?)">.*?<\/summary>\s*<p>(.*?)<\/p>/gs;
  let match;
  extSemanticSpaceMap = {};
  while ((match = regex.exec(html)) !== null) {
    extSemanticSpaceMap[match[1]] = match[2].toLowerCase();
  }
};
refreshExtSemanticMap();

// --- EXTENDED DICTIONARY ROUTES ---

// Search Extended
app.get("/api/ext/search", (req, res) => {
  const query = req.query.q?.toLowerCase();
  let results = [...extDictionary];

  if (query) {
    results = results.filter((entry) => {
      const wordMatch = entry.word.toLowerCase().includes(query);
      const defMatch = entry.definitions.some((d) =>
        d.text.toLowerCase().includes(query),
      );
      const ssMatch = extSemanticSpaceMap[entry.id]?.includes(query);
      return wordMatch || defMatch || ssMatch;
    });
  }
  // Reuse your existing sorting logic if desired
  res.json(results.sort((a, b) => a.word.localeCompare(b.word)));
});

// Save/Update Extended Word
app.post("/api/ext/word/:originalWord", (req, res) => {
  const originalWord = req.params.originalWord.toLowerCase();
  if (originalWord === "_new") {
    extDictionary.push(req.body);
  } else {
    const idx = extDictionary.findIndex(
      (e) => e.word.toLowerCase() === originalWord,
    );
    if (idx !== -1) extDictionary[idx] = req.body;
  }
  extDictionary.sort((a, b) => a.word.localeCompare(b.word));
  fs.writeFileSync(EXT_DICTIONARY_PATH, JSON.stringify(extDictionary, null, 2));
  res.json({ success: true });
});

// Delete Extended Word
app.delete("/api/ext/word/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  extDictionary = extDictionary.filter((e) => e.word.toLowerCase() !== word);
  fs.writeFileSync(EXT_DICTIONARY_PATH, JSON.stringify(extDictionary, null, 2));
  res.json({ success: true });
});

// --- EXTENDED SEMANTIC SPACE MGMT ---

app.post("/api/ext/semantic-space/:id", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  let html = fs.readFileSync(EXT_SS_PATH, "utf8");
  const regex = new RegExp(
    `(<summary id="${id}">.*?</summary>\\s*<p>)(.*?)(</p>)`,
    "s",
  );

  if (regex.test(html)) {
    html = html.replace(regex, `$1${text}$3`);
  } else {
    const newEntry = `\n<details open>\n <summary id="${id}">${id}</summary>\n <p>${text}</p>\n</details>\n<br>\n`;
    html = html.includes("</body>")
      ? html.replace("</body>", `${newEntry}</body>`)
      : html + newEntry;
  }

  fs.writeFileSync(EXT_SS_PATH, html);
  refreshExtSemanticMap();
  res.json({ success: true });
});

app.get("/api/ext/ss", (req, res) => {
  res.sendFile(EXT_SS_PATH);
});

app.listen(PORT, () => console.log(`Tawa Server: http://localhost:${PORT}`));
