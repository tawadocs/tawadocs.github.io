let currentArticles = [];

// THEME PERSISTENCE
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('tawa-theme', newTheme);
}

// Initial Theme Check
if (localStorage.getItem('tawa-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

// EDITOR MANAGEMENT
function openEditor(id = null) {
    document.getElementById('editorModal').style.display = 'block';
    
    if (id) {
        // Edit Mode: Fetch existing data
        fetch(`/api/article/${id}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('editId').value = data.id;
                document.getElementById('editTitle').value = data.title;
                document.getElementById('editSection').value = data.section;
                document.getElementById('editRaw').value = data.content_raw;
                document.getElementById('editTrans').value = data.translation;
                
                const glossData = JSON.parse(data.gloss_data);
                document.getElementById('editIPA').value = glossData.map(g => g.i).join(' ');
                document.getElementById('editGloss').value = glossData.map(g => g.g).join(' ');
                document.getElementById('modalTitleLabel').innerText = "Edit Manuscript";
            });
    } else {
        // Create Mode: Clear all fields
        document.getElementById('editId').value = "";
        document.getElementById('editTitle').value = "";
        document.getElementById('editSection').value = "";
        document.getElementById('editRaw').value = "";
        document.getElementById('editIPA').value = "";
        document.getElementById('editGloss').value = "";
        document.getElementById('editTrans').value = "";
        document.getElementById('modalTitleLabel').innerText = "New Literature";
    }
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
}

// DATA OPERATIONS
async function doSearch() {
    const q = document.getElementById('searchBar').value;
    const res = await fetch(`/api/search?q=${q}`);
    currentArticles = await res.json();
    
    const groups = {};
    currentArticles.forEach((a, idx) => {
        const sec = a.section || "Uncategorized";
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push({ ...a, originalIdx: idx });
    });

    const list = document.getElementById('sidebar-results');
    list.innerHTML = Object.keys(groups).map(section => `
        <div class="sidebar-group-title">${section}</div>
        ${groups[section].map(item => `
            <div class="nav-item" onclick="renderArticle(${item.originalIdx})">${item.title}</div>
        `).join('')}
    `).join('');
}

async function inspectWord(word, gloss, ipa) {
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const body = document.getElementById('inspector-body');
    
    // Play audio from assets
    new Audio(`/static/assets/${cleanWord}.m4a`).play().catch(() => console.log("Audio not found"));

    // Fetch definition from lexicon
    let explanation = "No dictionary entry found in lexicon/.";
    try {
        const response = await fetch(`/static/lexicon/${cleanWord}.txt`);
        if (response.ok) explanation = await response.text();
    } catch (e) {}

    body.innerHTML = `
        <div class="ins-word">${word}</div>
        <div style="color:var(--secondary); font-size:1.1rem; margin-top:5px;">${ipa || '/.../'}</div>
        <div class="ins-gloss">${gloss}</div>
        <div class="ins-text">${explanation}</div>
    `;
}

function renderArticle(index) {
    const a = currentArticles[index];
    const glossData = JSON.parse(a.gloss_data);
    const container = document.getElementById('article-view');

    const wordsHTML = glossData.map(item => `
        <span class="clickable-word" onclick="inspectWord('${item.w}', '${item.g}', '${item.i}')">${item.w}</span>
    `).join(' ');

    container.innerHTML = `
        <div class="section-tag" style="color:var(--accent); font-weight:800; font-size:0.8rem; margin-bottom:15px; letter-spacing:1px;">${a.section.toUpperCase()}</div>
        <h1 class="article-title">${a.title}</h1>
        <div class="article-body">${wordsHTML}</div>
        
        <div class="clean-translation">
            <h4>Translation</h4>
            <p>${a.translation}</p>
        </div>

        <div style="margin-top:60px; display:flex; gap:15px; border-top: 1px solid var(--border); padding-top: 30px;">
            <button class="btn-secondary" onclick="openEditor(${a.id})">Edit Entry</button>
            <button class="btn-secondary" style="color:#ff3b30" onclick="deleteArticle(${a.id})">Delete</button>
        </div>
    `;
}

async function deleteArticle(id) {
    if (!confirm("Are you sure you want to delete this manuscript?")) return;
    await fetch(`/api/delete/${id}`, { method: 'DELETE' });
    location.reload();
}

async function processAndSave() {
    const id = document.getElementById('editId').value;
    const data = {
        id: id || null,
        title: document.getElementById('editTitle').value || "Untitled",
        section: document.getElementById('editSection').value || "General",
        raw: document.getElementById('editRaw').value.trim(),
        translation: document.getElementById('editTrans').value,
        gloss: []
    };

    const words = data.raw.split(/\s+/);
    const ipas = document.getElementById('editIPA').value.trim().split(/\s+/);
    const glosses = document.getElementById('editGloss').value.trim().split(/\s+/);

    // Zipping word, ipa, and gloss arrays
    data.gloss = words.map((w, i) => ({
        w: w, 
        i: ipas[i] || "", 
        g: glosses[i] || "???"
    }));

    const response = await fetch('/api/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    if (response.ok) {
        closeEditor();
        doSearch();
    }
}

// Initial Load
doSearch();
