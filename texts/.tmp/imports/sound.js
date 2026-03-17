async function inspectWord(wEnc, gEnc, iEnc, isEncoded = false) {
    let word = isEncoded ? decodeURIComponent(escape(atob(wEnc))) : wEnc;
    let gloss = isEncoded ? decodeURIComponent(escape(atob(gEnc))) : gEnc;
    let ipa = isEncoded ? decodeURIComponent(escape(atob(iEnc))) : iEnc;

    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    new Audio(`static/assets/${cleanWord}.m4a`).play().catch(() => {});

    let explanation = "Dictionary file not found in /lexicon/ folder.";
    try {
        const response = await fetch(`static/lexicon/${cleanWord}.txt`);
        if (response.ok) explanation = await response.text();
    } catch (e) {}

    document.getElementById('inspector-body').innerHTML = `
        <div class="ins-word">${word}</div>
        <div class="ins-ipa">${ipa || '/.../'}</div>
        <div class="ins-gloss">${gloss}</div>
        <div class="ins-text">${explanation}</div>
    `;
}
