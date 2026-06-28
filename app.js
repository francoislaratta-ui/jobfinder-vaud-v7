/* ==========================================
JOB FINDER VAUD V14.6.0 PREMIUM IA
Créateur : F. Laratta
========================================== */

/* ==========================================
STORAGE
========================================== */

const STORAGE_KEYS = {
favorites: "jobfinder_favorites",
applications: "jobfinder_applications",
settings: "jobfinder_settings",
stats: "jobfinder_stats",
offers: "jobfinder_offers",
letters: "jobfinder_letters",
filters: "jobfinder_filters"
};

/* ==========================================
CONFIGURATION
========================================== */

const APP_VERSION = "14.2.4";

const WEEKLY_TARGET = 3;
const MONTHLY_TARGET = 12;

/* ==========================================
SAFE HELPERS
========================================== */

function safeArray(arr){
return Array.isArray(arr) ? arr : [];
}

function safeJSON(value, fallback){
if(value === null || value === undefined){
return fallback;
}

try{
return JSON.parse(value);
}catch(e){
return fallback;
}
}

function getStorage(key, fallback = null){
try{
if(typeof localStorage === "undefined"){
return fallback;
}

const value = localStorage.getItem(key);

return value === null ? fallback : value;
}catch(e){
return fallback;
}
}

function setStorage(key, value){
try{
if(typeof localStorage === "undefined"){
return false;
}

localStorage.setItem(
key,
JSON.stringify(value)
);

return true;
}catch(e){
console.error("Erreur stockage :", e);
return false;
}
}

function safeGetValue(element){
return element ? element.value : "";
}

function safeSetText(element, text){
if(element){
element.textContent = text;
}
}

function safeSetHTML(element, html){
if(element){
element.innerHTML = html;
}
}

function escapeHTML(value){
return String(value || "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function normalizeText(value){
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[-–—·•·]/g, " ")
.replace(/[()\/«»"']/g, " ")
.replace(/\./g, " ")
.replace(/\s+/g, " ")
.trim();
}

function containsNormalized(source, search){
const s = normalizeText(source);
const q = normalizeText(search);

if(!s || !q) return false;

if(s.includes(q)) return true;

const words = q.split(" ").filter(w => w.length > 3);
return words.every(w => s.includes(w));
}

/* ==========================================
ETAT APPLICATION
========================================== */

let offers = [];

let favorites =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.favorites),
[]
)
);

let applications =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.applications),
[]
)
);

let settings =
safeJSON(
getStorage(STORAGE_KEYS.settings),
{}
);

let lettersHistory =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.letters),
[]
)
);

let currentCV = null;
let currentCVText = "";
let currentCVAnalysis = null;

let currentLetter = "";
let selectedOffer = null;
let notificationsEnabled = true;
let deferredPrompt = null;

let bestOffer = null;
let filteredOffers = [];
let employersList = [];

/* ==========================================
PROFIL IA V14.6.0
========================================== */

const userProfile = {
targetJobs: [
"Employé de commerce",
"Employée de commerce",
"Employé(e) de commerce",
"Assistant administratif",
"Assistante administrative",
"Gestionnaire de dossier",
"Gestionnaire administratif",
"Collaborateur administratif",
"Collaboratrice administrative",
"Technicien informatique",
"Support informatique",
"Helpdesk",
"Back-office"
],

preferredSectors: [
"Administration",
"Administration publique",
"Fiduciaire",
"Informatique",
"Immobilier",
"Services",
"Santé",
"Assurances",
"Banque",
"Collectivités publiques"
],

preferredRegions: [
"Vaud",
"Lausanne",
"Morges",
"Nyon",
"Vevey",
"Renens",
"Prilly",
"Crissier",
"Ecublens",
"Yverdon",
"Rolle",
"Aigle",
"Montreux"
],

preferredRates: [
"50%",
"60%",
"70%",
"50-60%",
"60-70%",
"50 - 60%",
"60 - 70%",
"50 à 70%",
"50% - 70%",
"50-70%"
],

preferredContracts: [
"CDI",
"CDD",
"Temporaire",
"Fixe"
]
};

const IA_WEIGHTS = {

jobMatch: 25,

sectorMatch: 15,

regionMatch: 15,

rateMatch: 10,

contractBonus: 5,

cvSkillsBonus: 20,

cvLanguagesBonus: 10

};

const MATCH_LEVELS = {
excellent: 85,
good: 70,
average: 60
};

/* ==========================================
FILTRES ACTIFS
========================================== */

let activeFilters = {
jobs: [],
sectors: [],
rates: [],
contracts: [],
regions: [],
sources: [],
employers: [],
matches: [],
sort: "match"
};

/* ==========================================
DOM - REFERENCES PRINCIPALES
========================================== */

const offersContainer =
document.getElementById("offersContainer");

const favoritesContainer =
document.getElementById("favoritesContainer");

const applicationsBoard =
document.getElementById("applicationsBoard");

const lettersHistoryContainer =
document.getElementById("lettersHistoryContainer");

const notificationToggle =
document.getElementById("notificationToggle");

/* ==========================================
BOUTONS PRINCIPAUX
========================================== */

const searchOffersBtn =
document.getElementById("searchOffersBtn");

const resetFiltersBtn =
document.getElementById("resetFiltersBtn");

const btnFilters =
document.getElementById("btnFilters");

const btnReset =
document.getElementById("btnReset");

const btnNotifications =
document.getElementById("btnNotifications");

const btnSettings =
document.getElementById("btnSettings");

/* ==========================================
BOUTONS IA LETTRES
========================================== */

const generateShortLetterBtn =
document.getElementById("generateShortLetter");

const generateStandardLetterBtn =
document.getElementById("generateStandardLetter");

const generatePremiumLetterBtn =
document.getElementById("generatePremiumLetter");

/* ==========================================
BOUTONS LETTRES ACTIONS
========================================== */

const saveLetterBtn =
document.getElementById("saveLetterBtn");

const copyLetterBtn =
document.getElementById("copyLetterBtn");

const pdfLetterBtn =
document.getElementById("pdfLetterBtn");

const wordLetterBtn =
document.getElementById("wordLetterBtn");

const emailLetterBtn =
document.getElementById("emailLetterBtn");

/* ==========================================
CV V14.6 - EXTRACTION REELLE
========================================== */

const cvFile =
document.getElementById("cvFile");

const analyzeCVBtn =
document.getElementById("analyzeCVBtn");

const cvAnalysisResult =
document.getElementById("cvAnalysisResult");

if(cvFile){

cvFile.addEventListener(
"change",
handleCVFileSelected
);

}

if(analyzeCVBtn){

analyzeCVBtn.addEventListener(
"click",
analyzeCV
);

}

function handleCVFileSelected(){

if(
!cvFile ||
!cvFile.files ||
cvFile.files.length === 0
){
return;
}

const file =
cvFile.files[0];

const fileName =
file.name.toLowerCase();

const allowedExtensions =
[
".pdf",
".docx",
".txt"
];

const isAllowed =
allowedExtensions.some(
extension =>
fileName.endsWith(extension)
);

if(!isAllowed){

alert("Format non accepté. Merci d'importer un CV en PDF, DOCX ou TXT.");

return;

}

currentCV = {
name: file.name,
type: file.type,
size: file.size,
extension: fileName.split(".").pop()
};

saveCurrentCV();

if(cvAnalysisResult){

cvAnalysisResult.innerHTML = `
<div class="cv-analysis-card">

<h3>📄 CV chargé</h3>

<p class="cv-name">${currentCV.name}</p>

<p class="cv-meta">📄 ${currentCV.extension.toUpperCase()} : ${Math.round(currentCV.size / 1024)} Ko • ✅ Prêt</p>

<p class="cv-meta">ℹ️ Clique sur Analyser mon CV pour extraire le contenu.</p>

</div>
`;

}

}


function saveCurrentCV(){

localStorage.setItem(
"jobfinder_current_cv",
JSON.stringify({
cv: currentCV,
text: currentCVText,
analysis: currentCVAnalysis
})
);

}

async function extractTXT(file){

return await file.text();

}

async function extractPDF(file){

const buffer =
await file.arrayBuffer();

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const pdf =
await pdfjsLib.getDocument({
data: buffer
}).promise;

let text = "";

for(
let page = 1;
page <= pdf.numPages;
page++
){

const currentPage =
await pdf.getPage(page);

const content =
await currentPage.getTextContent();

const pageText =
content.items
.map(item => item.str)
.join(" ");

text += pageText + "\n";

}

return text;

}

async function extractDOCX(file){

const buffer =
await file.arrayBuffer();

const result =
await mammoth.extractRawText({
arrayBuffer: buffer
});

return result.value || "";

}

async function extractCVContent(file){

const fileName =
file.name.toLowerCase();

if(fileName.endsWith(".txt")){
return await extractTXT(file);
}

if(fileName.endsWith(".pdf")){
return await extractPDF(file);
}

if(fileName.endsWith(".docx")){
return await extractDOCX(file);
}

return "";

}

