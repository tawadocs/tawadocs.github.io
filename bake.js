const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const PATHS = {
    dictionary: path.join(__dirname, 'dictionary.json'),
    ss: path.join(__dirname, 'ss.html'),
    docs: path.join(__dirname, 'lang/docs'),
    docsMp: path.join(__dirname, 'lang/docs-mp'),
    templates: {
        index: path.join(__dirname, 'template.html'),
        grammar: path.join(__dirname, 'grammar_template.html'),
        mprf: path.join(__dirname, 'mprf_template.html')
    },
    outputDir: path.join(__dirname, 'public')
};

// --- HELPERS ---
const numericalSort = (a, b) => {
    const numA = parseInt(a.match(/^\d+/) || 0);
    const numB = parseInt(b.match(/^\d+/) || 0);
    return numA - numB || a.localeCompare(b);
};

const getDocsData = (dirPath) => {
    if (!fs.existsSync(dirPath)) return {};
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')).sort(numericalSort);
    const data = {};
    files.forEach(f => {
        data[f] = fs.readFileSync(path.join(dirPath, f), 'utf8');
    });
    return data;
};

const parseSemanticSpace = () => {
    if (!fs.existsSync(PATHS.ss)) return {};
    const html = fs.readFileSync(PATHS.ss, 'utf8');
    const regex = /<summary id="(.*?)">.*?<\/summary>\s*<p>(.*?)<\/p>/gs;
    const map = {};
    let match;
    while ((match = regex.exec(html)) !== null) {
        map[match[1]] = match[2].trim().replace(/\s+/g, ' '); 
    }
    return map;
};

// --- MAIN BUILD FUNCTION ---
const build = () => {
    console.log('🔨 Starting static build...');

    // Ensure public directory exists
    if (!fs.existsSync(PATHS.outputDir)) {
        fs.mkdirSync(PATHS.outputDir, { recursive: true });
    }

    try {
        // 1. Build index.html (Dictionary)
        console.log(' -> Baking index.html...');
        let indexHtml = fs.readFileSync(PATHS.templates.index, 'utf8');
        const dictData = JSON.parse(fs.readFileSync(PATHS.dictionary, 'utf8'));
        const ssData = parseSemanticSpace();
        
        indexHtml = indexHtml.replace(/const DICTIONARY = \[.*?\];/s, `const DICTIONARY = ${JSON.stringify(dictData)};`);
        indexHtml = indexHtml.replace(/const SEMANTIC_SPACE = \{.*?\};/s, `const SEMANTIC_SPACE = ${JSON.stringify(ssData)};`);
        fs.writeFileSync(path.join(PATHS.outputDir, 'dictionary.html'), indexHtml);

        // 2. Build grammar.html
        console.log(' -> Baking grammar.html...');
        let grammarHtml = fs.readFileSync(PATHS.templates.grammar, 'utf8');
        const grammarData = getDocsData(PATHS.docs);
        grammarHtml = grammarHtml.replace(/const DOCS_DATA = \{.*?\};/s, `const DOCS_DATA = ${JSON.stringify(grammarData)};`);
        fs.writeFileSync(path.join(PATHS.outputDir, 'grammar.html'), grammarHtml);

        // 3. Build mprf.html
        console.log(' -> Baking mprf.html...');
        let mprfHtml = fs.readFileSync(PATHS.templates.mprf, 'utf8');
        const mprfData = getDocsData(PATHS.docsMp);
        mprfHtml = mprfHtml.replace(/const DOCS_DATA = \{.*?\};/s, `const DOCS_DATA = ${JSON.stringify(mprfData)};`);
        fs.writeFileSync(path.join(PATHS.outputDir, 'mprf.html'), mprfHtml);

        console.log('✅ Success! Files are in /public');
    } catch (err) {
        console.error('❌ Build failed:', err);
    }
};

build();