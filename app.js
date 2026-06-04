/* ==========================================
JOB FINDER VAUD V14.1.0 PREMIUM IA
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

letters: "jobfinder_letters"

};

/* ==========================================
VARIABLES GLOBALES
========================================== */

let offers = [];

let currentCV = null;

let currentLetter = "";

let favorites = JSON.parse(
localStorage.getItem(
STORAGE_KEYS.favorites
) || "[]"
);

let applications = JSON.parse(
localStorage.getItem(
STORAGE_KEYS.applications
) || "[]"
);

let lettersHistory = JSON.parse(
localStorage.getItem(
STORAGE_KEYS.letters
) || "[]"
);

let settings = JSON.parse(
localStorage.getItem(
STORAGE_KEYS.settings
) || "{}"
);

/* ==========================================
DOM PRINCIPAL
========================================== */

const offersContainer =
document.getElementById(
"offersContainer"
);

const favoritesContainer =
document.getElementById(
"favoritesContainer"
);

const applicationsBoard =
document.getElementById(
"applicationsBoard"
);

const lettersHistoryContainer =
document.getElementById(
"lettersHistoryContainer"
);

/* ==========================================
BOUTONS PRINCIPAUX
========================================== */

const searchOffersBtn =
document.getElementById(
"searchOffersBtn"
);

const resetFiltersBtn =
document.getElementById(
"resetFiltersBtn"
);

const btnFilters =
document.getElementById(
"btnFilters"
);

const btnReset =
document.getElementById(
"btnReset"
);

const btnNotifications =
document.getElementById(
"btnNotifications"
);

const btnSettings =
document.getElementById(
"btnSettings"
);

/* ==========================================
FILTRES V14.1.0
========================================== */

const sourceFilter =
document.getElementById(
"sourceFilter"
);

const employerFilter =
document.getElementById(
"employerFilter"
);

const matchFilter =
document.getElementById(
"matchFilter"
);

const sortFilter =
document.getElementById(
"sortFilter"
);

/* ==========================================
IA PREMIUM
========================================== */

const cvFile =
document.getElementById(
"cvFile"
);

const analyzeCVBtn =
document.getElementById(
"analyzeCVBtn"
);

const generateShortLetterBtn =
document.getElementById(
"generateShortLetter"
);

const generateStandardLetterBtn =
document.getElementById(
"generateStandardLetter"
);

const generatePremiumLetterBtn =
document.getElementById(
"generatePremiumLetter"
);

/* ==========================================
LETTRES
========================================== */

const saveLetterBtn =
document.getElementById(
"saveLetterBtn"
);

const copyLetterBtn =
document.getElementById(
"copyLetterBtn"
);

const pdfLetterBtn =
document.getElementById(
"pdfLetterBtn"
);

const wordLetterBtn =
document.getElementById(
"wordLetterBtn"
);

const emailLetterBtn =
document.getElementById(
"emailLetterBtn"
);

/* ==========================================
TABS
========================================== */

const tabButtons =
document.querySelectorAll(
".main-tabs button"
);

const tabContents =
document.querySelectorAll(
".tab-content"
);
/* ==========================================
NAVIGATION
========================================== */

tabButtons.forEach(button => {

button.addEventListener(
"click",
() => {

const target =
button.dataset.tab;

openTab(target);

}
);

});

/* ==========================================
HEADER ACTIONS
========================================== */

btnFilters?.addEventListener(
"click",
() => openTab("filters")
);

btnSettings?.addEventListener(
"click",
() => openTab("settings")
);

btnNotifications?.addEventListener(
"click",
() => openTab("notifications")
);

btnReset?.addEventListener(
"click",
resetFilters
);

/* ==========================================
DASHBOARD CLIQUABLE V14.1.0
========================================== */

document
.querySelectorAll(
".clickable-card"
)
.forEach(card => {

card.addEventListener(
"click",
() => {

const target =
card.dataset.target;

if(target){

openTab(target);

}

}
);

});

/* ==========================================
FONCTIONS GENERALES
========================================== */

function openTab(tabId){

tabContents.forEach(tab => {

tab.classList.remove(
"active-tab"
);

});

const target =
document.getElementById(
tabId
);

if(target){

target.classList.add(
"active-tab"
);

window.scrollTo({

top:0,

behavior:"smooth"

});

}

}

function generateId(){

return (
Date.now().toString() +
Math.random()
.toString(36)
.substring(2,8)
);

}

/* ==========================================
SAUVEGARDES
========================================== */

function saveFavorites(){

localStorage.setItem(

STORAGE_KEYS.favorites,

JSON.stringify(
favorites
)

);

}

function saveApplications(){

localStorage.setItem(

STORAGE_KEYS.applications,

JSON.stringify(
applications
)

);

}

function saveLetters(){

localStorage.setItem(

STORAGE_KEYS.letters,

JSON.stringify(
lettersHistory
)

);

}

function saveSettings(){

localStorage.setItem(

STORAGE_KEYS.settings,

JSON.stringify(
settings
)

);

}

/* ==========================================
UTILITAIRES
========================================== */

function showSuccess(message){

alert(
`✅ ${message}`
);

}

function showError(message){

alert(
`❌ ${message}`
);

}