function analyzeExtractedText(text){

const normalized =
normalizeText(text);

const software = [];

const languages = [];

const adminSkills = [];

const supportSkills = [];

const softwareKeywords = [
"excel",
"word",
"outlook",
"powerpoint",
"sap",
"erp",
"crm",
"windows",
"office"
];

const languageKeywords = [
"français",
"anglais",
"allemand",
"italien"
];

const adminKeywords = [
"gestion administrative",
"gestion de dossiers",
"facturation",
"comptabilité",
"classement",
"archivage",
"correspondance",
"service client",
"téléphone",
"email",
"planification",
"organisation"
];

const supportKeywords = [
"support informatique",
"helpdesk",
"technicien informatique",
"installation",
"maintenance",
"dépannage"
];

softwareKeywords.forEach(keyword => {

if(
normalized.includes(
normalizeText(keyword)
)
){
software.push(keyword);
}

});

languageKeywords.forEach(keyword => {

if(
normalized.includes(
normalizeText(keyword)
)
){
languages.push(keyword);
}

});

adminKeywords.forEach(keyword => {

if(
normalized.includes(
normalizeText(keyword)
)
){
adminSkills.push(keyword);
}

});

supportKeywords.forEach(keyword => {

if(
normalized.includes(
normalizeText(keyword)
)
){
supportSkills.push(keyword);
}

});

const skills = [
...software,
...adminSkills,
...supportSkills,
...languages
];

return {

wordCount:
text
.split(/\s+/)
.filter(Boolean)
.length,

skills,
software,
languages,
adminSkills,
supportSkills

};

}

async function analyzeCV(){

if(
!cvFile ||
!cvFile.files ||
cvFile.files.length === 0
){

if(currentCV){

alert(
"CV déjà chargé : " +
(currentCV.name || "CV sauvegardé")
);

return;

}

alert("Veuillez d'abord importer votre CV.");

return;

}

try{

const file =
cvFile.files[0];

const fileName =
file.name.toLowerCase();

const allowedExtensions =
[
".pdf",
".docx",
".txt"
];

const isAllowed =
allowedExtensions.some(
extension =>
fileName.endsWith(extension)
);

if(!isAllowed){

alert("Format non accepté. Merci d'importer un CV en PDF, DOCX ou TXT.");

return;

}

currentCV = {
name: file.name,
type: file.type,
size: file.size,
extension: fileName.split(".").pop()
};

if(cvAnalysisResult){

cvAnalysisResult.innerHTML = `
<div class="cv-analysis-card">

<h3>⏳ Analyse du CV</h3>

<p class="cv-meta">Extraction du contenu en cours...</p>

</div>
`;

}

currentCVText =
await extractCVContent(file);

currentCVAnalysis =
analyzeExtractedText(currentCVText);

saveCurrentCV();

const skillsText =
currentCVAnalysis.skills.length
? currentCVAnalysis.skills.join(", ")
: "Aucune compétence détectée";

if(cvAnalysisResult){

cvAnalysisResult.innerHTML = `
<div class="cv-analysis-card">

<h3>📄 CV analysé</h3>

<p class="cv-name"><strong>${currentCV.name}</strong></p>

<p class="cv-meta">📄 ${currentCV.extension.toUpperCase()} : ${Math.round(currentCV.size / 1024)} Ko</p>

<p class="cv-meta">📝 ${currentCVAnalysis.wordCount} mots détectés</p>

<p class="cv-skills">🎯 ${skillsText}</p>

</div>
`;

}

}catch(error){

console.error(
"Erreur analyse CV :",
error
);

alert("Impossible d'analyser le contenu du CV.");

}

}

/* ==========================================
FILTRES AVANCES
========================================== */
const employerFilter =
document.getElementById("employerFilter");

const sortFilter =
document.getElementById("sortFilter");

/* ==========================================
NOTIFICATIONS
========================================== */
/* ==========================================
UTILITAIRES
========================================== */

function formatDate(date){
if(!date){
return "";
}

try{
return new Date(date).toLocaleDateString("fr-CH");
}catch(e){
return String(date);
}

}

function generateId(){
return Date.now().toString() +
Math.random().toString(36).substring(2, 8);
}

function showSuccess(message){
if(!notificationsEnabled){
return;
}

alert("✅ " + message);
}

function showInfo(message){
if(!notificationsEnabled){
return;
}

alert("ℹ️ " + message);
}

function showError(message){
alert("❌ " + message);
}


/* ==========================================
TAB NAVIGATION
========================================== */

function openTab(tabId){
const tabs =
document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
tab.classList.remove("active-tab");
});

const target =
document.getElementById(tabId);

if(target){
target.classList.add("active-tab");

window.scrollTo({
top: 0,
behavior: "smooth"
});
}
}

/* ==========================================
INITIALISATION UI
========================================== */

function initUI(){

document.querySelectorAll(".main-tabs button").forEach(button => {
button.addEventListener("click", () => {
const tab = button.dataset.tab;

if(tab){
openTab(tab);
}

});
});

const refreshOffersBtn =
document.getElementById("refreshOffersBtn");

if(refreshOffersBtn){
refreshOffersBtn.addEventListener("click", async () => {

const isFirst = !localStorage.getItem("jobfinder_filters");

if(isFirst){
refreshOffersBtn.disabled = true;
refreshOffersBtn.innerHTML = `🔄 Chargement...<br>⏳ Veuillez patienter...`;
try{
await loadOffers(true, false);
const selectedMetiers = [...document.querySelectorAll('input[name="metiers"]:checked')].map(cb => cb.value);
console.log("Cases cochées:", selectedMetiers);
saveFilters();
applyFilters();
openTab("filters");
setTimeout(() => {
const firstOffer = document.querySelector(".offer-card");
if(firstOffer){
firstOffer.scrollIntoView({ behavior: "smooth", block: "start" });
}
}, 300);
}finally{
refreshOffersBtn.disabled = false;
refreshOffersBtn.innerHTML = `💡 Rechercher avec mes critères`;
}
return;
}

refreshOffersBtn.disabled = true;

refreshOffersBtn.innerHTML = `
🔄 Actualisation des offres...<br>
⏳ Veuillez patienter...
`;

try{

await loadOffers(true, true);

saveFilters();
applyFilters();

showSuccess(`${filteredOffers.length} offres correspondent à vos critères !`);

openTab("filters");

}catch(error){

console.error("Erreur actualisation manuelle :", error);

}finally{

refreshOffersBtn.disabled = false;

refreshOffersBtn.innerHTML = `
💡 Rechercher avec mes critères
`;

}

});
}

document.querySelectorAll(".clickable-card").forEach(card => {
card.addEventListener("click", () => {
const target =
card.dataset.target;

if(target){
openTab(target);

window.scrollTo({
top:0,
behavior:"smooth"
});
}

});
});

document.getElementById("floatingFavorites")
?.addEventListener("click", () => {
openTab("favorites");
});

document.getElementById("floatingApplications")
?.addEventListener("click", () => {
openTab("applications");
});

document.getElementById("floatingAI")
?.addEventListener("click", () => {
openTab("ai");
});

document.getElementById("floatingTop")
?.addEventListener("click", () => {
window.scrollTo({
top:0,
behavior:"smooth"
});
});

const floatingActions =
document.querySelector(".floating-actions");

const floatingToggle =
document.getElementById("floatingToggle");

if(floatingActions && floatingToggle){

let floatingButtonsVisible = true;

floatingToggle.addEventListener("click", () => {

floatingButtonsVisible = !floatingButtonsVisible;

document.querySelectorAll(".floating-btn:not(.floating-toggle)")
.forEach(btn => {
btn.style.display =
floatingButtonsVisible ? "flex" : "none";
});

floatingToggle.innerHTML =
floatingButtonsVisible
? `<i class="ti ti-eye-off" style="font-size:14px;"></i><br>Masquer`
: `<i class="ti ti-eye" style="font-size:14px;"></i><br>Afficher`;

});

}

const navButtons = [
{ button:"btnDashboard", tab:"dashboard" },
{ button:"btnFilters", tab:"filters" },
{ button:"btnFavorites", tab:"favorites" },
{ button:"btnApplications", tab:"applications" },
{ button:"btnAI", tab:"ai" },
{ button:"btnStats", tab:"stats" },
{ button:"btnSettings", tab:"settings" },
{ button:"btnNotifications", tab:"notifications" }
];

navButtons.forEach(item => {
const btn = document.getElementById(item.button);

if(btn){
btn.addEventListener("click", () => {
openTab(item.tab);
});
}

});

if(notificationToggle){
notificationToggle.addEventListener("click", () => {
notificationsEnabled = !notificationsEnabled;

notificationToggle.textContent =
notificationsEnabled
? "Notifications activées"
: "Notifications désactivées";
});
}

if(btnNotifications){
btnNotifications.addEventListener("click", () => {
openTab("notifications");
});
}

if(btnFilters){
btnFilters.addEventListener("click", () => {
openTab("filters");
});
}

if(btnSettings){
btnSettings.addEventListener("click", () => {
openTab("settings");
});
}


if(btnReset){
btnReset.addEventListener("click", () => {
localStorage.removeItem("jobfinder_filters");
localStorage.removeItem("jobfinder_visited");
location.reload();
});
}

if(resetFiltersBtn){
resetFiltersBtn.addEventListener("click", () => {
localStorage.removeItem("jobfinder_filters");
localStorage.removeItem("jobfinder_visited");
location.reload();
});
}

if(sortFilter){
sortFilter.addEventListener("change", applyFilters);
}

}

