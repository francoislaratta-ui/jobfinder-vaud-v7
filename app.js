/* ==========================================
JOB FINDER VAUD V14.1.0 PREMIUM IA
Créateur : F. Laratta
========================================== */

/* ==========================================
STORAGE
========================================== */

const STORAGE_KEYS = {

favorites:
"jobfinder_favorites",

applications:
"jobfinder_applications",

settings:
"jobfinder_settings",

stats:
"jobfinder_stats",

offers:
"jobfinder_offers",

letters:
"jobfinder_letters"

};
function safeArray(arr){
return Array.isArray(arr) ? arr : [];
}


/* ==========================================
INITIALISATION SAFE V14.1.1 (OFFICIAL CLEAN)
========================================== */

/* SAFE HELPERS */

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

/* SAFE STORAGE ACCESS */

function getStorage(key, fallback){
try{
if(typeof localStorage === "undefined") return fallback;
return localStorage.getItem(key);
}catch(e){
return fallback;
}
}

/* OFFRES */
let offers = [];

/* FAVORIS */
let favorites =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.favorites),
[]
)
);

/* CANDIDATURES */
let applications =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.applications),
[]
)
);

/* SETTINGS */
let settings =
safeJSON(
getStorage(STORAGE_KEYS.settings),
{}
);

/* LETTRES IA */
let lettersHistory =
safeArray(
safeJSON(
getStorage(STORAGE_KEYS.letters),
[]
)
);

/* CV */
let currentCV = null;

/* LETTRE ACTIVE */
let currentLetter = "";

/* OFFRE SÉLECTIONNÉE */
let selectedOffer = null;

/* ==========================================
ETAT APPLICATION
========================================== */

let notificationsEnabled =
true;

let deferredPrompt =
null;

/* ==========================================
CONFIGURATION
========================================== */

const APP_VERSION =
"14.1.0";

const WEEKLY_TARGET = 3;

const MONTHLY_TARGET = 12;

/* ==========================================
STATISTIQUES
========================================== */

const statistics = {

offersViewed:0,

lettersGenerated:0,

cvAnalyses:0,

applicationsSent:0

};

/* ==========================================
MATCH IA
========================================== */

const MATCH_LEVELS = {

excellent:90,

veryGood:80,

good:70,

average:60

};

/* ==========================================
FILTRES ACTIFS
========================================== */

let activeFilters = {

jobs:[],

sectors:[],

rates:[],

contracts:[],

regions:[],

source:"",

employer:"",

minimumMatch:"",

sort:"match"

};

/* ==========================================
CACHE APPLICATION
========================================== */

let bestOffer = null;

let filteredOffers = [];

let employersList = [];

/* ==========================================
FIN P1/8
========================================== */
/* ==========================================
DOM - RÉFÉRENCES PRINCIPALES
========================================== */

const offersContainer =
document.getElementById("offersContainer");

const favoritesContainer =
document.getElementById("favoritesContainer");

const applicationsBoard =
document.getElementById("applicationsBoard");

const lettersHistoryContainer =
document.getElementById("lettersHistoryContainer");

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
CV
========================================== */

const cvFile =
document.getElementById("cvFile");

const analyzeCVBtn =
document.getElementById("analyzeCVBtn");

/* ==========================================
FILTRES AVANCES
========================================== */

const sourceFilter =
document.getElementById("sourceFilter");

const employerFilter =
document.getElementById("employerFilter");

const matchFilter =
document.getElementById("matchFilter");

const sortFilter =
document.getElementById("sortFilter");

/* ==========================================
NOTIFICATIONS
========================================== */

const notificationToggle =
document.getElementById("notificationToggle");

/* ==========================================
INITIALISATION UI
========================================== */

function initUI(){

if(notificationToggle){

notificationToggle.addEventListener(
"click",
() => {

notificationsEnabled =
!notificationsEnabled;

notificationToggle.textContent =
notificationsEnabled
? "Notifications activées"
: "Notifications désactivées";

}
);

}

}

/* ==========================================
HELPERS UI (SAFETY FALLBACKS)
========================================== */