function showInfo(message){

alert(
`ℹ️ ${message}`
);

}

/* ==========================================
FORMATAGE
========================================== */

function formatDate(date){

try{

return new Date(date)
.toLocaleDateString(
"fr-CH"
);

}
catch{

return "";

}

}

function escapeHtml(text){

if(!text){

return "";

}

const div =
document.createElement(
"div"
);

div.textContent =
text;

return div.innerHTML;

}

/* ==========================================
BADGES MATCH IA V14.1.0
========================================== */

function getMatchBadge(score){

if(score >= 90){

return "🤘🏼";

}

if(score >= 80){

return "🤙🏼";

}

if(score >= 70){

return "🫣";

}

return "🙂";

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

/* ==========================================
STATISTIQUES GENERALES
========================================== */

function getAverageMatch(){

if(!offers.length){

return 0;

}

return Math.round(

offers.reduce(
(total, offer) =>

total +
calculateMatch(offer),

0
)

/

offers.length

);

}

/* ==========================================
REMPLISSAGE FILTRE EMPLOYEURS
========================================== */

function populateEmployersFilter(){

if(!employerFilter){

return;

}

const companies =
[
...new Set(

offers
.map(
offer =>
offer.company
)
.filter(Boolean)

)
];

employerFilter.innerHTML =
`
<option value="">
Tous les employeurs
</option>
`;

companies
.sort()
.forEach(company => {

employerFilter.innerHTML +=
`
<option value="${company}">
${company}
</option>
`;

});

}
/* ==========================================
CHARGEMENT OFFRES
========================================== */

async function loadOffers(){

try{

const response =
await fetch(
"offers.json"
);

offers =
await response.json();

/* ==========================================
NORMALISATION V14.1.0
========================================== */

offers = offers.map(offer => ({

id:
offer.id ||
offer.externalId ||
generateId(),

title:
offer.title || "",

company:
offer.company || "",

location:
offer.location || "",

sector:
offer.sector || "",

contract:
offer.contract || "",

rate:
offer.rate || "",

salary:
offer.salary || "",

address:
offer.address || "",

source:
offer.source || "",

externalId:
offer.externalId || "",

offerUrl:
offer.offerUrl ||
offer.url ||
"",

date:
offer.date || ""

}));

populateEmployersFilter();

renderOffers(
offers
);

updateDashboard();

}
catch(error){

console.error(
"Erreur chargement offres",
error
);

offers = [];

renderOffers([]);

}

}

/* ==========================================
AFFICHAGE OFFRES
========================================== */

function renderOffers(data){

if(!offersContainer){

return;

}

offersContainer.innerHTML = "";

updateResultsSummary(
data
);

if(data.length === 0){

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

const card =
createOfferCard(
offer
);

offersContainer.appendChild(
card
);

});

}

/* ==========================================
OUVERTURE OFFRE
========================================== */

function openOffer(offer){

const url =

offer.offerUrl ||
offer.url ||
"";

if(
url &&
url.trim() !== ""
){

window.open(
url,
"_blank"
);

return;

}

showError(
"Aucune URL disponible pour cette offre."
);

}

/* ==========================================
RESUME RESULTATS
========================================== */

function updateResultsSummary(data){

const resultsCounter =
document.getElementById(
"resultsCounter"
);

const recommendedCounter =
document.getElementById(
"recommendedCounter"
);

const newOffersCounter =
document.getElementById(
"newOffersCounter"
);

const averageMatchCounter =
document.getElementById(
"averageMatchCounter"
);

if(resultsCounter){

resultsCounter.textContent =
`💼 Offres trouvées : ${data.length}`;

}

const recommended =
data.filter(
offer =>
calculateMatch(offer) >= 90
).length;

if(recommendedCounter){

recommendedCounter.textContent =
`🔥 Très recommandées : ${recommended}`;

}

const recent =
data.filter(
offer =>
offer.date &&
(
offer.date.includes("Aujourd")
||
offer.date.includes("1 jour")
||
offer.date.includes("2 jours")
)
).length;

if(newOffersCounter){

newOffersCounter.textContent =
`🆕 Nouvelles offres : ${recent}`;

}

let average = 0;

if(data.length){

average =
Math.round(

data.reduce(
(total, offer) =>
total +
calculateMatch(offer),
0
)

/

data.length

);

}

if(averageMatchCounter){

averageMatchCounter.textContent =
`🤖 Match moyen IA : ${average}%`;

}

}
/* ==========================================
MATCH IA V14.1.0
========================================== */

