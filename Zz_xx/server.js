const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

const DICT_PATH = path.join(__dirname, 'dictionary.json');
const SS_PATH = path.join(__dirname, 'ss.html');

const readDict = () => JSON.parse(fs.readFileSync(DICT_PATH, 'utf8') || '[]');

// --- ROUTES ---

app.get('/search', (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    const dict = readDict();
    const filtered = dict.filter(e => 
        e.word.toLowerCase().includes(query) || 
        e.id.toLowerCase().includes(query)
    );
    res.json(filtered);
});

app.post('/word/:originalWord', (req, res) => {
    const originalWord = req.params.originalWord;
    const updatedEntry = req.body;
    let dict = readDict();

    if (originalWord === '_new') {
        dict.push(updatedEntry);
    } else {
        const index = dict.findIndex(e => e.word === originalWord);
        if (index !== -1) dict[index] = updatedEntry;
        else dict.push(updatedEntry);
    }

    fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
    res.sendStatus(200);
});

app.delete('/word/:word', (req, res) => {
    let dict = readDict();
    dict = dict.filter(e => e.word !== req.params.word);
    fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
    res.sendStatus(200);
});

app.post('/semantic-space/:id', (req, res) => {
    const id = req.params.id;
    const text = req.body.text;
    let content = fs.readFileSync(SS_PATH, 'utf8');

    // Simple regex to find the summary block and its following paragraph
    const regex = new RegExp(`<summary id="${id}">.*?</summary>\\s*<p>.*?</p>`, 's');
    const newBlock = `<summary id="${id}">${id}</summary>\n<p>${text}</p>`;

    if (regex.test(content)) {
        content = content.replace(regex, newBlock);
    } else {
        // Append to the end if not found (before </body> or at end of file)
        content = content.includes('</body>') 
            ? content.replace('</body>', `${newBlock}\n</body>`)
            : content + `\n${newBlock}`;
    }

    fs.writeFileSync(SS_PATH, content);
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Tawa Lexicon running at http://localhost:${PORT}`);
});