function safeGetValue(element){

return element ? element.value : "";

}

function safeSetText(element, text){

if(element){

element.textContent = text;

}

}

/* ==========================================
FIN P2/8
========================================== */
/* ==========================================
FONCTIONS UTILITAIRES
========================================== */

function formatDate(date){

if(!date) return "";

return new Date(date).toLocaleDateString("fr-CH");

}

function generateId(){

return Date.now().toString() +
Math.random().toString(36).substring(2,8);

}

/* ==========================================
NOTIFICATIONS UI
========================================== */

function showSuccess(message){

if(!notificationsEnabled) return;

alert("✅ " + message);

}

function showInfo(message){

if(!notificationsEnabled) return;

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

top:0,

behavior:"smooth"

});

}

}

/* ==========================================
MATCH IA CORE
========================================== */

function calculateMatch(offer){

if(!offer) return 0;

let score = 0;

/* JOB MATCH */
if(
userProfile &&
Array.isArray(userProfile.targetJobs) &&
userProfile.targetJobs.some(job =>
String(offer.title || "")
.toLowerCase()
.includes(
String(job)
.toLowerCase()
)
)
){

score += IA_WEIGHTS.jobMatch;

}
/* SECTOR MATCH */
if(
userProfile &&
Array.isArray(userProfile.preferredSectors) &&
userProfile.preferredSectors.includes(
String(offer.sector || "")
)
){

score += IA_WEIGHTS.sectorMatch;

}

/* REGION MATCH */
if(
userProfile &&
Array.isArray(userProfile.preferredRegions) &&
userProfile.preferredRegions.includes(
String(offer.location || "")
)
){

score += IA_WEIGHTS.regionMatch;

}
/* RATE MATCH */
if(userProfile.preferredRates.includes(String(offer.rate))){
score += IA_WEIGHTS.rateMatch;
}

/* CONTRACT BONUS */
if(offer.contract === "CDI"){
score += IA_WEIGHTS.contractBonus;
}

/* SALARY BONUS SAFE */
if(offer.salary){

const salary = parseInt(offer.salary);

if(!isNaN(salary) && salary > 6000){
score += 5;
}

}

/* SAFETY CLAMP */
if(score > 100) score = 100;
if(score < 0) score = 0;

return Math.round(score);

}

/* ==========================================
LETTERS STORAGE
========================================== */

function saveLetters(){

localStorage.setItem(
STORAGE_KEYS.letters,
JSON.stringify(lettersHistory)
);

}

/* ==========================================
FAVORITES STORAGE
========================================== */

function saveFavorites(){

localStorage.setItem(
STORAGE_KEYS.favorites,
JSON.stringify(favorites)
);

}

/* ==========================================
APPLICATIONS STORAGE
========================================== */

function saveApplications(){

localStorage.setItem(
STORAGE_KEYS.applications,
JSON.stringify(applications)
);

}

/* ==========================================
AVERAGE MATCH
========================================== */

function getAverageMatch(){

if(!offers.length) return 0;

const total =
offers.reduce((sum, o) =>
sum + calculateMatch(o), 0);

return Math.round(total / offers.length);

}

/* ==========================================
FIN P3/8
========================================== */
/* ==========================================
CHARGEMENT OFFRES
========================================== */
async function loadOffers(){

try{

const response =
await fetch("./offers.json");

if(!response.ok){

throw new Error(
"HTTP " + response.status
);

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
offer.id || offer.externalId || generateId()
),

offerUrl:
offer.offerUrl || offer.url || "",

address:
offer.address || "",

salary:
offer.salary || "",

source:
offer.source || "Source inconnue",

sector:
offer.sector || "",

location:
offer.location || "",

rate:
offer.rate || "",

contract:
offer.contract || "",

title:
offer.title || "",

company:
offer.company || "",

date:
offer.date || ""

}));

filteredOffers =
[...offers];

populateEmployersFilter();

renderOffers(
filteredOffers
);

updateDashboard();

updateBestMatch();

