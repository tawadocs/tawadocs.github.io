const fs = require("fs");
const path = require("path");

const Root = path.join(__dirname, "Kanji/");
const dbPath = path.join(Root, "db/roots.json");
const templatePath = path.join(Root, "template.html");

const rawData = fs.readFileSync(dbPath, "utf8");
const templateContent = fs.readFileSync(templatePath, "utf8");

const finalHtml = templateContent.replace(
  "const kanjiData = [];",
  `const kanjiData = ${rawData};`,
);

fs.writeFileSync(path.join(Root, "kanji.html"), finalHtml);
console.log("Successfully generated kanji.html with hardcoded data!");