/* ==========================================
TOGGLE SELECT ALL
========================================== */

function toggleSelectAll(masterCheckbox, groupName){
const checkboxes = masterCheckbox
.closest('.filter-content')
.querySelectorAll(`input[name="${groupName}"]`);

checkboxes.forEach(cb => {
cb.checked = masterCheckbox.checked;
});

applyFilters();
}

/* ==========================================
APPLY FILTERS
========================================== */

function applyFilters(){

    const selectedMetiers = [
        ...document.querySelectorAll('input[name="metiers"]:checked')
    ].map(cb => cb.value);

    const selectedSecteurs = [
        ...document.querySelectorAll('input[name="secteurs"]:checked')
    ].map(cb => cb.value);

    const selectedTaux = [
        ...document.querySelectorAll('input[name="taux"]:checked')
    ].map(cb => cb.value);

    const selectedContrats = [
        ...document.querySelectorAll('input[name="contrats"]:checked')
    ].map(cb => cb.value);

    const selectedRegions = [
        ...document.querySelectorAll('input[name="regions"]:checked')
    ].map(cb => cb.value);

    const selectedSources = [
        ...document.querySelectorAll('input[name="sources"]:checked')
    ].map(cb => cb.value);

    const selectedMatches = [
        ...document.querySelectorAll('input[name="matches"]:checked')
    ].map(cb => cb.value);

    const totalTaux = document.querySelectorAll('input[name="taux"]').length;
    const totalRegions = document.querySelectorAll('input[name="regions"]').length;
    const totalSources = document.querySelectorAll('input[name="sources"]').length;
    const totalContrats = document.querySelectorAll('input[name="contrats"]').length;
    const totalSecteurs = document.querySelectorAll('input[name="secteurs"]').length;
    const totalMetiers = document.querySelectorAll('input[name="metiers"]').length;

    activeFilters.sort = sortFilter ? sortFilter.value : "match";

    let result = [...offers];

    const SCRAPE_KEYWORDS = [
"employe de commerce",
"assistant administratif",
"assistante administrative",
"gestionnaire de dossier",
"gestionnaire administratif",
"gestionnaire de depot",
"gestionnaire contentieux",
"gestionnaire logistique",
"gestionnaire approvisionnement",
"technicien informatique",
"technicien support",
"technicien maintenance",
"technicien systeme",
"technicien alarme",
"support informatique",
"support utilisateur",
"it support",
"network support",
"specialiste support",
"helpdesk",
"back office",
"collaborateur administratif",
"collaborateur service",
"coordinateur administratif",
"administrateur gestionnaire",
"employe administratif",
"assistant de direction",
"assistant rh",
"conseiller clientele"
];

const selectAllMetiers = document.getElementById("selectAllMetiers");

const METIER_KEYWORDS = {
    "Employé de commerce": ["employe de commerce","employé de commerce"],
    "Employé administratif": ["employe administratif","employé administratif"],
    "Assistant administratif": ["assistant administratif","assistante administrative"],
    "Assistant de direction": ["assistant de direction","assistante de direction"],
    "Gestionnaire de dossier": ["gestionnaire de dossier","gestionnaire dossier"],
    "Gestionnaire administratif": ["gestionnaire administratif"],
    "Collaborateur administratif": ["collaborateur administratif","collaboratrice administrative"],
    "Coordinateur administratif": ["coordinateur administratif","coordinatrice administrative"],
    "Assistant RH": ["assistant rh","assistante rh","ressources humaines"],
    "Conseiller clientèle": ["conseiller clientele","conseillere clientele","service client"],
    "Support utilisateur": ["support utilisateur","support informatique","it support"],
    "Technicien informatique": ["technicien informatique","technicienne informatique"],
    "Helpdesk": ["helpdesk","help desk"],
    "Back-office": ["back office","back-office"]
};

if(selectedMetiers.length > 0){
    result = result.filter(offer => {
        const titleNorm = normalizeText(offer.title);
        if(selectAllMetiers?.checked){
            return SCRAPE_KEYWORDS.some(k =>
                k.split(" ").filter(w => w.length > 4)
                .some(w => titleNorm.includes(w))
            );
        }
        return selectedMetiers.some(m => {
            const keywords = METIER_KEYWORDS[m] || [normalizeText(m)];
            return keywords.some(k => titleNorm.includes(normalizeText(k)));
        });
    });
}

if(selectedSecteurs.length > 0 && selectedSecteurs.length < totalSecteurs){
    result = result.filter(offer =>
        !offer.sector ||
        selectedSecteurs.some(s =>
            containsNormalized(offer.sector, s)
        )
    );
}

if(selectedTaux.length > 0 && selectedTaux.length < totalTaux){
    const hasPartialTaux = selectedTaux.some(t => {
        const n = parseInt(t);
        return (!isNaN(n) && n <= 80) || t === "Temps partiel";
    });
    const has100 = selectedTaux.includes("100") || selectedTaux.includes("Temps plein");

    result = result.filter(offer => {
        const desc = normalizeText(offer.description || "");
        const hasPartTimeDesc = /temps partiel|part-time|teilzeit|mi-temps/.test(desc);

        if(!offer.rate){
            if(hasPartialTaux && hasPartTimeDesc) return true;
            if(has100 && !hasPartTimeDesc) return true;
            return false;
        }
        const rateNorm = normalizeText(offer.rate);
        return selectedTaux.some(t => {
            if(t === "Temps partiel") return hasPartTimeDesc;
            if(t === "Temps plein") return !hasPartTimeDesc;
            const tNum = parseInt(t);
            if(isNaN(tNum)) return containsNormalized(offer.rate, t);
            const match = rateNorm.match(/(\d+)/g);
            if(!match) return false;
            const nums = match.map(Number);
            return nums.some(n => Math.abs(n - tNum) <= 10);
        });
    });
}

if(selectedContrats.length > 0 && selectedContrats.length < totalContrats){
    result = result.filter(offer => {
        if(offer.contract){
            return selectedContrats.some(c =>
                containsNormalized(offer.contract, c)
            );
        }
        // Chercher dans la description si contrat non renseigné
        const desc = offer.description || "";
        return selectedContrats.some(c => {
            const cn = normalizeText(c);
            const dn = normalizeText(desc);
            if(cn === "cdi") return /cdi|duree indeterminee|indeterminee|fixe/.test(dn);
            if(cn === "cdd") return /cdd|duree determinee|determinee/.test(dn);
            if(cn === "temporaire") return /temporaire|interim/.test(dn);
            return dn.includes(cn);
        });
    });
}

if(selectedRegions.length > 0 && selectedRegions.length < totalRegions){
    result = result.filter(offer => {
        if(!offer.location) return false;
        return selectedRegions.some(r =>
            containsNormalized(offer.location, r)
        );
    });
}

if(selectedSources.length > 0 && selectedSources.length < totalSources){
    result = result.filter(offer =>
        !offer.source ||
        selectedSources.some(s =>
            containsNormalized(offer.source, s)
        )
    );
}

    // Match IA = tri uniquement, pas de filtre

    if(activeFilters.sort === "match"){
        result.sort((a, b) =>
            calculateMatch(b) - calculateMatch(a)
        );
    }else if(activeFilters.sort === "date"){
        result.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );
    }else if(activeFilters.sort === "company"){
        result.sort((a, b) =>
            (a.company || "").localeCompare(b.company || "", "fr")
        );
    }

    filteredOffers = result;

    renderOffers(filteredOffers);
    updateDashboard();
    updateBestMatch();
    updateStatistics();

}

/* ==========================================
RESET FILTERS
========================================== */

function resetFilters(){

    activeFilters = {
        jobs: [],
        sectors: [],
        rates: [],
        contracts: [],
        regions: [],
        sources: [],
        employers: [],
        matches: [],
        sort: "match"
    };

    localStorage.removeItem("jobfinder_filters");

    document.querySelectorAll('input[type="checkbox"]')
        .forEach(cb => cb.checked = false);

    filteredOffers = [...offers];
    renderOffers(filteredOffers);
    updateBestMatch();
    updateStatistics();
}

/* ==========================================
SAUVEGARDE FILTRES
========================================== */

function saveFilters(){
    const groups = [
        "metiers",
        "secteurs",
        "taux",
        "contrats",
        "regions",
        "sources",
        "matches"
    ];

    const saved = {};
    groups.forEach(group => {
        saved[group] = [...document.querySelectorAll(
            `input[name="${group}"]:checked`
        )].map(cb => cb.value);
    });

    if(sortFilter){
        saved.sort = sortFilter.value;
    }

    localStorage.setItem("jobfinder_filters", JSON.stringify(saved));
}