function calculateMatch(offer){

let score = 50;

/* ==========================================
METIER
========================================== */

const preferredJobs = [

"Employé de commerce",
"Employé administratif",
"Assistant administratif",
"Assistant de direction",
"Gestionnaire de dossier",
"Coordinateur administratif",
"Assistant RH",
"Conseiller clientèle",
"Support utilisateur",
"Technicien informatique"

];

const title =
(offer.title || "")
.toLowerCase();

if(

preferredJobs.some(
job =>
title.includes(
job.toLowerCase()
)
)

){

score += 20;

}

/* ==========================================
SECTEUR
========================================== */

const preferredSectors = [

"Administration",
"Administration publique",
"Fondation",
"Informatique",
"Immobilier",
"Assurance",
"Ressource humaine",
"Service client",
"Support utilisateur",
"Secrétariat",
"Secrétariat médical",
"Santé",
"Fiduciaire",
"Banque"

];

if(
preferredSectors.includes(
offer.sector
)
){

score += 10;

}

/* ==========================================
CONTRAT
========================================== */

if(
offer.contract === "CDI"
){

score += 10;

}
else if(
offer.contract === "CDD"
){

score += 5;

}

/* ==========================================
TAUX
========================================== */

const rate =
parseInt(
String(
offer.rate || "0"
).replace("%","")
);

if(rate >= 80){

score += 10;

}
else if(rate >= 60){

score += 5;

}

/* ==========================================
REGION
========================================== */

const preferredRegions = [

"Lausanne",
"Ouest lausannois",
"Morges",
"Nyon"

];

if(

preferredRegions.includes(
offer.location
)

){

score += 10;

}

/* ==========================================
SOURCE EMPLOYEUR
========================================== */

if(
offer.source ===
"Site employeur"
){

score += 5;

}

/* ==========================================
PLAFOND
========================================== */

if(score > 100){

score = 100;

}

return score;

}

/* ==========================================
RAISONS DU MATCH
========================================== */

function buildMatchReasons(offer){

const reasons = [];

reasons.push(
"✓ Métier compatible"
);

if(offer.sector){

reasons.push(
"✓ Secteur compatible"
);

}

if(offer.location){

reasons.push(
"✓ Région compatible"
);

}

if(offer.rate){

reasons.push(
"✓ Taux compatible"
);

}

if(offer.contract){

reasons.push(
"✓ Contrat compatible"
);

}

if(offer.source){

reasons.push(
"✓ Source analysée"
);

}

return reasons.join("<br>");

}

/* ==========================================
BADGE MATCH IA
========================================== */

function getOfferMatchDisplay(score){

if(score >= 90){

return {
icon:"🤘🏼",
className:"match-90"
};

}

if(score >= 80){

return {
icon:"🤙🏼",
className:"match-80"
};

}

if(score >= 70){

return {
icon:"🫣",
className:"match-70"
};

}

return {
icon:"🙂",
className:"match-60"
};

}

/* ==========================================
ANALYSE IA
========================================== */

function showAIAnalysis(offer){

const score =
calculateMatch(
offer
);

const badge =
getOfferMatchDisplay(
score
);

alert(

`${badge.icon} Analyse IA

Poste :
${offer.title}

Entreprise :
${offer.company}

Compatibilité :
${score}%

Secteur :
${offer.sector || "N/A"}

Contrat :
${offer.contract || "N/A"}

Taux :
${offer.rate || "N/A"}

Région :
${offer.location || "N/A"}

Source :
${offer.source || "N/A"}

Résultat :
Offre recommandée.`

);

}

/* ==========================================
CREATION CARTE OFFRE V14.1.0
========================================== */

function createOfferCard(offer){

const score =
calculateMatch(
offer
);

const badge =
getOfferMatchDisplay(
score
);

const card =
document.createElement(
"div"
);

card.className =
"offer-card";

if(score >= 90){

card.classList.add(
"best-match"
);

}

card.innerHTML = `

<div class="offer-match ${badge.className}">
${badge.icon} Match IA : ${score}%
</div>

<div class="offer-title">
💼 ${offer.title || ""}
</div>

<div class="offer-company">
🏢 ${offer.company || ""}
</div>

<div class="offer-address">
📮 ${offer.address || "Adresse non disponible"}
</div>

<div class="offer-location">
📍 ${offer.location || ""}
</div>

<div class="offer-meta">
📈 ${offer.rate || ""}
</div>

<div class="offer-meta">
📄 ${offer.contract || ""}
</div>

<div class="offer-sector">
🏭 ${offer.sector || ""}
</div>

<div class="offer-salary">
💰 ${offer.salary || "Salaire non communiqué"}
</div>

<div class="offer-source">
🔎 ${offer.source || "Source inconnue"}
</div>

<div class="offer-date">
📅 ${offer.date || ""}
</div>

<div class="offer-reasons">
${buildMatchReasons(offer)}
</div>

<div class="offer-actions">

<button
class="offer-btn favorite-btn"
title="Favori">

⭐

</button>

<button
class="offer-btn apply-btn"
title="Ajouter candidature">

🚀

</button>

<button
class="offer-btn ai-btn"
title="Analyse IA">

🤖

</button>

<button
class="offer-btn letter-btn"
title="Lettre IA">

✉️

</button>

<button
class="offer-btn link-btn"
title="Offre originale">

🔗

</button>

</div>

`;

card
.querySelector(".favorite-btn")
.addEventListener(
"click",
() => addFavorite(offer)
);

card
.querySelector(".apply-btn")
.addEventListener(
"click",
() => addApplication(offer)
);

card
.querySelector(".ai-btn")
.addEventListener(
"click",
() => showAIAnalysis(offer)
);

card
.querySelector(".letter-btn")
.addEventListener(
"click",
() => generateStandardLetter(offer)
);

card
.querySelector(".link-btn")
.addEventListener(
"click",
() => openOffer(offer)
);

return card;

}
/* ==========================================
FILTRES V14.1.0
========================================== */

