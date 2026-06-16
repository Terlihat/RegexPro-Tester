/**
 * RegexPro Tester & Extractor
 * Version: v1.0.0
 */

document.addEventListener("DOMContentLoaded", () => {
    const patternInput = document.getElementById("regex-pattern");
    const flagsInput = document.getElementById("regex-flags");
    const testStringInput = document.getElementById("test-string");
    const resultOutput = document.getElementById("result-output");
    const errorDisplay = document.getElementById("regex-error");
    const matchCountDisplay = document.getElementById("match-count");
    const themeSelector = document.getElementById("theme");

    // === Logika Tema (Theme Switcher) ===
    // Muat tema dari Local Storage jika ada
    const savedTheme = localStorage.getItem("regexProTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeSelector.value = savedTheme;

    themeSelector.addEventListener("change", (e) => {
        const newTheme = e.target.value;
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("regexProTheme", newTheme);
    });

    // === Logika Evaluasi Regex ===
    function evaluateRegex() {
        const pattern = patternInput.value;
        const flags = flagsInput.value;
        const testStr = testStringInput.value;

        // Reset display
        errorDisplay.textContent = "";
        matchCountDisplay.textContent = "0";

        if (!pattern || !testStr) {
            resultOutput.innerHTML = '<p class="placeholder-text">Masukkan regex dan teks untuk melihat hasil...</p>';
            return;
        }

        try {
            // Coba kompilasi Regex
            const regex = new RegExp(pattern, flags);
            
            // Mencari kecocokan
            let matches = [];
            let match;
            
            // Jika flag global ada, gunakan matchAll atau loop exec
            if (regex.global) {
                while ((match = regex.exec(testStr)) !== null) {
                    matches.push(match);
                    // Cegah infinite loop jika regex cocok dengan string kosong
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            } else {
                // Jika tidak global, eksekusi sekali saja
                match = regex.exec(testStr);
                if (match) matches.push(match);
            }

            displayResults(matches);
            
        } catch (error) {
            // Tangkap invalid regex (misalnya kurang tutup kurung)
            errorDisplay.textContent = "Error: " + error.message;
            resultOutput.innerHTML = '<p class="placeholder-text">Silakan perbaiki pola regex Anda.</p>';
        }
    }

    // === Menampilkan Hasil ===
    function displayResults(matches) {
        matchCountDisplay.textContent = matches.length;

        if (matches.length === 0) {
            resultOutput.innerHTML = '<p class="placeholder-text">Tidak ada kecocokan yang ditemukan.</p>';
            return;
        }

        resultOutput.innerHTML = "";

        matches.forEach((match, index) => {
            const matchDiv = document.createElement("div");
            matchDiv.className = "match-item";
            
            // Teks penuh yang cocok
            let htmlContent = `<div>Kecocokan #${index + 1}: <span class="match-text">${escapeHTML(match[0])}</span></div>`;
            
            // Cek Capture Groups (grup ekstraksi)
            if (match.length > 1) {
                htmlContent += `<div class="group-list">`;
                for (let i = 1; i < match.length; i++) {
                    if (match[i] !== undefined) {
                        htmlContent += `<div>Group ${i}: <span class="group-item">${escapeHTML(match[i])}</span></div>`;
                    }
                }
                htmlContent += `</div>`;
            }

            matchDiv.innerHTML = htmlContent;
            resultOutput.appendChild(matchDiv);
        });
    }

    // Utilitas untuk mencegah XSS jika test string mengandung tag HTML
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // === Event Listeners (Real-time updates) ===
    patternInput.addEventListener("input", evaluateRegex);
    flagsInput.addEventListener("input", evaluateRegex);
    testStringInput.addEventListener("input", evaluateRegex);
});