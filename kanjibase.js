const fs = require("fs");
const path = require("path");

// --- CONFIGURATION ---
const PATHS = {
  dict2: path.join(__dirname, "Zz_xx/dictionary.json"), // extended dictionary
  ss2: path.join(__dirname, "Zz_xx/ss.html"), // extended semantic space
  templates: {
    index2: path.join(__dirname, "Zz_xx/xx_template.html"), // extended html
  },
  outputDir: path.join(__dirname, "public"),
};

const parseSemanticSpace2 = () => {
  if (!fs.existsSync(PATHS.ss2)) return {};
  const html = fs.readFileSync(PATHS.ss2, "utf8");
  const regex = /<summary id="(.*?)">.*?<\/summary>\s*<p>(.*?)<\/p>/gs;
  const map = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    map[match[1]] = match[2].trim().replace(/\s+/g, " ");
  }
  return map;
};

// --- MAIN BUILD FUNCTION ---
const build = () => {
  console.log("🔨 Starting static build...");

  // Ensure public directory exists
  if (!fs.existsSync(PATHS.outputDir)) {
    fs.mkdirSync(PATHS.outputDir, { recursive: true });
  }

  try {
    console.log(" -> Baking index.html #2...");
    let extDict = fs.readFileSync(PATHS.templates.index2, "utf8");
    const extData = JSON.parse(fs.readFileSync(PATHS.dict2, "utf8"));
    const extSs = parseSemanticSpace2();

    extDict = extDict.replace(
      /const DICTIONARY = \[.*?\];/s,
      `const DICTIONARY = ${JSON.stringify(extData)};`,
    );
    extDict = extDict.replace(
      /const SEMANTIC_SPACE = \{.*?\};/s,
      `const SEMANTIC_SPACE = ${JSON.stringify(extSs)};`,
    );
    fs.writeFileSync(path.join(PATHS.outputDir, "kanjibase.html"), extDict);

    console.log("✅ Success! Files are in /public");
  } catch (err) {
    console.error("❌ Build failed:", err);
  }
};

build();
