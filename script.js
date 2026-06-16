/**
 * RegexPro Tester & Extractor
 * Version: v1.5.0 (Ultimate Edition)
 */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .catch(err => console.error("Gagal mendaftar Service Worker", err));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const patternInput = document.getElementById("regex-pattern");
    const flagsInput = document.getElementById("regex-flags");
    const testStringInput = document.getElementById("test-string");
    const replaceStringInput = document.getElementById("replace-string");
    const highlightOverlay = document.getElementById("highlight-overlay");
    const replaceOutput = document.getElementById("replace-output");
    const resultOutput = document.getElementById("result-output");
    const errorDisplay = document.getElementById("regex-error");
    const matchCountDisplay = document.getElementById("match-count");
    const execTimeDisplay = document.getElementById("exec-time");
    
    const themeSelector = document.getElementById("theme");
    const btnCheatsheet = document.getElementById("toggle-cheatsheet");
    const cheatsheetPanel = document.getElementById("cheatsheet-panel");
    const copyBtn = document.getElementById("copy-btn");
    const exportCsvBtn = document.getElementById("export-csv");
    const exportJsonBtn = document.getElementById("export-json");
    const saveRegexBtn = document.getElementById("save-regex-btn");
    const historySelector = document.getElementById("regex-history");
    const presetSelector = document.getElementById("regex-presets");
    const codeLangSelector = document.getElementById("code-lang");
    const codeSnippetDisplay = document.getElementById("code-snippet");
    const copyCodeBtn = document.getElementById("copy-code-btn");

    let rawMatchesData = []; 
    const MAX_MATCHES = 3000; 

    // Sinkronisasi Presisi UI
    const syncOverlayWidth = () => { highlightOverlay.style.width = testStringInput.clientWidth + "px"; };
    new ResizeObserver(syncOverlayWidth).observe(testStringInput);

    testStringInput.addEventListener("scroll", () => {
        highlightOverlay.scrollTop = testStringInput.scrollTop;
        highlightOverlay.scrollLeft = testStringInput.scrollLeft;
    });

    // History & Presets
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem("regexProHistory")) || [];
        historySelector.innerHTML = '<option value="">-- Pola Tersimpan --</option>';
        history.forEach((item, index) => {
            let opt = document.createElement("option");
            opt.value = index;
            opt.textContent = `/${item.pattern}/${item.flags} (${item.name})`;
            historySelector.appendChild(opt);
        });
    }

    saveRegexBtn.addEventListener("click", () => {
        const pat = patternInput.value;
        const flg = flagsInput.value;
        if (!pat) return alert("Pola regex kosong!");
        const name = prompt("Beri nama pola regex ini:");
        if (!name) return;

        try {
            const history = JSON.parse(localStorage.getItem("regexProHistory")) || [];
            history.push({ name, pattern: pat, flags: flg });
            localStorage.setItem("regexProHistory", JSON.stringify(history));
            loadHistory();
            alert("Pola berhasil disimpan!");
        } catch (e) {
            alert("Gagal menyimpan! Memori browser penuh.");
        }
    });

    historySelector.addEventListener("change", (e) => {
        const history = JSON.parse(localStorage.getItem("regexProHistory")) || [];
        const selected = history[e.target.value];
        if (selected) {
            patternInput.value = selected.pattern;
            flagsInput.value = selected.flags;
            presetSelector.value = "";
            evaluateRegex();
        }
    });

    loadHistory(); 

    const regexLibrary = {
        email: { pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", flags: "g" },
        url: { pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)", flags: "g" },
        ipv4: { pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b", flags: "g" },
        password: { pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$", flags: "gm" }
    };

    presetSelector.addEventListener("change", (e) => {
        const selected = e.target.value;
        if (selected && regexLibrary[selected]) {
            patternInput.value = regexLibrary[selected].pattern;
            flagsInput.value = regexLibrary[selected].flags;
            historySelector.value = "";
            evaluateRegex();
        }
    });

    const savedTheme = localStorage.getItem("regexProTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeSelector.value = savedTheme;
    themeSelector.addEventListener("change", (e) => {
        document.documentElement.setAttribute("data-theme", e.target.value);
        localStorage.setItem("regexProTheme", e.target.value);
    });

    btnCheatsheet.addEventListener("click", () => cheatsheetPanel.classList.toggle("hidden"));

    // Engine Evaluasi
    function evaluateRegex() {
        const pattern = patternInput.value;
        const flags = flagsInput.value;
        const testStr = testStringInput.value;
        const replaceStr = replaceStringInput.value;

        errorDisplay.textContent = "";
        matchCountDisplay.textContent = "0";
        execTimeDisplay.textContent = "0.0";
        rawMatchesData = [];
        highlightOverlay.innerHTML = escapeHTML(testStr); 
        replaceOutput.value = "";
        generateCodeSnippet(pattern, flags);

        if (!pattern) {
            resultOutput.innerHTML = '<p class="placeholder-text">Masukkan regex untuk melihat hasil...</p>';
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            if (testStr) {
                const t0 = performance.now();
                let match;
                let isLimitReached = false;
                let isTimeout = false;

                if (regex.global) {
                    while ((match = regex.exec(testStr)) !== null) {
                        if (performance.now() - t0 > 250) { isTimeout = true; break; }
                        if (rawMatchesData.length >= MAX_MATCHES) { isLimitReached = true; break; }
                        let matchData = [...match];
                        matchData.index = match.index;
                        if (match.groups) matchData.groups = match.groups;
                        rawMatchesData.push(matchData);
                        if (match.index === regex.lastIndex) regex.lastIndex++;
                    }
                } else {
                    match = regex.exec(testStr);
                    if (match) {
                        let matchData = [...match];
                        matchData.index = match.index;
                        if (match.groups) matchData.groups = match.groups;
                        rawMatchesData.push(matchData);
                    }
                }
                
                const t1 = performance.now();
                execTimeDisplay.textContent = (t1 - t0).toFixed(2);

                if (isTimeout) errorDisplay.textContent = "⚠️ Eksekusi dibatalkan: Mencegah browser macet.";
                else if (isLimitReached) errorDisplay.textContent = `⚠️ Batas memori: Hasil dibatasi pada ${MAX_MATCHES} kecocokan.`;

                displayResults(rawMatchesData);
                applyHighlight(rawMatchesData, testStr);
                if (replaceStr !== "") replaceOutput.value = testStr.replace(regex, replaceStr);
            }
        } catch (error) {
            errorDisplay.textContent = error.message.includes("Invalid flags") ? "Error: Flags tidak valid." : "Error: " + error.message;
            resultOutput.innerHTML = '<p class="placeholder-text">Pola regex tidak valid.</p>';
        }
    }

    // Renderer Visual
    function displayResults(matches) {
        matchCountDisplay.textContent = matches.length;
        if (matches.length === 0) {
            resultOutput.innerHTML = '<p class="placeholder-text">Tidak ada kecocokan yang ditemukan.</p>';
            return;
        }
        resultOutput.innerHTML = "";
        const fragment = document.createDocumentFragment();
        
        matches.forEach((match, index) => {
            const matchDiv = document.createElement("div");
            matchDiv.className = "match-item";
            let htmlContent = `<div>Kecocokan #${index + 1}: <span class="match-text">${escapeHTML(match[0])}</span></div>`;
            
            if (match.length > 1 || match.groups) {
                htmlContent += `<div class="group-list">`;
                for (let i = 1; i < match.length; i++) if (match[i] !== undefined) htmlContent += `<div>Group ${i}: <span class="group-item">${escapeHTML(match[i])}</span></div>`;
                if (match.groups) {
                    for (const [key, value] of Object.entries(match.groups)) {
                        if (value !== undefined) htmlContent += `<div>📌 &lt;${escapeHTML(key)}&gt;: <span class="group-item">${escapeHTML(value)}</span></div>`;
                    }
                }
                htmlContent += `</div>`;
            }
            matchDiv.innerHTML = htmlContent;
            fragment.appendChild(matchDiv);
        });
        resultOutput.appendChild(fragment);
    }

    function applyHighlight(matches, testStr) {
        if (matches.length === 0) return;
        let highlightedHTML = "";
        let currentIndex = 0;
        matches.forEach(m => {
            if (m[0].length === 0) return; 
            let before = testStr.substring(currentIndex, m.index);
            highlightedHTML += escapeHTML(before);
            let matchedText = testStr.substring(m.index, m.index + m[0].length);
            highlightedHTML += `<span class="hl-mark">${escapeHTML(matchedText)}</span>`;
            currentIndex = m.index + m[0].length;
        });
        highlightedHTML += escapeHTML(testStr.substring(currentIndex));
        highlightOverlay.innerHTML = highlightedHTML; 
    }

    // Code Generator
    function generateCodeSnippet(pattern, flags) {
        if (!pattern) return codeSnippetDisplay.textContent = "Pilih atau tulis regex terlebih dahulu...";
        const lang = codeLangSelector.value;
        const escapedPattern = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
        let snippet = "";
        if (lang === "javascript") snippet = `const regex = new RegExp('${escapedPattern}', '${flags}');\nconst str = \`Teks pengujian\`;\nconst matches = [...str.matchAll(regex)];\nconsole.log(matches);`;
        else if (lang === "python") snippet = `import re\nregex = re.compile(r"${pattern.replace(/"/g, '\\"')}", re.${flags.includes('i') ? 'IGNORECASE|' : ''}0)\nmatches = regex.finditer("Teks pengujian")\nfor match in matches: print(match.group())`.replace("|0)", ")");
        else if (lang === "php") snippet = `$re = '/${pattern.replace(/\//g, '\\/')}/${flags}';\n$str = 'Teks pengujian';\npreg_match_all($re, $str, $matches, PREG_SET_ORDER, 0);\nvar_dump($matches);`;
        codeSnippetDisplay.textContent = snippet;
    }
    codeLangSelector.addEventListener("change", () => generateCodeSnippet(patternInput.value, flagsInput.value));

    // Export & Copy
    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportCsvBtn.addEventListener("click", () => {
        if (rawMatchesData.length === 0) return alert("Tidak ada data untuk diexport!");
        let maxLength = Math.max(...rawMatchesData.map(m => m.length));
        let headers = ["Full Match"];
        for (let i = 1; i < maxLength; i++) headers.push(`Group ${i}`);
        
        const hasNamedGroups = rawMatchesData.some(m => m.groups);
        if (hasNamedGroups) headers.push("Named Groups");

        let csvContent = headers.join(",") + "\n"; 
        rawMatchesData.forEach(matchArray => {
            let rowData = matchArray.map(item => (item !== undefined && item !== null) ? `"${String(item).replace(/"/g, '""')}"` : '""');
            const padding = maxLength - matchArray.length;
            if (padding > 0) rowData.push(...Array(padding).fill('""'));
            if (hasNamedGroups) {
                const groupsStr = matchArray.groups ? JSON.stringify(matchArray.groups) : "";
                rowData.push(`"${groupsStr.replace(/"/g, '""')}"`);
            }
            csvContent += rowData.join(",") + "\n";
        });
        downloadFile(csvContent, "regex_matches.csv", "text/csv;charset=utf-8;");
    });

    exportJsonBtn.addEventListener("click", () => {
        if (rawMatchesData.length === 0) return alert("Tidak ada data untuk diexport!");
        const jsonData = rawMatchesData.map((m, i) => {
            let obj = { id: i + 1, full_match: m[0] };
            for(let j = 1; j < m.length; j++) obj[`group_${j}`] = m[j] || null;
            if (m.groups) obj.named_groups = m.groups;
            return obj;
        });
        downloadFile(JSON.stringify(jsonData, null, 4), "regex_matches.json", "application/json");
    });

    function copyToClip(btn, text) {
        if (!text) return alert("Kosong!");
        const ori = btn.textContent;
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = "✅ Disalin!";
            setTimeout(() => { btn.textContent = ori; }, 2000);
        });
    }

    copyBtn.addEventListener("click", () => copyToClip(copyBtn, rawMatchesData.map(m => m[0]).join("\n")));
    copyCodeBtn.addEventListener("click", () => copyToClip(copyCodeBtn, codeSnippetDisplay.textContent));

    function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])); }

    patternInput.addEventListener("input", evaluateRegex);
    flagsInput.addEventListener("input", evaluateRegex);
    testStringInput.addEventListener("input", evaluateRegex);
    replaceStringInput.addEventListener("input", evaluateRegex);
});