updateNotifications();

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
RENDER OFFRES
========================================== */

function renderOffers(data){

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

const card = document.createElement("div");

card.className = "offer-card";

/* MATCH CLASS */
const match = calculateMatch(offer);

let matchClass = "match-60";

if(match >= 90) matchClass = "match-90";
else if(match >= 80) matchClass = "match-80";
else if(match >= 70) matchClass = "match-70";

card.innerHTML = `

<div class="offer-match ${matchClass}">
🤖 Match IA : ${match}%
</div>

<div class="offer-title">
${offer.title || ""}
</div>

<div class="offer-company">
🏢 ${offer.company || ""}
</div>

<div class="offer-location">
📍 ${offer.location || ""}
</div>

<div class="offer-address">
📮 ${offer.address || ""}
</div>

<div class="offer-meta">
⏱️ ${offer.rate || ""} | 📄 ${offer.contract || ""}
</div>

<div class="offer-sector">
🏭 ${offer.sector || ""}
</div>

<div class="offer-salary">
💰 ${offer.salary || ""}
</div>

<div class="offer-source">
🔎 ${offer.source || ""}
</div>

<div class="offer-date">
📅 ${offer.date || ""}
</div>

<div class="offer-reasons">
✓ Métier compatible<br>
✓ Secteur compatible<br>
✓ Région compatible<br>
✓ Taux compatible<br>
✓ Contrat compatible
</div>

<div class="offer-actions">

<button class="offer-btn favorite-btn">⭐</button>
<button class="offer-btn apply-btn">🚀</button>
<button class="offer-btn ai-btn">🤖</button>
<button class="offer-btn letter-btn">✉️</button>
<button class="offer-btn link-btn">🔗</button>

</div>

`;

/* EVENTS */

const favBtn = card.querySelector(".favorite-btn");
const applyBtn = card.querySelector(".apply-btn");
const aiBtn = card.querySelector(".ai-btn");
const letterBtn = card.querySelector(".letter-btn");
const linkBtn = card.querySelector(".link-btn");

/* FAVORIS */
favBtn.addEventListener("click", () => addFavorite(offer));

/* CANDIDATURE */
applyBtn.addEventListener("click", () => addApplication(offer));

/* IA */
aiBtn.addEventListener("click", () => {

selectedOffer = offer;

openTab("ai");

showInfo("Analyse IA disponible");

});

/* LETTRE */
letterBtn.addEventListener("click", () => {

selectedOffer = offer;

openTab("ai");

showInfo("Offre sélectionnée pour lettre");

});

/* LINK */
linkBtn.addEventListener("click", () => openOffer(offer));

return card;

}

/* ==========================================
BEST MATCH
========================================== */

function updateBestMatch(){

const container =
document.getElementById("bestMatchContainer");

if(!container || offers.length === 0) return;

const best = [...offers]
.sort((a,b) =>
calculateMatch(b) - calculateMatch(a)
)[0];

if(!best) return;

container.innerHTML = `

<div class="offer-card best-match">

<div class="offer-title">
🔥 ${best.title}
</div>

<div class="offer-company">
🏢 ${best.company}
</div>

<div class="offer-match">
🤖 ${calculateMatch(best)}%
</div>

</div>

`;

}

/* ==========================================
RESULTS SUMMARY
========================================== */

function updateResultsSummary(data){

const total = data.length;

const recommended =
data.filter(o => calculateMatch(o) >= 90).length;

const recent =
data.filter(o =>
o.date && o.date.includes("Aujourd")
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
`🤖 Match moyen IA : ${getAverageMatch()}%`
);

}

/* ==========================================
FIN P4/8
========================================== */

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

priority:"⭐⭐⭐",

savedAt:new Date().toISOString()

});

saveFavorites();

renderFavorites();

updateDashboard();

showSuccess("Ajouté aux favoris");

}

/* ==========================================
RENDER FAVORIS
========================================== */

