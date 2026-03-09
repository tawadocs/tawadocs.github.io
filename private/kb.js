const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Configuration for Extended Lexicon
const EXT_DIR = path.join(__dirname, "../Zz_xx");
const DICTIONARY_PATH = path.join(EXT_DIR, "dictionary.json");
const SS_PATH = path.join(EXT_DIR, "ss.html");

app.use(express.json());
app.use(express.static(".")); // Put your HTML file in a folder named 'public'

// --- INITIALIZATION ---

if (!fs.existsSync(EXT_DIR)) fs.mkdirSync(EXT_DIR, { recursive: true });
if (!fs.existsSync(DICTIONARY_PATH)) fs.writeFileSync(DICTIONARY_PATH, "[]");
if (!fs.existsSync(SS_PATH))
  fs.writeFileSync(SS_PATH, "<!DOCTYPE html><html><body></body></html>");

let extDictionary = JSON.parse(fs.readFileSync(DICTIONARY_PATH, "utf8"));
let extSemanticSpaceMap = {};

/**
 * Parses the ss.html file into a map for the search engine
 */
const refreshExtSemanticMap = () => {
  if (!fs.existsSync(SS_PATH)) return;
  const html = fs.readFileSync(SS_PATH, "utf8");
  const regex = /<summary id="(.*?)">.*?<\/summary>\s*<p>(.*?)<\/p>/gs;
  let match;
  extSemanticSpaceMap = {};
  while ((match = regex.exec(html)) !== null) {
    extSemanticSpaceMap[match[1]] = match[2].toLowerCase();
  }
};
refreshExtSemanticMap();

// --- API ROUTES ---

// 1. Search Dictionary (Includes Semantic Space context)
app.get("/api/ext/search", (req, res) => {
  const query = req.query.q?.toLowerCase();
  let results = [...extDictionary];

  if (query) {
    results = results.filter((entry) => {
      const wordMatch = entry.word.toLowerCase().includes(query);
      const idMatch = entry.id.toLowerCase().includes(query);
      const defMatch = entry.definitions.some((d) =>
        d.text.toLowerCase().includes(query),
      );
      const ssMatch = extSemanticSpaceMap[entry.id]?.includes(query);
      return wordMatch || idMatch || defMatch || ssMatch;
    });
  }
  res.json(results.sort((a, b) => a.word.localeCompare(b.word)));
});

// 2. Fetch raw Semantic Space HTML
app.get("/api/ext/ss", (req, res) => {
  res.sendFile(SS_PATH);
});

// 3. Save or Update Word
app.post("/api/ext/word/:originalWord", (req, res) => {
  const originalWord = req.params.originalWord.toLowerCase();
  const entry = req.body; // { word, id, definitions }

  if (originalWord === "_new") {
    extDictionary.push(entry);
  } else {
    const idx = extDictionary.findIndex(
      (e) => e.word.toLowerCase() === originalWord,
    );
    if (idx !== -1) extDictionary[idx] = entry;
    else extDictionary.push(entry);
  }

  extDictionary.sort((a, b) => a.word.localeCompare(b.word));
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(extDictionary, null, 2));
  res.json({ success: true });
});

// 4. Update Semantic Space Description
app.post("/api/ext/semantic-space/:id", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  let html = fs.readFileSync(SS_PATH, "utf8");

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

  fs.writeFileSync(SS_PATH, html);
  refreshExtSemanticMap();
  res.json({ success: true });
});

// 5. Delete Word
app.delete("/api/ext/word/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  extDictionary = extDictionary.filter((e) => e.word.toLowerCase() !== word);
  fs.writeFileSync(DICTIONARY_PATH, JSON.stringify(extDictionary, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () =>
  console.log(`Extended Lexicon Backend: http://localhost:${PORT}`),
);