/* ==========================================
RESTAURATION FILTRES
========================================== */

function restoreSavedFilters(){

    const saved = safeJSON(
        localStorage.getItem("jobfinder_filters"),
        null
    );

    if(!saved) return;

    const hasAny = Object.keys(saved)
        .filter(k => k !== "sort")
        .some(k => (saved[k] || []).length > 0);

    if(!hasAny) return;

    const groups = [
        "metiers",
        "secteurs",
        "taux",
        "contrats",
        "regions",
        "sources",
        "matches"
    ];

    groups.forEach(group => {
        const values = saved[group] || [];
        values.forEach(value => {
            const cb = document.querySelector(
                `input[name="${group}"][value="${value}"]`
            );
            if(cb) cb.checked = true;
        });
    });

    if(saved.sort && sortFilter){
        sortFilter.value = saved.sort;
    }

    if(
        groups.some(g => (saved[g] || []).length > 0) ||
        saved.sort !== "match"
    ){
        setTimeout(() => applyFilters(), 500);
    }
}


/* ==========================================
MATCH IA - DETAILS
========================================== */

function getOfferText(offer){
return [
offer.title,
offer.company,
offer.sector,
offer.location,
offer.address,
offer.rate,
offer.contract,
offer.source,
offer.description
]
.join(" ");
}

function matchAnyOfferField(offer, values){
const text = getOfferText(offer);

return safeArray(values).some(value =>
containsNormalized(text, value)
);
}

function matchExactOrContains(value, values){
const source = normalizeText(value);

return safeArray(values).some(item => {
const target = normalizeText(item);

return source === target ||
source.includes(target) ||
target.includes(source);
});
}

function calculateMatchDetails(offer){
if(!offer){
return {
score: 0,
reasons: [],
missing: []
};
}

let score = 0;
const reasons = [];
const missing = [];

const offerText =
normalizeText(
getOfferText(offer)
);

/* METIER */
const jobOk =
matchAnyOfferField(
offer,
userProfile.targetJobs
);

if(jobOk){
score += IA_WEIGHTS.jobMatch;
reasons.push("Métier compatible");
}else{
missing.push("Métier peu ciblé");
}

/* SECTEUR */
const sectorOk =
matchAnyOfferField(
offer,
userProfile.preferredSectors
);

if(sectorOk){
score += IA_WEIGHTS.sectorMatch;
reasons.push("Secteur intéressant");
}else{
missing.push("Secteur moins prioritaire");
}

/* REGION */
const regionOk =
matchAnyOfferField(
offer,
userProfile.preferredRegions
);

if(regionOk){
score += IA_WEIGHTS.regionMatch;
reasons.push("Région compatible");
}else{
missing.push("Région à vérifier");
}

/* TAUX */
const rateText =
String(offer.rate || "");

const rateOk =
userProfile.preferredRates.some(rate =>
containsNormalized(rateText, rate)
) ||
/50|60|70/.test(rateText);

if(rateOk){
score += IA_WEIGHTS.rateMatch;
reasons.push("Taux compatible");
}else{
missing.push("Taux à vérifier");
}

/* CONTRAT */
const contractOk =
matchExactOrContains(
offer.contract,
userProfile.preferredContracts
);

if(contractOk){
score += IA_WEIGHTS.contractBonus;
reasons.push("Contrat compatible");
}else{
missing.push("Contrat à vérifier");
}

/* BONUS CV - COMPETENCES */
if(
currentCVAnalysis &&
currentCVAnalysis.skills &&
currentCVAnalysis.skills.length
){

const matchingSkills =
currentCVAnalysis.skills.filter(skill =>
offerText.includes(
normalizeText(skill)
)
);

if(matchingSkills.length > 0){

const skillBonus =
Math.min(
IA_WEIGHTS.cvSkillsBonus,
matchingSkills.length * 5
);

score += skillBonus;

reasons.push(
"CV compatible : " + matchingSkills.join(", ")
);

}else{

missing.push("Compétences CV peu visibles dans l'offre");

}

}else{

missing.push("CV non analysé");

}

/* BONUS CV - LANGUES */
if(
currentCVAnalysis &&
currentCVAnalysis.languages &&
currentCVAnalysis.languages.length
){

const matchingLanguages =
currentCVAnalysis.languages.filter(language =>
offerText.includes(
normalizeText(language)
)
);

if(matchingLanguages.length > 0){

const languageBonus =
Math.min(
IA_WEIGHTS.cvLanguagesBonus,
matchingLanguages.length * 5
);

score += languageBonus;

reasons.push(
"Langues CV utiles : " + matchingLanguages.join(", ")
);

}

}

/* BONUS SALAIRE */
if(offer.salary){
const salary =
parseInt(
String(offer.salary || "")
.replace(/[^\d]/g, ""),
10
);

if(!isNaN(salary) && salary >= 55000){
score += 5;
reasons.push("Salaire potentiellement intéressant");
}
}

/* LIMITES */
score = Math.max(0, Math.min(100, score));

return {
score: Math.round(score),
reasons,
missing
};
}

function calculateMatch(offer){
return calculateMatchDetails(offer).score;
}

function getMatchBadge(score){
if(score >= MATCH_LEVELS.excellent){
return "🤘🏼 Très bon match";
}

if(score >= MATCH_LEVELS.good){
return "🤙🏼 Bon match";
}

if(score >= MATCH_LEVELS.average){
return "🫣 Match possible";
}

return "🔎 À vérifier";
}

function getMatchClass(score){
if(score >= 90){
return "match-90";
}

if(score >= 80){
return "match-80";
}

if(score >= 70){
return "match-70";
}

return "match-60";
}

function getAverageMatch(data = offers){
const list = safeArray(data);

if(!list.length){
return 0;
}

const total =
list.reduce((sum, offer) =>
sum + calculateMatch(offer), 0
);

return Math.round(total / list.length);
}


/* ==========================================
STORAGE SAVE
========================================== */

function saveLetters(){
setStorage(
STORAGE_KEYS.letters,
lettersHistory
);
}

function saveFavorites(){
setStorage(
STORAGE_KEYS.favorites,
favorites
);
}

function saveApplications(){
setStorage(
STORAGE_KEYS.applications,
applications
);
}

function saveSettings(){
setStorage(
STORAGE_KEYS.settings,
settings
);
}

/* ==========================================
VALIDATION URL SOURCE
========================================== */

function isRealOfferUrlClient(url){

if(!url){
return false;
}

const cleanUrl =
url.toLowerCase().trim();

const genericUrls = [
"https://www.vd.ch",
"https://vd.ch",
"https://www.jobup.ch",
"https://jobup.ch",
"https://www.indeed.com",
"https://indeed.com",
"https://www.jobscout24.ch",
"https://jobscout24.ch",
"https://www.linkedin.com",
"https://linkedin.com"
];

if(genericUrls.includes(cleanUrl)){
return false;
}

return (

/* JOBUP */
cleanUrl.includes("jobup.ch/fr/emplois/detail/") ||
cleanUrl.includes("jobup.ch/de/jobs/detail/") ||

/* JOBSCOUT24 */
cleanUrl.includes("jobscout24.ch/fr/job/") ||
cleanUrl.includes("jobscout24.ch/de/job/") ||

/* INDEED */
cleanUrl.includes("indeed.com/viewjob") ||
cleanUrl.includes("indeed.ch/viewjob") ||

/* LINKEDIN */
cleanUrl.includes("linkedin.com/jobs/view/") ||

/* ETAT DE VAUD */
(cleanUrl.includes("vd.ch") &&
cleanUrl.includes("emploi")) ||

/* VILLE DE LAUSANNE */
(cleanUrl.includes("lausanne.ch") &&
cleanUrl.includes("emploi")) ||

/* RETRAITES POPULAIRES */
(cleanUrl.includes("retraitespopulaires.ch") &&
cleanUrl.includes("emploi")) ||

/* EPFL */
(cleanUrl.includes("epfl.ch") &&
cleanUrl.includes("job")) ||

/* MIGROS */
(cleanUrl.includes("migros.ch") &&
cleanUrl.includes("emploi")) ||

/* CHUV */
(cleanUrl.includes("chuv.ch") &&
cleanUrl.includes("emploi")) ||

/* GENERIQUE */
cleanUrl.includes("/jobs/view/") ||
cleanUrl.includes("/job/") ||
cleanUrl.includes("/emploi/") ||
cleanUrl.includes("/offre/")
);
}

/* ==========================================
RAPATRIEMENT DESCRIPTIFS
========================================== */

