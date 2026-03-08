const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, "db", "roots.json");
const TEMPLATE_PATH = path.join(__dirname, "admin.html");
const OUTPUT_PATH = path.join(__dirname, "kanji.html");

function regenerateStaticHtml(data) {
  try {
    const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const finalHtml = template.replace(
      "const kanjiData = [];",
      `const kanjiData = ${JSON.stringify(data)};`,
    );
    fs.writeFileSync(OUTPUT_PATH, finalHtml);
    console.log("Successfully regenerated kanji.html");
  } catch (err) {
    console.error("Error regenerating HTML:", err);
  }
}

app.get("/api/kanji", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  res.json(data);
});

app.post("/api/kanji", (req, res) => {
  const newData = req.body;

  fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2));

  regenerateStaticHtml(newData);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Admin Server running at http://localhost:${PORT}`);
  console.log(
    `Update your data here, and kanji.html will be updated automatically.`,
  );
});