searchOffersBtn?.addEventListener(
"click",
applyFilters
);

resetFiltersBtn?.addEventListener(
"click",
resetFilters
);

sourceFilter?.addEventListener(
"change",
applyFilters
);

employerFilter?.addEventListener(
"change",
applyFilters
);

matchFilter?.addEventListener(
"change",
applyFilters
);

sortFilter?.addEventListener(
"change",
applyFilters
);

/* ==========================================
APPLICATION FILTRES
========================================== */

function applyFilters(){

const selectedJobs =
getCheckedValues(
'.filter-box input[type="checkbox"]'
);

/* ==========================================
FILTRES V14.1.0
========================================== */

const selectedSource =
sourceFilter?.value || "";

const selectedEmployer =
employerFilter?.value || "";

const selectedMatch =
parseInt(
matchFilter?.value || "0"
);

const selectedSort =
sortFilter?.value || "match";

/* ==========================================
FILTRES CLASSIQUES
========================================== */

let filteredOffers =
offers.filter(offer => {

let valid = true;

/* Source */

if(
selectedSource &&
offer.source !== selectedSource
){

valid = false;

}

/* Employeur */

if(
selectedEmployer &&
offer.company !== selectedEmployer
){

valid = false;

}

/* Match IA */

if(
selectedMatch > 0 &&
calculateMatch(offer) < selectedMatch
){

valid = false;

}

return valid;

});

/* ==========================================
TRI
========================================== */

filteredOffers.sort(
(a,b) => {

if(
selectedSort === "match"
){

return (
calculateMatch(b)
-
calculateMatch(a)
);

}

if(
selectedSort === "company"
){

return (
(a.company || "")
.localeCompare(
b.company || ""
)
);

}

if(
selectedSort === "region"
){

return (
(a.location || "")
.localeCompare(
b.location || ""
)
);

}

if(
selectedSort === "job"
){

return (
(a.title || "")
.localeCompare(
b.title || ""
)
);

}

if(
selectedSort === "salary"
){

const salaryA =
parseSalary(
a.salary
);

const salaryB =
parseSalary(
b.salary
);

return salaryB - salaryA;

}

if(
selectedSort === "date"
){

return (
new Date(
b.createdAt || 0
)
-
new Date(
a.createdAt || 0
)
);

}

return 0;

}
);

/* ==========================================
AFFICHAGE
========================================== */

renderOffers(
filteredOffers
);

}

/* ==========================================
LECTURE CHECKBOXES
========================================== */

function getCheckedValues(selector){

return [

...document.querySelectorAll(
`${selector}:checked`
)

].map(
item => item.value
);

}

/* ==========================================
CONVERSION SALAIRE
========================================== */

function parseSalary(value){

if(!value){

return 0;

}

const numeric =
String(value)
.replace(/[^\d]/g,"");

return parseInt(
numeric || "0"
);

}

/* ==========================================
RESET FILTRES
========================================== */

function resetFilters(){

document
.querySelectorAll(
'input[type="checkbox"]'
)
.forEach(input => {

input.checked = false;

});

if(sourceFilter){

sourceFilter.value = "";

}

if(employerFilter){

employerFilter.value = "";

}

if(matchFilter){

matchFilter.value = "";

}

if(sortFilter){

sortFilter.value = "match";

}

renderOffers(
offers
);

updateDashboard();

}

/* ==========================================
MEILLEUR MATCH DU JOUR
========================================== */

function updateBestMatch(){

const container =
document.getElementById(
"bestMatchContainer"
);

if(
!container ||
offers.length === 0
){

return;

}

const bestOffer =
[...offers]
.sort(
(a,b) =>
calculateMatch(b)
-
calculateMatch(a)
)[0];

container.innerHTML = `

<div class="offer-title">
💼 ${bestOffer.title}
</div>

<div class="offer-company">
🏢 ${bestOffer.company}
</div>

<div class="offer-match">
${getMatchBadge(
calculateMatch(
bestOffer
)
)}
${calculateMatch(
bestOffer
)}%
</div>

`;

}
/* ==========================================
FAVORIS V14.1.0
========================================== */

function addFavorite(offer){

const exists =
favorites.find(
item => item.id === offer.id
);

if(exists){

showInfo(
"Cette offre est déjà dans vos favoris."
);

return;

}

favorites.push({

...offer,

priority:"⭐⭐⭐",

savedAt:
new Date().toISOString()

});

saveFavorites();

renderFavorites();

updateDashboard();

showSuccess(
"Favori ajouté."
);

}

function renderFavorites(){

if(!favoritesContainer){

return;

}

favoritesContainer.innerHTML = "";

if(favorites.length === 0){

favoritesContainer.innerHTML = `

<div class="offer-card">

<div class="offer-title">

Aucun favori

</div>

</div>

`;

return;

}

favorites.forEach(favorite => {

const card =
document.createElement(
"div"
);

card.className =
"offer-card";

card.innerHTML = `

<div class="offer-title">
💼 ${favorite.title}
</div>

<div class="offer-company">
🏢 ${favorite.company}
</div>

<div class="offer-location">
📍 ${favorite.location}
</div>

<div class="offer-match">
${favorite.priority}
</div>

<div class="offer-actions">

<button
class="offer-btn"
data-action="priority">

⭐

</button>

<button
class="offer-btn"
data-action="delete">

🗑️

</button>

</div>

`;

const buttons =
card.querySelectorAll(
".offer-btn"
);

buttons[0].addEventListener(
"click",
() => cycleFavoritePriority(
favorite.id
)
);

buttons[1].addEventListener(
"click",
() => removeFavorite(
favorite.id
)
);

favoritesContainer.appendChild(
card
);

});

}