async function enrichOffersDescriptions(list){

if(!Array.isArray(list)){
return [];
}

const results = await Promise.all(
list.map(async (offer) => {

const isEtatVaud = offer.source === "État de Vaud";

const descriptionMissing =
!offer.description ||
offer.description === "Descriptif non disponible." ||
isEtatVaud;

const realOfferUrl =
isRealOfferUrlClient(offer.offerUrl);

if(!descriptionMissing || !realOfferUrl){
return offer;
}

if(!offer.offerUrl){
return offer;
}

try{

const response =
await fetch("/api/extract-description", {
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
url:offer.offerUrl,
source:offer.source || "",
id:offer.id || ""
})
});

if(!response.ok){
throw new Error("HTTP " + response.status);
}

const data =
await response.json();

return {
...offer,
description: data.description || "Descriptif non disponible.",
rate: data.rate || offer.rate || "",
contract: offer.source === "Jobup"
? (offer.contract || data.contract || "")
: (data.contract || offer.contract || ""),
address: data.address || offer.address || "",
startDate: data.startDate || offer.startDate || "",
applyBefore: data.applyBefore || offer.applyBefore || "",
salaryGrade: data.salaryGrade || offer.salaryGrade || "",
salary: data.salary || offer.salary || "",
date: data.date || offer.date || ""
};

}catch(error){

console.warn(
"Description non récupérée :",
offer.title,
error
);

return offer;

}

})
);

return results;

}

/* ==========================================
DECOUVERTE URLS REELLES
========================================== */

async function discoverRealOfferUrls(list){

const safeList =
Array.isArray(list) ? list : [];

const results = await Promise.all(
safeList.map(async (offer) => {

try{

if(!offer || !offer.offerUrl){
return offer;
}

if(isRealOfferUrlClient(offer.offerUrl)){
return offer;
}

const response =
await fetch("/api/discover-offer-url", {
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({ offer })
});

if(!response.ok) return offer;

const result = await response.json();

if(result.success && result.discoveredUrl){
return {
...offer,
offerUrl: result.discoveredUrl,
originalOfferUrl: offer.offerUrl,
urlDiscovered: true
};
}

return offer;

}catch(error){

console.warn(
"Découverte URL impossible :",
offer?.title || "",
error
);

return offer;

}

})
);

return results;

}


/* ==========================================
CHARGEMENT OFFRES
========================================== */

async function loadOffers(skipRender = false, skipRestore = false){

try{

const response =
await fetch("/api/offers");

if(!response.ok){
throw new Error("HTTP " + response.status);
}

const data =
await response.json();

offers =
Array.isArray(data)
? data
: [];

offers =
offers.map(offer => ({
...offer,

id:
String(
offer.id ||
offer.externalId ||
generateId()
),

offerUrl:
offer.offerUrl ||
offer.url ||
offer.link ||
"",

address:
offer.address || "",

salary:
offer.salary || "",

source:
offer.source || "Source inconnue",

sector:
offer.sector || "",

location:
offer.location ||
offer.region ||
"",

rate:
offer.rate ||
offer.workRate ||
"",

contract:
offer.contract ||
offer.contractType ||
"",

title:
offer.title || "",

company:
offer.company ||
offer.employer ||
"",

date:
offer.date ||
offer.publishedAt ||
"",

description:
offer.description ||
offer.details ||
offer.summary ||
offer.tasks ||
offer.text ||
offer.content ||
offer.body ||
offer.profile ||
offer.mission ||
offer.responsibilities ||
"Descriptif non disponible."
}));

offers =
await discoverRealOfferUrls(offers);

offers =
await enrichOffersDescriptions(offers);

filteredOffers = [...offers];

const rawFilters = safeJSON(localStorage.getItem("jobfinder_filters"), null);
const hasAny = rawFilters && Object.keys(rawFilters)
    .filter(k => k !== "sort")
    .some(k => (rawFilters[k] || []).length > 0);

if(hasAny && !skipRestore){
    restoreSavedFilters();
}else if(!skipRender){
    renderOffers(filteredOffers);
}

updateDashboard();
updateBestMatch();
updateNotifications();
updateStatistics();

}
catch(error){

console.error(
"Erreur chargement offres :",
error
);

offers = [];
filteredOffers = [];

if(offersContainer){
offersContainer.innerHTML = `
<div class="offer-card">
<div class="offer-title">
❌ Erreur de chargement des offres
</div>
<div class="offer-reasons">
Ouvre la console du navigateur pour voir le détail technique.
</div>
</div>
`;
}

}

}

/* ==========================================
ACTUALISER OFFRES V14.6
========================================== */

async function refreshOffers(){

try{

const response = await fetch("/api/scrape", { method: "POST" });
const data = await response.json();

await loadOffers();
applyFilters();
showSuccess(`${filteredOffers.length} offres correspondent à vos critères !`);

}catch(error){

console.error("Erreur refresh:", error);
await loadOffers();
showInfo("Offres actualisées");

}

}

/* ==========================================
RENDER OFFRES
========================================== */

function renderOffers(data){
if(!offersContainer){
return;
}

offersContainer.innerHTML = "";

updateResultsSummary(data);

if(!data || data.length === 0){
offersContainer.innerHTML = `
<div class="offer-card">
<div class="offer-title">
Aucune offre trouvée
</div>
</div>
`;

return;
}

data.forEach(offer => {
const card = createOfferCard(offer);
offersContainer.appendChild(card);
});
}

/* ==========================================
CREATION CARTE OFFRE
========================================== */

function createOfferCard(offer){

const card =
document.createElement("div");

card.className = "offer-card";
card.setAttribute("data-offer-id", offer.id);
card.style.cursor = "pointer";
card.addEventListener("click", (e) => {
    if(e.target.closest("button")) return;
    openTab("filters");
    setTimeout(() => {
        const fullCard = document.querySelector(`[data-offer-id="${offer.id}"]`);
        if(fullCard) fullCard.scrollIntoView({ behavior: "smooth" });
    }, 300);
});

const details =
calculateMatchDetails(offer);

const match =
details.score;

const matchClass =
getMatchClass(match);

const badge =
getMatchBadge(match);

const rawDesc =
offer.description ||
offer.details ||
offer.summary ||
offer.tasks ||
offer.text ||
offer.content ||
"Descriptif non disponible.";

const descHtml = offer.source === "Jobup"
? escapeHTML(rawDesc).replace(/\n/g, "<br>")
: escapeHTML(rawDesc);

// Nettoyage + formatage adresse
const formatAddress = (addr) => {
if(!addr) return "";
const clean = addr
.replace(/À propos de cette offre[\s\S]*/i, "")
.replace(/Autres recherches[\s\S]*/i, "")
.replace(/Offres similaires[\s\S]*/i, "")
.trim();
return clean.split("\n")
.map(l => l.trim())
.filter(Boolean)
.join("<br>");
};

const addressHtml = formatAddress(offer.address);

// Vérifier si la ville est déjà dans l'adresse
const locationInAddress = offer.address &&
offer.location &&
offer.address.toLowerCase().includes(offer.location.toLowerCase());

card.innerHTML = `
<div class="offer-title">
💼 ${escapeHTML(offer.title)}
</div>

<div class="offer-employer-block">
<div class="offer-company">🏢 ${escapeHTML(offer.company)}</div>
${addressHtml ? `<div class="offer-address">${addressHtml}</div>` : ""}
</div>

${!locationInAddress ? `
<div class="offer-location">
📍 ${escapeHTML(offer.location)}
</div>
` : ""}

${offer.rate ? `
<div class="offer-meta">
⏰ Taux : ${escapeHTML(offer.rate)}
</div>
` : ""}

${offer.contract ? `
<div class="offer-meta">
📄 ${escapeHTML(offer.contract)}
</div>
` : ""}

${offer.startDate ? `
<div class="offer-meta">
🗓️ Entrée : ${escapeHTML(offer.startDate)}
</div>
` : ""}

${offer.applyBefore ? `
<div class="offer-meta">
⏳ Postuler avant : ${escapeHTML(offer.applyBefore)}
</div>
` : ""}

${offer.salaryGrade ? `
<div class="offer-meta">
💰 Classe salariale : ${escapeHTML(offer.salaryGrade)}
</div>
` : ""}

${offer.salary ? `
<div class="offer-salary">
💰 ${escapeHTML(offer.salary)}
</div>
` : ""}

<div class="offer-source">
🔎 ${escapeHTML(offer.source)}
</div>

<div class="offer-date">
📅 Publié le : ${escapeHTML(offer.date)}
</div>

${offer.offerUrl ? `
<div class="offer-url">
🌐 URL disponible
</div>
` : ""}

<div class="offer-match ${matchClass}">
🤖 Match IA : ${match}% = ${escapeHTML(badge)}
</div>

<div class="offer-reasons">

<div class="ia-reasons-grid">
<div>✓ Métier compatible</div>
<div>✓ Contrat compatible</div>
<div>✓ Secteur intéressant</div>
<div>✓ Salaire intéressant</div>
<div>✓ Expérience cohérente</div>
</div>

<div class="ia-check-block">
<strong>🧐 Points à vérifier :</strong>
<ul>
<li>Compétences spécifiques à confirmer</li>
<li>Compétences CV peu visibles</li>
</ul>
</div>

</div>

<button class="description-toggle">
▼ Voir le descriptif complet
</button>

<div class="offer-description hidden">
${descHtml}
</div>

<div class="offer-actions">
<button class="offer-btn favorite-btn">⭐ Favori</button>
<button class="offer-btn apply-btn">🚀 Postuler</button>
<button class="offer-btn ai-btn">🤖 Lettre IA</button>
<button class="offer-btn letter-btn">📧 Email</button>
<button class="offer-btn link-btn">🔗 Offre</button>
</div>
`;

const favBtn =
card.querySelector(".favorite-btn");

const applyBtn =
card.querySelector(".apply-btn");

const aiBtn =
card.querySelector(".ai-btn");

const letterBtn =
card.querySelector(".letter-btn");

const linkBtn =
card.querySelector(".link-btn");

const descriptionToggle =
card.querySelector(".description-toggle");

const descriptionBlock =
card.querySelector(".offer-description");

favBtn?.addEventListener("click", () => addFavorite(offer));

descriptionToggle?.addEventListener("click", () => {

descriptionBlock.classList.toggle("hidden");

const isHidden =
descriptionBlock.classList.contains("hidden");

descriptionToggle.innerHTML =
isHidden
? "▼ Voir le descriptif complet"
: "▲ Masquer le descriptif";

});

applyBtn?.addEventListener("click", () => addApplication(offer));

aiBtn?.addEventListener("click", () => {
selectedOffer = offer;
openTab("ai");
showInfo("Offre sélectionnée pour lettre IA");
});

letterBtn?.addEventListener("click", () => {
selectedOffer = offer;
openTab("letters");
showInfo("Offre sélectionnée pour email");
});

linkBtn?.addEventListener("click", () => openOffer(offer));

return card;
}


