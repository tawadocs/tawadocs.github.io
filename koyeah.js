const fs = require("fs");
const path = require("path");

// --- CONFIGURATION ---
const PATHS = {
  docsKoyeahG: path.join(__dirname, "lang/KOYEAH/grammar"), // NEW
  docsKoyeahM: path.join(__dirname, "lang/KOYEAH/sounds"),  // NEW
  // Templates
  templates: {
    koyeahG: path.join(__dirname, "koyeahg.html"), // NEW
    koyeahM: path.join(__dirname, "koyeahm.html"), // NEW
  },
  outputDir: path.join(__dirname, "public"),
};

const numericalSort = (a, b) => {
  const numA = parseInt(a.match(/^\d+/) || 0);
  const numB = parseInt(b.match(/^\d+/) || 0);
  return numA - numB || a.localeCompare(b);
};

const getDocsData = (dirPath) => {
  if (!fs.existsSync(dirPath)) return {};
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".md"))
    .sort(numericalSort);
  const data = {};
  files.forEach((f) => {
    data[f] = fs.readFileSync(path.join(dirPath, f), "utf8");
  });
  return data;
};

const build = () => {
  try {

    // --- KOYEAH BUILDS ---
    console.log(" stuff Koyeah Editions...");
    
    const koyeahConfigs = [
        { tpl: PATHS.templates.koyeahG, out: "grammarkoyeah.html", src: PATHS.docsKoyeahG },
        { tpl: PATHS.templates.koyeahM, out: "mprfkoyeah.html", src: PATHS.docsKoyeahM }
    ];

    koyeahConfigs.forEach(conf => {
        let html = fs.readFileSync(conf.tpl, "utf8");
        const data = getDocsData(conf.src);
        html = html.replace(/const DOCS_DATA = \{.*?\};/s, `const DOCS_DATA = ${JSON.stringify(data)};`);
        fs.writeFileSync(path.join(PATHS.outputDir, conf.out), html);
    });

    console.log("it worked gng.");
  } catch (err) {
    console.error("💔 ts pmo:", err);
  }
};

build();