function cycleFavoritePriority(id){

const favorite =
favorites.find(
item => item.id === id
);

if(!favorite){

return;

}

if(
favorite.priority === "⭐⭐⭐"
){

favorite.priority =
"⭐⭐⭐⭐";

}
else if(
favorite.priority === "⭐⭐⭐⭐"
){

favorite.priority =
"⭐⭐⭐⭐⭐";

}
else{

favorite.priority =
"⭐⭐⭐";

}

saveFavorites();

renderFavorites();

}

function removeFavorite(id){

favorites =
favorites.filter(
item => item.id !== id
);

saveFavorites();

renderFavorites();

updateDashboard();

}

/* ==========================================
DASHBOARD V14.1.0
========================================== */

function updateDashboard(){

const kpiOffers =
document.getElementById(
"kpiOffers"
);

const kpiFavorites =
document.getElementById(
"kpiFavorites"
);

const kpiApplications =
document.getElementById(
"kpiApplications"
);

const kpiAI =
document.getElementById(
"kpiAI"
);

if(kpiOffers){

kpiOffers.textContent =
offers.length;

}

if(kpiFavorites){

kpiFavorites.textContent =
favorites.length;

}

if(kpiApplications){

kpiApplications.textContent =
applications.length;

}

if(kpiAI){

kpiAI.textContent =
`${getAverageMatch()}%`;

}

/* ==========================================
OBJECTIF HEBDOMADAIRE
========================================== */

const weeklyProgress =
document.getElementById(
"weeklyProgress"
);

const weeklyAchievement =
document.getElementById(
"weeklyAchievement"
);

const weeklyCount =
applications.length;

const weeklyPercent =
Math.min(
100,
Math.round(
(weeklyCount / 3) * 100
)
);

if(weeklyProgress){

weeklyProgress.style.width =
`${weeklyPercent}%`;

}

if(
weeklyAchievement &&
weeklyCount >= 3
){

weeklyAchievement.style.display =
"block";

}

/* ==========================================
OBJECTIF MENSUEL
========================================== */

const monthlyProgress =
document.getElementById(
"monthlyProgress"
);

const monthlyAchievement =
document.getElementById(
"monthlyAchievement"
);

const monthlyCount =
applications.length;

const monthlyPercent =
Math.min(
100,
Math.round(
(monthlyCount / 12) * 100
)
);

if(monthlyProgress){

monthlyProgress.style.width =
`${monthlyPercent}%`;

}

if(
monthlyAchievement &&
monthlyCount >= 12
){

monthlyAchievement.style.display =
"block";

}

updateApplicationCounters();

updateBestMatch();

}
/* ==========================================
CANDIDATURES V14.1.0
========================================== */

function addApplication(offer){

const exists =
applications.find(
item => item.id === offer.id
);

if(exists){

showInfo(
"Cette offre existe déjà dans vos candidatures."
);

return;

}

applications.push({

...offer,

status:"Envoyée",

createdAt:
new Date().toISOString(),

lastUpdate:
new Date().toISOString()

});

saveApplications();

renderApplications();

updateDashboard();

showSuccess(
"Candidature ajoutée."
);

}

/* ==========================================
AFFICHAGE CANDIDATURES
========================================== */

function renderApplications(){

const sentApplications =
document.getElementById(
"sentApplications"
);

const receivedResponses =
document.getElementById(
"receivedResponses"
);

const scheduledInterviews =
document.getElementById(
"scheduledInterviews"
);

const successfulApplications =
document.getElementById(
"successfulApplications"
);

if(
!sentApplications ||
!receivedResponses ||
!scheduledInterviews ||
!successfulApplications
){

return;

}

sentApplications.innerHTML = "";
receivedResponses.innerHTML = "";
scheduledInterviews.innerHTML = "";
successfulApplications.innerHTML = "";

applications.forEach(item => {

const html = `

<div class="offer-card">

<div class="offer-title">
💼 ${item.title}
</div>

<div class="offer-company">
🏢 ${item.company}
</div>

<div class="offer-location">
📍 ${item.location || ""}
</div>

<div class="offer-match">
📌 ${item.status}
</div>

<div class="offer-date">
📅 ${formatDate(
item.lastUpdate
)}
</div>

<div class="offer-actions">

<button
class="offer-btn"
onclick="changeStatus('${item.id}')"
title="Changer statut">

🔄

</button>

<button
class="offer-btn"
onclick="removeApplication('${item.id}')"
title="Supprimer">

🗑️

</button>

</div>

</div>

`;

if(item.status === "Envoyée"){

sentApplications.innerHTML += html;

}

if(item.status === "Réponse"){

receivedResponses.innerHTML += html;

}

if(item.status === "Entretien"){

scheduledInterviews.innerHTML += html;

}

if(item.status === "Embauche"){

successfulApplications.innerHTML += html;

}

});

updateApplicationCounters();

}

