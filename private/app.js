let dictionary = [];

async function loadDictionary() {
  const res = await fetch('/api/words');
  dictionary = await res.json();
  renderResults(dictionary);
}

function renderResults(words) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  words.forEach(entry => {
    const div = document.createElement('div');
    div.innerHTML = `<h3>${entry.word}</h3>` +
      entry.definitions.map((d,i) => `
        <input value="${d.text}" data-idx="${i}" data-word="${entry.word}">
        <input value="${d.frequency || ''}" data-idx="${i}" data-word="${entry.word}" style="width:40px">
      `).join('<br>') +
      `<button onclick="saveWord('${entry.word}')">Save</button>`;
    container.appendChild(div);
  });
}

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderResults(dictionary.filter(d => d.word.toLowerCase().includes(q)));
});

async function saveWord(word) {
  const inputs = document.querySelectorAll(`input[data-word='${word}']`);
  const definitions = [];
  for (let i = 0; i < inputs.length; i += 2) {
    definitions.push({ text: inputs[i].value, frequency: parseInt(inputs[i+1].value)||null });
  }
  await fetch('/api/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, definitions })
  });
  alert('Saved!');
}

loadDictionary();