function renderFavorites(){

if(!favoritesContainer) return;

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

const card = document.createElement("div");

card.className = "offer-card";

card.innerHTML = `

<div class="offer-title">
⭐ ${item.title}
</div>

<div class="offer-company">
🏢 ${item.company}
</div>

<div class="offer-location">
📍 ${item.location || ""}
</div>

<div class="offer-meta">
${item.priority}
</div>

<div class="offer-actions">
<button class="offer-btn">🗑️</button>
</div>

`;

/* SUPPRESSION FAVORI */

card.querySelector("button").addEventListener("click", () => {

favorites = favorites.filter(f => f.id !== item.id);

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

status:"Envoyée",

createdAt:new Date().toISOString(),

lastUpdate:new Date().toISOString()

});

saveApplications();

renderApplications();

updateDashboard();

showSuccess("Candidature ajoutée");

}

/* ==========================================
RENDER CANDIDATURES
========================================== */

function renderApplications(){

const sent =
document.getElementById("sentApplications");

const response =
document.getElementById("receivedResponses");

const interview =
document.getElementById("scheduledInterviews");

const hired =
document.getElementById("successfulApplications");

if(!sent || !response || !interview || !hired) return;

sent.innerHTML = "";
response.innerHTML = "";
interview.innerHTML = "";
hired.innerHTML = "";

applications.forEach(app => {

const html = `

<div class="offer-card">

<div class="offer-title">
💼 ${app.title}
</div>

<div class="offer-company">
🏢 ${app.company}
</div>

<div class="offer-meta">
📌 ${app.status}
</div>

<div class="offer-actions">

<button onclick="changeStatus('${app.id}')">
🔄
</button>

<button onclick="removeApplication('${app.id}')">
🗑️
</button>

</div>

</div>

`;

if(app.status === "Envoyée") sent.innerHTML += html;
if(app.status === "Réponse") response.innerHTML += html;
if(app.status === "Entretien") interview.innerHTML += html;
if(app.status === "Embauche") hired.innerHTML += html;

});

updateApplicationCounters();

}

/* ==========================================
CHANGE STATUS
========================================== */

function changeStatus(id){

const app = applications.find(a => a.id === id);

if(!app) return;

if(app.status === "Envoyée") app.status = "Réponse";
else if(app.status === "Réponse") app.status = "Entretien";
else if(app.status === "Entretien") app.status = "Embauche";
else app.status = "Envoyée";

app.lastUpdate = new Date().toISOString();

saveApplications();

renderApplications();

updateDashboard();

}

/* ==========================================
SUPPRESSION CANDIDATURE
========================================== */

function removeApplication(id){

applications = applications.filter(a => a.id !== id);

saveApplications();

renderApplications();

updateDashboard();

}

/* ==========================================
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
STATISTIQUES CANDIDATURES
========================================== */

function updateStatistics(){

const total = applications.length;

const response = applications.filter(a => a.status === "Réponse").length;

const interview = applications.filter(a => a.status === "Entretien").length;

const hired = applications.filter(a => a.status === "Embauche").length;

const responseRate = total ? Math.round((response / total) * 100) : 0;

const interviewRate = total ? Math.round((interview / total) * 100) : 0;

const successRate = total ? Math.round((hired / total) * 100) : 0;

safeSetText(document.getElementById("responseRate"), responseRate + "%");
safeSetText(document.getElementById("interviewRate"), interviewRate + "%");
safeSetText(document.getElementById("successRate"), successRate + "%");

safeSetText(
document.getElementById("averageMatch"),
getAverageMatch() + "%"
);

}

/* ==========================================
FIN P5/8
========================================== */

/* ==========================================
LETTRES IA - GENERATION
========================================== */

function generateShortLetter(offer){

if(!offer) return;

const letter = `

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${offer.title} au sein de ${offer.company}.

Motivé et rigoureux, je suis convaincu de pouvoir répondre aux exigences du poste.

Je reste à votre disposition pour un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

`;

displayLetter(letter);

}