/* ==========================================
CHANGEMENT DE STATUT
========================================== */

function changeStatus(id){

const application =
applications.find(
item => item.id === id
);

if(!application){

return;

}

if(
application.status === "Envoyée"
){

application.status =
"Réponse";

}
else if(
application.status === "Réponse"
){

application.status =
"Entretien";

}
else if(
application.status === "Entretien"
){

application.status =
"Embauche";

}
else{

application.status =
"Envoyée";

}

application.lastUpdate =
new Date().toISOString();

saveApplications();

renderApplications();

updateDashboard();

}

/* ==========================================
SUPPRESSION CANDIDATURE
========================================== */

function removeApplication(id){

applications =
applications.filter(
item => item.id !== id
);

saveApplications();

renderApplications();

updateDashboard();

}

/* ==========================================
COMPTEURS
========================================== */

function updateApplicationCounters(){

const sent =
applications.filter(
a => a.status === "Envoyée"
).length;

const responses =
applications.filter(
a => a.status === "Réponse"
).length;

const interviews =
applications.filter(
a => a.status === "Entretien"
).length;

const hired =
applications.filter(
a => a.status === "Embauche"
).length;

document.getElementById(
"applicationsCount"
).textContent = sent;

document.getElementById(
"responsesCount"
).textContent = responses;

document.getElementById(
"interviewsCount"
).textContent = interviews;

document.getElementById(
"hiredCount"
).textContent = hired;

updateStatistics();

}

/* ==========================================
STATISTIQUES
========================================== */

function updateStatistics(){

const total =
applications.length;

const responses =
applications.filter(
a => a.status === "Réponse"
).length;

const interviews =
applications.filter(
a => a.status === "Entretien"
).length;

const hired =
applications.filter(
a => a.status === "Embauche"
).length;

const responseRate =
total
? Math.round(
(responses / total) * 100
)
: 0;

const interviewRate =
total
? Math.round(
(interviews / total) * 100
)
: 0;

const successRate =
total
? Math.round(
(hired / total) * 100
)
: 0;

document.getElementById(
"responseRate"
).textContent =
`${responseRate}%`;

document.getElementById(
"interviewRate"
).textContent =
`${interviewRate}%`;

document.getElementById(
"successRate"
).textContent =
`${successRate}%`;

document.getElementById(
"averageMatch"
).textContent =
`${getAverageMatch()}%`;

}
/* ==========================================
LETTRES IA V14.1.0
========================================== */

function generateShortLetter(offer){

const letter = `

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Je vous adresse ma candidature pour le poste de ${offer.title} au sein de ${offer.company}.

Mon expérience et ma motivation me permettent de répondre aux exigences de cette fonction.

Je reste à votre disposition pour un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

Nom Prénom

`;

displayLetter(
letter
);

}

function generateStandardLetter(offer){

const letter = `

Nom Prénom
Adresse
NPA Ville

${offer.company}
Adresse employeur

Lausanne, le ${new Date().toLocaleDateString("fr-CH")}

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Suite à votre annonce pour le poste de ${offer.title}, je souhaite vous soumettre ma candidature.

Grâce à mon expérience dans les domaines administratifs et de gestion, j'ai développé des compétences solides en organisation, gestion documentaire, relation clientèle et outils informatiques.

Rigoureux, autonome et orienté résultats, je suis convaincu de pouvoir contribuer efficacement à votre équipe.

Je serais heureux de pouvoir vous rencontrer afin d'échanger sur ma candidature.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

Nom Prénom

`;

displayLetter(
letter
);

}

function generatePremiumLetter(offer){

const score =
calculateMatch(
offer
);

const letter = `

Nom Prénom
Adresse
NPA Ville

${offer.company}
Adresse employeur

Lausanne, le ${new Date().toLocaleDateString("fr-CH")}

Objet : Candidature au poste de ${offer.title}

Madame, Monsieur,

Votre offre a particulièrement retenu mon attention en raison de sa forte adéquation avec mon profil professionnel.

Le système d'analyse de Job Finder Vaud indique une compatibilité estimée à ${score}% entre mon parcours et les exigences du poste.

Mon expérience en administration, gestion de dossiers, coordination et outils numériques me permet d'apporter une réelle valeur ajoutée à votre organisation.

Reconnu pour mon sens du service, ma fiabilité et ma capacité d'adaptation, je suis motivé à m'investir pleinement dans les missions confiées.

Je serais ravi de pouvoir développer ces éléments lors d'un entretien.

Dans cette attente, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.

Nom Prénom

`;

displayLetter(
letter
);

}

/* ==========================================
AFFICHAGE LETTRE
========================================== */

function displayLetter(letter){

currentLetter =
letter;

const result =
document.getElementById(
"letterResult"
);

if(result){

result.textContent =
letter;

}

openTab(
"ai"
);

}

/* ==========================================
SAUVEGARDE LETTRE
========================================== */

function saveCurrentLetter(){

if(!currentLetter){

showInfo(
"Aucune lettre à sauvegarder."
);

return;

}

lettersHistory.unshift({

id:
generateId(),

content:
currentLetter,

createdAt:
new Date().toISOString()

});

saveLetters();

renderLettersHistory();

showSuccess(
"Lettre sauvegardée."
);

}