/* ==========================================
OUVRIR OFFRE V14.6
========================================== */

function openOffer(offer){

if(!offer){
showInfo("Aucune offre sélectionnée");
return;
}

const url =
String(
offer.offerUrl ||
offer.url ||
offer.link ||
""
).trim();

if(!url){
showInfo("Aucun lien disponible pour cette offre");
return;
}

window.open(
url,
"_blank",
"noopener,noreferrer"
);

}


/* ==========================================
BEST MATCH
========================================== */

function updateBestMatch(){

const container =
document.getElementById("bestMatchContainer");

if(!container){
return;
}

const list =
Array.isArray(filteredOffers) && filteredOffers.length > 0
? filteredOffers
: offers;

container.innerHTML = "";

if(!Array.isArray(list) || list.length === 0){

container.innerHTML = `
<div class="empty-state">
Aucune offre analysée
</div>
`;

return;

}

const sorted =
[...list]
.filter(offer => offer && offer.id)
.sort((a,b) =>
calculateMatch(b) - calculateMatch(a)
)
.slice(0, 3);

if(sorted.length === 0){

container.innerHTML = `
<div class="empty-state">
Aucune offre analysée
</div>
`;

return;

}

bestOffer =
sorted[0];

sorted.forEach((offer, index) => {

const match =
calculateMatch(offer);

const badge =
getMatchBadge(match);

const matchClass =
getMatchClass(match);

const topLabel =
index === 0
? "🔥 Top Match"
: `#${index + 1}`;

const card =
document.createElement("div");

card.className =
index === 0
? "offer-card best-match"
: "offer-card";

card.setAttribute(
"data-offer-id",
offer.id
);

card.style.cursor =
"pointer";

card.innerHTML = `
<div class="offer-title">
💼 ${escapeHTML(offer.title)}
</div>

<div class="offer-company">
🏢 ${escapeHTML(offer.company)} • ${escapeHTML(topLabel)}
</div>

<div class="offer-match ${matchClass}">
🤖 Match IA : ${match}% — ${escapeHTML(badge)}
</div>
`;

card.addEventListener("click", () => {

openTab("filters");

setTimeout(() => {

const fullCard =
document.querySelector(
`#offersContainer [data-offer-id="${offer.id}"]`
);

if(fullCard){

fullCard.scrollIntoView({
behavior: "smooth",
block: "center"
});

fullCard.style.outline =
"2px solid #7c3aed";

setTimeout(() => {
fullCard.style.outline = "";
}, 2000);

}

}, 400);

});

container.appendChild(card);

});

}

/* ==========================================
RESULTS SUMMARY
========================================== */

function updateResultsSummary(data){
const list =
safeArray(data);

const total =
list.length;

const recommended =
list.filter(o =>
calculateMatch(o) >= MATCH_LEVELS.excellent
).length;

const recent =
list.filter(o =>
String(o.date || "")
.toLowerCase()
.includes("aujourd")
).length;

safeSetText(
document.getElementById("resultsCounter"),
`💼 Offres trouvées : ${total}`
);

safeSetText(
document.getElementById("recommendedCounter"),
`🔥 Très recommandées : ${recommended}`
);

safeSetText(
document.getElementById("newOffersCounter"),
`🆕 Nouvelles offres : ${recent}`
);

safeSetText(
document.getElementById("averageMatchCounter"),
`🤖 Match moyen IA : ${getAverageMatch(list)}%`
);
}

/* ==========================================
FAVORIS
========================================== */

function addFavorite(offer){
const exists =
favorites.find(f => f.id === offer.id);

if(exists){
showInfo("Déjà dans les favoris");
return;
}

favorites.push({
...offer,
priority: getMatchBadge(calculateMatch(offer)),
match: calculateMatch(offer),
savedAt: new Date().toISOString()
});

saveFavorites();
renderFavorites();
updateDashboard();

showSuccess("Ajouté aux favoris");
}

function renderFavorites(){
if(!favoritesContainer){
return;
}

favoritesContainer.innerHTML = "";

if(favorites.length === 0){
favoritesContainer.innerHTML = `
<div class="offer-card">
<div class="offer-title">Aucun favori</div>
</div>
`;

return;
}

favorites.forEach(item => {
const card =
document.createElement("div");

card.className = "offer-card";

card.innerHTML = `
<div class="offer-title">
⭐ ${escapeHTML(item.title)}
</div>
<div class="offer-company">
🏢 ${escapeHTML(item.company)}
</div>
<div class="offer-location">
📍 ${escapeHTML(item.location)}
</div>
<div class="offer-meta">
${escapeHTML(item.priority || getMatchBadge(calculateMatch(item)))}
</div>
<div class="offer-actions">
<button class="offer-btn open">🔗</button>
<button class="offer-btn delete">🗑️</button>
</div>
`;

card.querySelector(".open")?.addEventListener("click", () => {
openOffer(item);
});

card.querySelector(".delete")?.addEventListener("click", () => {
favorites =
favorites.filter(f => f.id !== item.id);

saveFavorites();
renderFavorites();
updateDashboard();
});

favoritesContainer.appendChild(card);
});
}

/* ==========================================
CANDIDATURES
========================================== */

function addApplication(offer){
const exists =
applications.find(a => a.id === offer.id);

if(exists){
showInfo("Déjà en candidature");
return;
}

applications.push({
...offer,
status: "Envoyée",
match: calculateMatch(offer),
createdAt: new Date().toISOString(),
lastUpdate: new Date().toISOString()
});

saveApplications();
renderApplications();
updateDashboard();

showSuccess("Candidature ajoutée");
}

function renderApplications(){
const sent =
document.getElementById("sentApplications");

const response =
document.getElementById("receivedResponses");

const interview =
document.getElementById("scheduledInterviews");

const hired =
document.getElementById("successfulApplications");

if(!sent || !response || !interview || !hired){
return;
}

sent.innerHTML = "";
response.innerHTML = "";
interview.innerHTML = "";
hired.innerHTML = "";

applications.forEach(app => {
const card =
document.createElement("div");

card.className = "offer-card";

card.innerHTML = `
<div class="offer-title">
💼 ${escapeHTML(app.title)}
</div>
<div class="offer-company">
🏢 ${escapeHTML(app.company)}
</div>

<div class="offer-meta">
📌 ${escapeHTML(app.status)}
&nbsp;&nbsp;|&nbsp;&nbsp;
🤖 ${calculateMatch(app)}%
</div>

<div class="offer-actions">
<button class="offer-btn status">🔄</button>
<button class="offer-btn open">🔗</button>
<button class="offer-btn delete">🗑️</button>
</div>
`;

card.querySelector(".status")?.addEventListener("click", () => {
changeStatus(app.id);
});

card.querySelector(".open")?.addEventListener("click", () => {
openOffer(app);
});

card.querySelector(".delete")?.addEventListener("click", () => {
removeApplication(app.id);
});

if(app.status === "Envoyée"){
sent.appendChild(card);
}

if(app.status === "Réponse"){
response.appendChild(card);
}

if(app.status === "Entretien"){
interview.appendChild(card);
}

if(app.status === "Embauche"){
hired.appendChild(card);
}
});

updateApplicationCounters();
}

function changeStatus(id){
const app =
applications.find(a => a.id === id);

if(!app){
return;
}

if(app.status === "Envoyée"){
app.status = "Réponse";
}else if(app.status === "Réponse"){
app.status = "Entretien";
}else if(app.status === "Entretien"){
app.status = "Embauche";
}else{
app.status = "Envoyée";
}

app.lastUpdate =
new Date().toISOString();

saveApplications();
renderApplications();
updateDashboard();
}