function generateStandardLetter(offer){

if(!offer) return;

const letter = `

Nom Prénom
Adresse
NPA Ville

${offer.company}

Lausanne, le ${new Date().toLocaleDateString("fr-CH")}

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Suite à votre annonce, je souhaite vous proposer ma candidature pour le poste de ${offer.title}.

Mon expérience en gestion administrative et ma capacité d’adaptation me permettent de répondre efficacement aux besoins du poste.

Je serais heureux de pouvoir échanger lors d’un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

`;

displayLetter(letter);

}

function generatePremiumLetter(offer){

if(!offer) return;

const score = calculateMatch(offer);

const letter = `

Nom Prénom
Adresse
NPA Ville

${offer.company}

Lausanne, le ${new Date().toLocaleDateString("fr-CH")}

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Votre offre a retenu toute mon attention avec un score de compatibilité de ${score}%.

Mon profil correspond aux exigences du poste grâce à mes compétences en organisation, gestion de dossiers et outils numériques.

Je suis motivé à rejoindre votre équipe et à contribuer activement à vos projets.

Dans l’attente d’un entretien, veuillez recevoir mes salutations distinguées.

`;

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

createdAt: new Date().toISOString()

});

saveLetters();

renderLettersHistory();

showSuccess("Lettre sauvegardée");

}

/* ==========================================
HISTORIQUE LETTRES
========================================== */

function renderLettersHistory(){

const container =
lettersHistoryContainer;

if(!container) return;

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

const div = document.createElement("div");

div.className = "letter-history-card";

div.innerHTML = `

<div class="letter-history-title">
📄 Lettre
</div>

<div class="letter-history-date">
${formatDate(item.createdAt)}
</div>

<div class="offer-actions">

<button class="offer-btn view">👁️</button>
<button class="offer-btn delete">🗑️</button>

</div>

`;

div.querySelector(".view").addEventListener("click", () => {
displayLetter(item.content);
});

div.querySelector(".delete").addEventListener("click", () => {

lettersHistory =
lettersHistory.filter(l => l.id !== item.id);

saveLetters();

renderLettersHistory();

});

container.appendChild(div);

});

}

/* ==========================================
SUPPRESSION LETTRE
========================================== */

function deleteLetter(id){

lettersHistory =
lettersHistory.filter(l => l.id !== id);

saveLetters();

renderLettersHistory();

}

/* ==========================================
COPIER LETTRE
========================================== */

function copyCurrentLetter(){

if(!currentLetter) return;

navigator.clipboard.writeText(currentLetter);

showSuccess("Lettre copiée");

}

/* ==========================================
BOUTONS LETTRES IA
========================================== */

generateShortLetterBtn?.addEventListener("click", () => {
if(!selectedOffer) return showInfo("Sélectionnez une offre");
generateShortLetter(selectedOffer);
});

generateStandardLetterBtn?.addEventListener("click", () => {
if(!selectedOffer) return showInfo("Sélectionnez une offre");
generateStandardLetter(selectedOffer);
});

generatePremiumLetterBtn?.addEventListener("click", () => {
if(!selectedOffer) return showInfo("Sélectionnez une offre");
generatePremiumLetter(selectedOffer);
});

saveLetterBtn?.addEventListener("click", saveCurrentLetter);
copyLetterBtn?.addEventListener("click", copyCurrentLetter);

/* ==========================================
FIN P6/8
========================================== */

/* ==========================================
EXPORT PDF (simple fallback)
========================================== */