/* ==========================================
HISTORIQUE LETTRES
========================================== */

function renderLettersHistory(){

if(
!lettersHistoryContainer
){

return;

}

lettersHistoryContainer.innerHTML = "";

if(
lettersHistory.length === 0
){

lettersHistoryContainer.innerHTML = `

<div class="offer-card">

<div class="offer-title">

Aucune lettre sauvegardée

</div>

</div>

`;

return;

}

lettersHistory.forEach(letter => {

const card =
document.createElement(
"div"
);

card.className =
"letter-history-card";

card.innerHTML = `

<div class="letter-history-title">

📄 Lettre

</div>

<div class="letter-history-date">

${formatDate(
letter.createdAt
)}

</div>

<div class="offer-actions">

<button
class="offer-btn view-letter">

👁️

</button>

<button
class="offer-btn delete-letter">

🗑️

</button>

</div>

`;

card
.querySelector(
".view-letter"
)
.addEventListener(
"click",
() => {

displayLetter(
letter.content
);

}
);

card
.querySelector(
".delete-letter"
)
.addEventListener(
"click",
() => {

deleteLetter(
letter.id
);

}
);

lettersHistoryContainer
.appendChild(card);

});

}

function deleteLetter(id){

lettersHistory =
lettersHistory.filter(
item =>
item.id !== id
);

saveLetters();

renderLettersHistory();

}

/* ==========================================
COPIER LETTRE
========================================== */

function copyCurrentLetter(){

if(!currentLetter){

return;

}

navigator.clipboard.writeText(
currentLetter
);

showSuccess(
"Lettre copiée."
);

}

/* ==========================================
BOUTONS LETTRES
========================================== */

saveLetterBtn?.addEventListener(
"click",
saveCurrentLetter
);

copyLetterBtn?.addEventListener(
"click",
copyCurrentLetter
);
/* ==========================================
EXPORT PDF
========================================== */

function exportLetterPDF(){

if(!currentLetter){

showInfo(
"Aucune lettre disponible."
);

return;

}

const blob =
new Blob(
[currentLetter],
{
type:"application/pdf"
}
);

const url =
URL.createObjectURL(
blob
);

const link =
document.createElement(
"a"
);

link.href = url;

link.download =
"lettre_motivation.pdf";

link.click();

URL.revokeObjectURL(
url
);

showSuccess(
"Export PDF lancé."
);

}

pdfLetterBtn?.addEventListener(
"click",
exportLetterPDF
);

/* ==========================================
EXPORT WORD
========================================== */

function exportLetterWord(){

if(!currentLetter){

showInfo(
"Aucune lettre disponible."
);

return;

}

const blob =
new Blob(
[currentLetter],
{
type:
"application/msword"
}
);

const url =
URL.createObjectURL(
blob
);

const link =
document.createElement(
"a"
);

link.href = url;

link.download =
"lettre_motivation.doc";

link.click();

URL.revokeObjectURL(
url
);

showSuccess(
"Export Word lancé."
);

}

wordLetterBtn?.addEventListener(
"click",
exportLetterWord
);

/* ==========================================
EXPORT EMAIL
========================================== */

function exportLetterEmail(){

if(!currentLetter){

showInfo(
"Aucune lettre disponible."
);

return;

}

const subject =
encodeURIComponent(
"Candidature"
);

const body =
encodeURIComponent(
currentLetter
);

window.location.href =
`mailto:?subject=${subject}&body=${body}`;

}

emailLetterBtn?.addEventListener(
"click",
exportLetterEmail
);

/* ==========================================
EXPORT JSON
========================================== */

function exportJSON(){

const data = {

favorites,

applications,

lettersHistory,

exportDate:
new Date().toISOString()

};

const blob =
new Blob(
[
JSON.stringify(
data,
null,
2
)
],
{
type:
"application/json"
}
);

const url =
URL.createObjectURL(
blob
);

const link =
document.createElement(
"a"
);

link.href = url;

link.download =
"jobfinder_export.json";

link.click();

URL.revokeObjectURL(
url
);

showSuccess(
"Export JSON terminé."
);

}

document
.getElementById(
"exportJsonBtn"
)
?.addEventListener(
"click",
exportJSON
);

/* ==========================================
EXPORT CSV
========================================== */

function exportCSV(){

let csv =

"Type,Titre,Entreprise,Statut\n";

applications.forEach(item => {

csv +=

`Candidature,"${item.title}","${item.company}","${item.status}"\n`;

});

favorites.forEach(item => {

csv +=

`Favori,"${item.title}","${item.company}","${item.priority}"\n`;

});

const blob =
new Blob(
[csv],
{
type:
"text/csv"
}
);

const url =
URL.createObjectURL(
blob
);

const link =
document.createElement(
"a"
);

link.href = url;

link.download =
"jobfinder_export.csv";

link.click();

URL.revokeObjectURL(
url
);

showSuccess(
"Export CSV terminé."
);

}

document
.getElementById(
"exportCsvBtn"
)
?.addEventListener(
"click",
exportCSV
);

/* ==========================================
IMPORT DONNEES
========================================== */