function removeApplication(id){
applications =
applications.filter(a => a.id !== id);

saveApplications();
renderApplications();
updateDashboard();
}/* ==========================================
COMPTEURS CANDIDATURES
========================================== */

function updateApplicationCounters(){
const sentCount =
applications.filter(a => a.status === "Envoyée").length;

const responseCount =
applications.filter(a => a.status === "Réponse").length;

const interviewCount =
applications.filter(a => a.status === "Entretien").length;

const hiredCount =
applications.filter(a => a.status === "Embauche").length;

safeSetText(
document.getElementById("applicationsCount"),
sentCount
);

safeSetText(
document.getElementById("responsesCount"),
responseCount
);

safeSetText(
document.getElementById("interviewsCount"),
interviewCount
);

safeSetText(
document.getElementById("hiredCount"),
hiredCount
);

updateStatistics();
}

/* ==========================================
STATISTIQUES
========================================== */

function updateStatistics(){
const total =
applications.length;

const response =
applications.filter(a => a.status === "Réponse").length;

const interview =
applications.filter(a => a.status === "Entretien").length;

const hired =
applications.filter(a => a.status === "Embauche").length;

const responseRate =
total ? Math.round((response / total) * 100) : 0;

const interviewRate =
total ? Math.round((interview / total) * 100) : 0;

const successRate =
total ? Math.round((hired / total) * 100) : 0;

safeSetText(
document.getElementById("responseRate"),
responseRate + "%"
);

safeSetText(
document.getElementById("interviewRate"),
interviewRate + "%"
);

safeSetText(
document.getElementById("successRate"),
successRate + "%"
);

safeSetText(
document.getElementById("averageMatch"),
getAverageMatch(filteredOffers.length ? filteredOffers : offers) + "%"
);
}

/* ==========================================
LETTRES IA - HELPERS
========================================== */

function getApplicantBlock(){
return [
"François L.",
"Adresse",
"NPA Ville",
"Téléphone",
"Email"
].join("\n");
}

function getEmployerBlock(offer){
return [
offer.company || "Entreprise",
offer.address || "",
offer.location || ""
]
.filter(Boolean)
.join("\n");
}

function getLetterHeader(offer){
const title =
offer.title ||
"Candidature";

return `
${getApplicantBlock()}

${getEmployerBlock(offer)}

Lausanne, le ${new Date().toLocaleDateString("fr-CH")}

${title}
`;
}

function generateShortLetter(offer){
if(!offer){
return;
}

const letter = `
${getLetterHeader(offer)}

Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${offer.title} au sein de ${offer.company || "votre entreprise"}.

Motivé, rigoureux et à l’aise dans les tâches administratives, je souhaite mettre mes compétences au service de votre équipe.

Je reste volontiers à votre disposition pour un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

François L.
`.trim();

displayLetter(letter);
}

function generateStandardLetter(offer){
if(!offer){
return;
}

const letter = `
${getLetterHeader(offer)}

Madame, Monsieur,

Suite à votre annonce, je souhaite vous proposer ma candidature pour le poste de ${offer.title}.

Mon parcours m’a permis de développer de solides compétences en gestion administrative, suivi de dossiers, communication professionnelle et utilisation des outils numériques. Ces compétences me permettent de travailler avec méthode, précision et sens des priorités.

Votre offre correspond à mon intérêt pour un poste structuré, utile et orienté service. Je serais heureux de pouvoir contribuer efficacement aux activités de ${offer.company || "votre organisation"}.

Je me tiens volontiers à votre disposition pour un entretien afin de vous présenter plus en détail ma motivation.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

François L.
`.trim();

displayLetter(letter);
}

function generatePremiumLetter(offer){
if(!offer){
return;
}

const score =
calculateMatch(offer);

const details =
calculateMatchDetails(offer);

const strengths =
details.reasons.length
? details.reasons.join(", ").toLowerCase()
: "mon profil administratif et polyvalent";

const letter = `
${getLetterHeader(offer)}

Madame, Monsieur,

Votre offre pour le poste de ${offer.title} a retenu toute mon attention. Elle présente une compatibilité estimée à ${score}% avec mon profil, notamment grâce aux éléments suivants : ${strengths}.

Mon expérience en gestion de dossiers, organisation administrative, suivi des informations et utilisation des outils numériques me permet d’aborder ce poste avec sérieux et efficacité. Je suis particulièrement attentif à la qualité du travail fourni, à la clarté des échanges et au respect des priorités.

Rejoindre ${offer.company || "votre équipe"} représenterait pour moi l’opportunité de mettre mes compétences au service d’un environnement professionnel exigeant et concret.

Je serais heureux de pouvoir vous rencontrer afin d’échanger sur ma candidature et sur les besoins du poste.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

François L.
`.trim();

displayLetter(letter);
}

/* ==========================================
AFFICHAGE LETTRE
========================================== */

function displayLetter(letter){
currentLetter = letter;

safeSetText(
document.getElementById("letterResult"),
letter
);

openTab("ai");
}

/* ==========================================
SAUVEGARDE LETTRES
========================================== */

function saveCurrentLetter(){
if(!currentLetter){
showInfo("Aucune lettre à sauvegarder");
return;
}

lettersHistory.unshift({
id: generateId(),
content: currentLetter,
offerId: selectedOffer ? selectedOffer.id : null,
offerTitle: selectedOffer ? selectedOffer.title : "",
company: selectedOffer ? selectedOffer.company : "",
createdAt: new Date().toISOString()
});

saveLetters();
renderLettersHistory();

showSuccess("Lettre sauvegardée");
}

function renderLettersHistory(){
const container =
lettersHistoryContainer;

if(!container){
return;
}

container.innerHTML = "";

if(lettersHistory.length === 0){
container.innerHTML = `
<div class="offer-card">
<div class="offer-title">Aucune lettre sauvegardée</div>
</div>
`;

return;
}

lettersHistory.forEach(item => {
const div =
document.createElement("div");

div.className = "letter-history-card";

div.innerHTML = `
<div class="letter-history-title">
📄 ${escapeHTML(item.offerTitle || "Lettre")}
</div>
<div class="letter-history-date">
${escapeHTML(formatDate(item.createdAt))}
</div>
<div class="offer-company">
🏢 ${escapeHTML(item.company || "")}
</div>
<div class="offer-actions">
<button class="offer-btn view">👁️</button>
<button class="offer-btn delete">🗑️</button>
</div>
`;

div.querySelector(".view")?.addEventListener("click", () => {
displayLetter(item.content);
});

div.querySelector(".delete")?.addEventListener("click", () => {
deleteLetter(item.id);
});

container.appendChild(div);
});
}

function deleteLetter(id){
lettersHistory =
lettersHistory.filter(l => l.id !== id);

saveLetters();
renderLettersHistory();
}

function copyCurrentLetter(){
if(!currentLetter){
showInfo("Aucune lettre à copier");
return;
}

navigator.clipboard
.writeText(currentLetter)
.then(() => {
showSuccess("Lettre copiée");
})
.catch(() => {
showError("Copie impossible");
});
}

/* ==========================================
EXPORT PDF / WORD / EMAIL
========================================== */

function exportPDF(){
if(!currentLetter){
showInfo("Aucune lettre");
return;
}

const printable =
window.open("", "_blank");

if(!printable){
showError("Fenêtre PDF bloquée par le navigateur");
return;
}

printable.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Lettre de motivation</title>
<style>
body{
font-family: Arial, sans-serif;
line-height: 1.6;
padding: 40px;
white-space: pre-wrap;
}
</style>
</head>
<body>${escapeHTML(currentLetter)}</body>
</html>
`);

printable.document.close();
printable.focus();
printable.print();

showSuccess("Fenêtre PDF prête");
}

function exportWord(){
if(!currentLetter){
showInfo("Aucune lettre");
return;
}

const html =
`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Lettre de motivation</title>
</head>
<body>
<pre style="font-family: Arial; white-space: pre-wrap;">
${escapeHTML(currentLetter)}
</pre>
</body>
</html>
`;

const blob =
new Blob(
[html],
{ type: "application/msword;charset=utf-8" }
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;
a.download = "lettre-motivation.doc";

document.body.appendChild(a);
a.click();
a.remove();

URL.revokeObjectURL(url);

showSuccess("Word généré");
}

function exportEmail(){
if(!currentLetter){
showInfo("Aucune lettre");
return;
}

const subject =
encodeURIComponent(
selectedOffer
? `Candidature - ${selectedOffer.title}`
: "Candidature"
);

const body =
encodeURIComponent(currentLetter);

window.location.href =
`mailto:?subject=${subject}&body=${body}`;
}


/* ==========================================
EXPORT JSON
========================================== */

function exportJSON(){
const data = {
version: APP_VERSION,
favorites,
applications,
lettersHistory,
settings,
exportDate: new Date().toISOString()
};

const blob =
new Blob(
[JSON.stringify(data, null, 2)],
{ type: "application/json" }
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;
a.download = "jobfinder_export_v14_2_0.json";

document.body.appendChild(a);
a.click();
a.remove();

URL.revokeObjectURL(url);

showSuccess("Export JSON OK");
}

/* ==========================================
EXPORT CSV
========================================== */

function csvEscape(value){
return `"${String(value || "").replace(/"/g, '""')}"`;
}