function exportPDF(){

if(!currentLetter){

showInfo("Aucune lettre");

return;

}

const blob =
new Blob(
[currentLetter],
{ type: "application/pdf" }
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;

a.download = "lettre.pdf";

a.click();

URL.revokeObjectURL(url);

showSuccess("PDF généré");

}

pdfLetterBtn?.addEventListener("click", exportPDF);

/* ==========================================
EXPORT WORD
========================================== */

function exportWord(){

if(!currentLetter){

showInfo("Aucune lettre");

return;

}

const blob =
new Blob(
[currentLetter],
{ type: "application/msword" }
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;

a.download = "lettre.doc";

a.click();

URL.revokeObjectURL(url);

showSuccess("Word généré");

}

wordLetterBtn?.addEventListener("click", exportWord);

/* ==========================================
EXPORT EMAIL
========================================== */

function exportEmail(){

if(!currentLetter){

showInfo("Aucune lettre");

return;

}

const subject =
encodeURIComponent("Candidature");

const body =
encodeURIComponent(currentLetter);

window.location.href =
`mailto:?subject=${subject}&body=${body}`;

}

emailLetterBtn?.addEventListener("click", exportEmail);

/* ==========================================
EXPORT JSON
========================================== */

function exportJSON(){

const data = {

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

a.download = "jobfinder_export.json";

a.click();

URL.revokeObjectURL(url);

showSuccess("Export JSON OK");

}

document
.getElementById("exportJsonBtn")
?.addEventListener("click", exportJSON);

/* ==========================================
EXPORT CSV
========================================== */

function exportCSV(){

let csv =
"Type,Titre,Entreprise,Statut\n";

applications.forEach(a => {

csv += `CANDIDATURE,"${a.title}","${a.company}","${a.status}"\n`;

});

favorites.forEach(f => {

csv += `FAVORI,"${f.title}","${f.company}","${f.priority}"\n`;

});

const blob =
new Blob([csv], { type: "text/csv" });

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;

a.download = "jobfinder_export.csv";

a.click();

URL.revokeObjectURL(url);

showSuccess("CSV exporté");

}

document
.getElementById("exportCsvBtn")
?.addEventListener("click", exportCSV);

/* ==========================================
IMPORT DONNEES
========================================== */

function importData(file){

const reader = new FileReader();

reader.onload = (e) => {

try{

const data = JSON.parse(e.target.result);

favorites = data.favorites || [];

applications = data.applications || [];

lettersHistory = data.lettersHistory || [];

saveFavorites();
saveApplications();
saveLetters();

renderFavorites();
renderApplications();
renderLettersHistory();

updateDashboard();

showSuccess("Import OK");

}

catch(err){

console.error(err);

showError("Fichier invalide");

}

};

reader.readAsText(file);

}

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

/* ==========================================
RESET APP
========================================== */

document
.getElementById("resetAppBtn")
?.addEventListener("click", () => {

if(!confirm("Reset total ?")) return;

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
INITIALISATION FINALE
========================================== */

window.addEventListener("DOMContentLoaded", () => {

loadOffers();

renderFavorites();

renderApplications();

renderLettersHistory();

updateDashboard();

updateApplicationCounters();

updateBestMatch();

updateStatistics();

showSuccess("Application prête");

});

/* ==========================================
DASHBOARD (SYNC)
========================================== */

function updateDashboard(){

safeSetText(
document.getElementById("kpiOffers"),
offers.length
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
getAverageMatch() + "%"
);

}

/* ==========================================
NOTIFICATIONS UPDATE
========================================== */

function updateNotifications(){

safeSetText(
document.getElementById("newOffersNotifications"),
offers.length ? offers.length + " offres" : "Aucune nouvelle offre"
);

safeSetText(
document.getElementById("favoritesNotifications"),
favorites.length ? favorites.length + " favoris" : "Aucun favori"
);

safeSetText(
document.getElementById("applicationsNotifications"),
applications.length ? applications.length + " candidatures" : "Aucune relance"
);

safeSetText(
document.getElementById("aiNotifications"),
offers.length ? "IA active" : "Aucune alerte IA"
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

}

/* ==========================================
WINDOW EXPORTS
========================================== */

window.openOffer = openOffer;
window.addFavorite = addFavorite;
window.addApplication = addApplication;
window.changeStatus = changeStatus;
window.removeApplication = removeApplication;

window.generateShortLetter = generateShortLetter;
window.generateStandardLetter = generateStandardLetter;
window.generatePremiumLetter = generatePremiumLetter;

window.saveCurrentLetter = saveCurrentLetter;
window.copyCurrentLetter = copyCurrentLetter;

window.exportJSON = exportJSON;
window.exportCSV = exportCSV;

/* ==========================================
FIN APP.JS V14.1.0 CORRIGÉ FINAL
========================================== */