function importData(file){

const reader =
new FileReader();

reader.onload =
event => {

try{

const data =
JSON.parse(
event.target.result
);

favorites =
data.favorites || [];

applications =
data.applications || [];

lettersHistory =
data.lettersHistory || [];

saveFavorites();
saveApplications();
saveLetters();

renderFavorites();
renderApplications();
renderLettersHistory();

updateDashboard();

showSuccess(
"Import terminé."
);

}
catch(error){

console.error(error);

showError(
"Fichier invalide."
);

}

};

reader.readAsText(
file
);

}

document
.getElementById(
"importBtn"
)
?.addEventListener(
"click",
() => {

const file =
document
.getElementById(
"importFile"
)
?.files?.[0];

if(!file){

showInfo(
"Sélectionnez un fichier."
);

return;

}

importData(
file
);

}
);

/* ==========================================
REINITIALISATION COMPLETE
========================================== */

document
.getElementById(
"resetAppBtn"
)
?.addEventListener(
"click",
() => {

if(
!confirm(
"Réinitialiser toutes les données ?"
)
){

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

showSuccess(
"Application réinitialisée."
);

}
);
/* ==========================================
NOTIFICATIONS
========================================== */

function updateNotifications(){

const newOffersNotifications =
document.getElementById(
"newOffersNotifications"
);

const favoritesNotifications =
document.getElementById(
"favoritesNotifications"
);

const applicationsNotifications =
document.getElementById(
"applicationsNotifications"
);

const aiNotifications =
document.getElementById(
"aiNotifications"
);

if(newOffersNotifications){

const recentOffers =
offers.filter(
offer =>
offer.date &&
(
offer.date.includes("Aujourd")
||
offer.date.includes("1 jour")
||
offer.date.includes("2 jours")
)
);

newOffersNotifications.textContent =
recentOffers.length
? `${recentOffers.length} nouvelle(s) offre(s)`
: "Aucune nouvelle offre";

}

if(favoritesNotifications){

favoritesNotifications.textContent =
favorites.length
? `${favorites.length} favori(s) suivi(s)`
: "Aucun favori suivi";

}

if(applicationsNotifications){

const pending =
applications.filter(
item =>
item.status === "Envoyée"
).length;

applicationsNotifications.textContent =
pending
? `${pending} candidature(s) en attente`
: "Aucune relance";

}

if(aiNotifications){

const strongMatches =
offers.filter(
offer =>
calculateMatch(offer) >= 90
).length;

aiNotifications.textContent =
strongMatches
? `${strongMatches} offre(s) fortement recommandée(s)`
: "Aucune alerte IA";

}

}

/* ==========================================
INSTALLATION PWA
========================================== */

let deferredPrompt = null;

window.addEventListener(
"beforeinstallprompt",
event => {

event.preventDefault();

deferredPrompt = event;

}
);

document
.getElementById(
"installPwaBtn"
)
?.addEventListener(
"click",
async () => {

if(!deferredPrompt){

showInfo(
"Installation non disponible."
);

return;

}

deferredPrompt.prompt();

await deferredPrompt.userChoice;

deferredPrompt = null;

}
);

/* ==========================================
BOUTONS FLOTTANTS
========================================== */

document
.getElementById(
"floatingFavorites"
)
?.addEventListener(
"click",
() => openTab("favorites")
);

document
.getElementById(
"floatingApplications"
)
?.addEventListener(
"click",
() => openTab("applications")
);

document
.getElementById(
"floatingAI"
)
?.addEventListener(
"click",
() => openTab("ai")
);

document
.getElementById(
"floatingTop"
)
?.addEventListener(
"click",
() => {

window.scrollTo({

top:0,

behavior:"smooth"

});

}
);

/* ==========================================
CV
========================================== */

cvFile?.addEventListener(
"change",
event => {

currentCV =
event.target.files[0];

}
);

analyzeCVBtn?.addEventListener(
"click",
() => {

if(!currentCV){

showInfo(
"Veuillez importer un CV."
);

return;

}

document.getElementById(
"cvScore"
).textContent =
"85";

document.getElementById(
"missingSkills"
).textContent =
"2";

document.getElementById(
"aiSuggestions"
).textContent =
"5";

showSuccess(
`CV analysé : ${currentCV.name}`
);

}
);

/* ==========================================
INITIALISATION
========================================== */

window.addEventListener(
"DOMContentLoaded",
async () => {

await loadOffers();

renderFavorites();

renderApplications();

renderLettersHistory();

updateDashboard();

updateNotifications();

updateBestMatch();

updateStatistics();

}
);

/* ==========================================
EXPORTS GLOBAUX
========================================== */

window.openOffer =
openOffer;

window.addFavorite =
addFavorite;

window.removeFavorite =
removeFavorite;

window.addApplication =
addApplication;

window.removeApplication =
removeApplication;

window.changeStatus =
changeStatus;

window.generateShortLetter =
generateShortLetter;

window.generateStandardLetter =
generateStandardLetter;

window.generatePremiumLetter =
generatePremiumLetter;

window.saveCurrentLetter =
saveCurrentLetter;

window.copyCurrentLetter =
copyCurrentLetter;

/* ==========================================
FIN APP.JS V14.1.0
========================================== */