function exportCSV(){
let csv =
"Type,Titre,Entreprise,Statut,Match\n";

applications.forEach(app => {
csv += [
"CANDIDATURE",
csvEscape(app.title),
csvEscape(app.company),
csvEscape(app.status),
calculateMatch(app)
].join(",") + "\n";
});

favorites.forEach(fav => {
csv += [
"FAVORI",
csvEscape(fav.title),
csvEscape(fav.company),
csvEscape(fav.priority),
calculateMatch(fav)
].join(",") + "\n";
});

const blob =
new Blob(
[csv],
{ type: "text/csv;charset=utf-8" }
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;
a.download = "jobfinder_export_v14_2_0.csv";

document.body.appendChild(a);
a.click();
a.remove();

URL.revokeObjectURL(url);

showSuccess("CSV exporté");
}

/* ==========================================
IMPORT DONNEES
========================================== */

function importData(file){
const reader =
new FileReader();

reader.onload = (event) => {
try{
const data =
JSON.parse(event.target.result);

favorites =
safeArray(data.favorites);

applications =
safeArray(data.applications);

lettersHistory =
safeArray(data.lettersHistory);

settings =
data.settings || {};

saveFavorites();
saveApplications();
saveLetters();
saveSettings();

renderFavorites();
renderApplications();
renderLettersHistory();
updateDashboard();

showSuccess("Import OK");
}catch(err){
console.error(err);
showError("Fichier invalide");
}
};

reader.readAsText(file);
}

/* ==========================================
BOUTONS LETTRES IA
========================================== */

generateShortLetterBtn?.addEventListener("click", () => {
if(!selectedOffer){
return showInfo("Sélectionnez une offre");
}

generateShortLetter(selectedOffer);
});

generateStandardLetterBtn?.addEventListener("click", () => {
if(!selectedOffer){
return showInfo("Sélectionnez une offre");
}

generateStandardLetter(selectedOffer);
});

generatePremiumLetterBtn?.addEventListener("click", () => {
if(!selectedOffer){
return showInfo("Sélectionnez une offre");
}

generatePremiumLetter(selectedOffer);
});

saveLetterBtn?.addEventListener("click", saveCurrentLetter);
copyLetterBtn?.addEventListener("click", copyCurrentLetter);
pdfLetterBtn?.addEventListener("click", exportPDF);
wordLetterBtn?.addEventListener("click", exportWord);
emailLetterBtn?.addEventListener("click", exportEmail);

/* ==========================================
BOUTONS EXPORT / IMPORT / RESET
========================================== */

document
.getElementById("exportJsonBtn")
?.addEventListener("click", exportJSON);

document
.getElementById("exportCsvBtn")
?.addEventListener("click", exportCSV);

document
.getElementById("importBtn")
?.addEventListener("click", () => {
const file =
document.getElementById("importFile")?.files?.[0];

if(!file){
showInfo("Choisir fichier");
return;
}

importData(file);
});

document
.getElementById("resetAppBtn")
?.addEventListener("click", () => {
if(!confirm("Reset total ?")){
return;
}

favorites = [];
applications = [];
lettersHistory = [];

saveFavorites();
saveApplications();
saveLetters();

renderFavorites();
renderApplications();
renderLettersHistory();
updateDashboard();

showSuccess("Reset terminé");
});


/* ==========================================
DASHBOARD
========================================== */

function updateDashboard(){

const visibleOffers =
Array.isArray(filteredOffers)
? filteredOffers
: [];

const dashboardOffers =
visibleOffers.length > 0
? visibleOffers
: [];

safeSetText(
document.getElementById("kpiOffers"),
dashboardOffers.length
);

safeSetText(
document.getElementById("kpiFavorites"),
favorites.length
);

safeSetText(
document.getElementById("kpiApplications"),
applications.length
);

safeSetText(
document.getElementById("kpiAI"),
dashboardOffers.length > 0
? getAverageMatch(dashboardOffers) + "%"
: "0%"
);

}

/* ==========================================
NOTIFICATIONS
========================================== */

function updateNotifications(){

const sourceCounts = {};

offers.forEach(offer => {
const source =
offer.source || offer.company || "Autre";

sourceCounts[source] =
(sourceCounts[source] || 0) + 1;
});

const sourceLines =
Object.entries(sourceCounts)
.slice(0, 6)
.map(([source,count]) => {
return `
<div class="alert-source-line">
<span>• ${escapeHTML(source)}</span>
<span>: ${count}</span>
</div>
`;
})
.join("");

const newOffersBox =
document.getElementById("newOffersNotifications");

if(newOffersBox){
newOffersBox.innerHTML =
offers.length
? `
<div class="alert-line">
• ${offers.length} nouvelles offres
</div>
${sourceLines}
`
: "Aucune nouvelle offre";
}

safeSetText(
document.getElementById("favoritesNotifications"),
favorites.length
? "• " + favorites.length + " favoris mis à jour"
: "Aucun favori suivi"
);

safeSetText(
document.getElementById("applicationsNotifications"),
applications.length
? "• " + applications.length + " candidatures à suivre"
: "Aucune relance"
);

safeSetText(
document.getElementById("aiNotifications"),
offers.length
? "• " + offers.filter(offer => Number(offer.match || offer.score || 0) >= 90).length + " offres avec Match > 90%"
: "Aucune alerte IA"
);

}

/* ==========================================
UTILS FINAL SYNC
========================================== */

function updateAll(){
updateDashboard();
updateApplicationCounters();
updateBestMatch();
updateNotifications();
updateStatistics();
}

/* ==========================================
INITIALISATION FINALE
========================================== */

function loadSavedCV(){

const saved =
safeJSON(
localStorage.getItem("jobfinder_current_cv"),
null
);

if(!saved){
return;
}

if(saved.name){

currentCV = saved;
currentCVText = "";
currentCVAnalysis = null;

}else{

currentCV =
saved.cv || null;

currentCVText =
saved.text || "";

currentCVAnalysis =
saved.analysis || null;

}

if(!currentCV){
return;
}

const cvName =
currentCV.name || "CV sauvegardé";

const cvExtension =
currentCV.extension
? currentCV.extension.toUpperCase()
: "FORMAT";

const cvSize =
currentCV.size
? Math.round(currentCV.size / 1024)
: 0;

if(
currentCVText &&
currentCVAnalysis
){

const skillsText =
currentCVAnalysis.skills &&
currentCVAnalysis.skills.length
? currentCVAnalysis.skills.join(", ")
: "Aucune compétence détectée";

if(cvAnalysisResult){

cvAnalysisResult.innerHTML = `
<div class="cv-analysis-card">

<h3>📄 CV analysé restauré</h3>

<p class="cv-name"><strong>${cvName}</strong></p>

<p class="cv-meta">📄 ${cvExtension} : ${cvSize} Ko</p>

<p class="cv-meta">📝 ${currentCVAnalysis.wordCount || 0} mots détectés</p>

<p class="cv-skills">🎯 ${skillsText}</p>

</div>
`;

}

return;

}

if(cvAnalysisResult){

cvAnalysisResult.innerHTML = `
<div class="cv-analysis-card">

<h3>📄 CV chargé</h3>

<p class="cv-name">${cvName}</p>

<p class="cv-meta">📄 ${cvExtension} : ${cvSize} Ko • ✅ Prêt</p>

<p class="cv-meta">ℹ️ Réimporte le fichier uniquement si tu veux lancer une nouvelle analyse.</p>

</div>
`;

}

}


window.addEventListener("DOMContentLoaded", async () => {

initUI();

loadSavedCV();

const rawFilters = safeJSON(localStorage.getItem("jobfinder_filters"), null);
const hasAny = rawFilters && Object.keys(rawFilters)
    .filter(k => k !== "sort")
    .some(k => (rawFilters[k] || []).length > 0);
const isFirstVisit = !hasAny;

if(!isFirstVisit){
restoreSavedFilters();
openTab("filters");
await loadOffers();
}

if(isFirstVisit){
openTab("filters");
setTimeout(() => {
alert("👋 Bienvenue ! Veuillez sélectionner vos critères de recherche puis cliquer sur 💡 Rechercher avec mes critères.");
}, 800);
}

renderFavorites();
renderApplications();
renderLettersHistory();
updateApplicationCounters();

console.log("==================================");
console.log("JOB FINDER VAUD");
console.log("V14.6 PREMIUM IA");
console.log("Extraction CV PDF / DOCX / TXT");
console.log("Créateur F. Laratta");
console.log("==================================");

});

/* ==========================================
FIN APP.JS V14.6 PREMIUM IA
========================================== */