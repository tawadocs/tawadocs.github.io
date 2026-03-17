function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
}

function renderSidebar() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const filtered = archiveData.filter(a => a.title.toLowerCase().includes(query));

    const groups = {};
    filtered.forEach((a) => {
        const sec = a.section || "Uncategorized";
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(a);
    });

    document.getElementById('sidebar-results').innerHTML = Object.keys(groups).map(section => `
        <div class="sidebar-group-title">${section}</div>
        ${groups[section].map(item => `
            <div class="nav-item" onclick="renderArticle(${item.id})">${item.title}</div>
        `).join('')}
    `).join('');
}

function renderArticle(id) {
    const a = archiveData.find(item => item.id === id);
    const glossData = JSON.parse(a.gloss_data);
    
    const wordsHTML = glossData.map(item => {
        const safeW = btoa(unescape(encodeURIComponent(item.w)));
        const safeG = btoa(unescape(encodeURIComponent(item.g)));
        const safeI = btoa(unescape(encodeURIComponent(item.i)));
        return `<span class="clickable-word" onclick="inspectWord('${safeW}', '${safeG}', '${safeI}', true)">${item.w}</span>`;
    }).join(' ');

    document.getElementById('article-view').innerHTML = `
        <div class="section-tag">${a.section.toUpperCase()}</div>
        <h1 class="article-title">${a.title}</h1>
        <div class="article-body">${wordsHTML}</div>
        <div class="clean-translation"><h4>Translation</h4><p>${a.translation}</p></div>
    `;
}

function openEditor() {
    document.getElementById('editorModal').style.display = 'block';
}

function closeEditor() { 
    document.getElementById('editorModal').style.display = 'none'; 
}

function processDraft() {
    const rawText = document.getElementById('editRaw').value.trim();
    const words = rawText.split(/\s+/);
    const ipas = document.getElementById('editIPA').value.trim().split(/\s+/);
    const glosses = document.getElementById('editGloss').value.trim().split(/\s+/);

    const newArt = {
        id: Date.now(),
        title: document.getElementById('editTitle').value || "Untitled Draft",
        section: document.getElementById('editSection').value || "Drafts",
        translation: document.getElementById('editTrans').value,
        gloss_data: JSON.stringify(words.map((w, i) => ({ w, i: ipas[i] || "", g: glosses[i] || "???" })))
    };

    archiveData.push(newArt);
    renderSidebar();
    renderArticle(newArt.id);
    closeEditor();
}

renderSidebar();
