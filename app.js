/* ==========================================
JOB FINDER VAUD V14.0.0 PREMIUM IA
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

offers: "jobfinder_offers"

};

/* ==========================================
INITIALISATION
========================================== */

let offers = [];

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

let settings = JSON.parse(
localStorage.getItem(
STORAGE_KEYS.settings
) || "{}"
);

let currentCV = null;

/* ==========================================
DOM
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
NAVIGATION
========================================== */

const tabButtons =
document.querySelectorAll(
".main-tabs button"
);

const tabContents =
document.querySelectorAll(
".tab-content"
);

tabButtons.forEach(button => {

button.addEventListener(
"click",
() => {

const target =
button.dataset.tab;

tabContents.forEach(tab => {

tab.classList.remove(
"active-tab"
);

});

const section =
document.getElementById(
target
);

if(section){

section.classList.add(
"active-tab"
);

window.scrollTo(
0,
0
);

}

}
);

});

/* ==========================================
HEADER ACTIONS
========================================== */

btnFilters?.addEventListener(
"click",
() => {

openTab(
"filters"
);

}
);

btnSettings?.addEventListener(
"click",
() => {

openTab(
"settings"
);

}
);

btnNotifications?.addEventListener(
"click",
() => {

openTab(
"notifications"
);

}
);

btnReset?.addEventListener(
"click",
resetFilters
);
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

function generateId(){

return Date.now().toString() +
Math.random()
.toString(36)
.substring(2,8);

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
CREATION CARTE OFFRE
========================================== */

function createOfferCard(offer){

const card =
document.createElement(
"div"
);

card.className =
"offer-card";

card.innerHTML = `

<div class="offer-title">
👔 ${offer.title || ""}
</div>

<div class="offer-company">
🏢 ${offer.company || ""}
</div>

<div class="offer-location">
📍 ${offer.location || ""}
</div>

<div class="offer-meta">
⏱️ ${offer.rate || ""}
|
📄 ${offer.contract || ""}
</div>

<div class="offer-sector">
🏢 ${offer.sector || ""}
</div>

<div class="offer-date">
📅 ${offer.date || ""}
</div>

<div class="offer-match">
🤖 Match IA :
${calculateMatch(offer)}%
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
title="Ajouter">

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
title="Voir l'offre">

🔗

</button>

</div>

`;

const favoriteBtn =
card.querySelector(
".favorite-btn"
);

const applyBtn =
card.querySelector(
".apply-btn"
);

const aiBtn =
card.querySelector(
".ai-btn"
);

const letterBtn =
card.querySelector(
".letter-btn"
);

const linkBtn =
card.querySelector(
".link-btn"
);

favoriteBtn.addEventListener(
"click",
() => addFavorite(offer)
);

applyBtn.addEventListener(
"click",
() => addApplication(offer)
);

aiBtn.addEventListener(
"click",
() => showAIAnalysis(offer)
);

letterBtn.addEventListener(
"click",
() => generateLetter(offer)
);

linkBtn.addEventListener(
"click",
() => openOffer(offer)
);

return card;

}
/* ==========================================
MATCH IA
========================================== */

function calculateMatch(offer){

let score = 70;

if(
offer.sector &&
offer.sector.length > 0
){
score += 5;
}

if(
offer.contract === "CDI"
){
score += 5;
}

if(
offer.rate === "80%"
||
offer.rate === "100%"
){
score += 5;
}

if(
offer.location === "Lausanne"
){
score += 5;
}

if(score > 100){

score = 100;

}

return score;

}

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

return reasons.join("<br>");

}

function showAIAnalysis(offer){

const match =
calculateMatch(
offer
);

alert(

`🤖 Analyse IA

Poste :
${offer.title}

Entreprise :
${offer.company}

Compatibilité :
${match}%

Points forts :

✓ Métier compatible

✓ Secteur compatible

✓ Région compatible

✓ Taux compatible

✓ Contrat compatible`

);

}
/* ==========================================
FAVORIS
========================================== */

function addFavorite(offer){

const exists =
favorites.find(
item => item.id === offer.id
);

if(exists){

alert(
"Cette offre est déjà dans vos favoris."
);

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

👔 ${favorite.title}

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
data-id="${favorite.id}">

🗑️

</button>

</div>

`;

const removeBtn =
card.querySelector(
"button"
);

removeBtn.addEventListener(
"click",
() => {

favorites =
favorites.filter(
item =>
item.id !== favorite.id
);

saveFavorites();

renderFavorites();

updateDashboard();

}
);

favoritesContainer.appendChild(
card
);

});

}
/* ==========================================
MES CANDIDATURES
========================================== */

function addApplication(offer){

const exists =
applications.find(
item => item.id === offer.id
);

if(exists){

alert(
"Cette offre est déjà présente dans vos candidatures."
);

return;

}

applications.push({

...offer,

status:"Envoyée",

createdAt:
new Date().toISOString()

});

saveApplications();

renderApplications();

updateDashboard();

}

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
👔 ${item.title}
</div>

<div class="offer-company">
🏢 ${item.company}
</div>

<div class="offer-actions">

<button
class="offer-btn"
onclick="changeStatus('${item.id}')">

🔄

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

function changeStatus(id){

const app =
applications.find(
item => item.id === id
);

if(!app){

return;

}

if(app.status === "Envoyée"){

app.status = "Réponse";

}
else if(app.status === "Réponse"){

app.status = "Entretien";

}
else if(app.status === "Entretien"){

app.status = "Embauche";

}

saveApplications();

renderApplications();

updateDashboard();

}
/* ==========================================
RESULTATS ET DASHBOARD
========================================== */

function updateResultsSummary(data){

document.getElementById(
"resultsCounter"
).textContent =
`💼 Offres trouvées : ${data.length}`;

const recommended =
data.filter(
offer =>
calculateMatch(offer) >= 90
).length;

document.getElementById(
"recommendedCounter"
).textContent =
`🔥 Très recommandées : ${recommended}`;

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

document.getElementById(
"newOffersCounter"
).textContent =
`🆕 Nouvelles offres : ${recent}`;

let average = 0;

if(data.length > 0){

average =
Math.round(

data.reduce(
(total, offer) =>
total +
calculateMatch(offer),
0
) / data.length

);

}

document.getElementById(
"averageMatchCounter"
).textContent =
`🤖 Match moyen IA : ${average}%`;

}

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

let average = 0;

if(offers.length){

average =
Math.round(

offers.reduce(
(total, offer) =>
total +
calculateMatch(offer),
0
) / offers.length

);

}

kpiAI.textContent =
`${average}%`;

}

updateApplicationCounters();

}

function updateApplicationCounters(){

const applicationsCount =
document.getElementById(
"applicationsCount"
);

const responsesCount =
document.getElementById(
"responsesCount"
);

const interviewsCount =
document.getElementById(
"interviewsCount"
);

const hiredCount =
document.getElementById(
"hiredCount"
);

if(applicationsCount){

applicationsCount.textContent =
applications.filter(
a => a.status === "Envoyée"
).length;

}

if(responsesCount){

responsesCount.textContent =
applications.filter(
a => a.status === "Réponse"
).length;

}

if(interviewsCount){

interviewsCount.textContent =
applications.filter(
a => a.status === "Entretien"
).length;

}

if(hiredCount){

hiredCount.textContent =
applications.filter(
a => a.status === "Embauche"
).length;

}

}
/* ==========================================
FILTRES
========================================== */

searchOffersBtn?.addEventListener(
"click",
applyFilters
);

resetFiltersBtn?.addEventListener(
"click",
resetFilters
);

function applyFilters(){

const selectedJobs =
getCheckedValues(
".filter-box:nth-of-type(1) input"
);

const selectedSectors =
getCheckedValues(
".filter-box:nth-of-type(2) input"
);

const selectedRates =
getCheckedValues(
".rate-grid input"
);

const selectedContracts =
getCheckedValues(
".filter-box:nth-of-type(4) input"
);

const selectedRegions =
getCheckedValues(
".filter-box:nth-of-type(5) input"
);

let filteredOffers =
offers.filter(offer => {

const jobMatch =
selectedJobs.length === 0
||
selectedJobs.includes(
offer.title
);

const sectorMatch =
selectedSectors.length === 0
||
selectedSectors.includes(
offer.sector
);

const rateMatch =
selectedRates.length === 0
||
selectedRates.includes(
String(
offer.rate
).replace("%","")
);

const contractMatch =
selectedContracts.length === 0
||
selectedContracts.includes(
offer.contract
);

const regionMatch =
selectedRegions.length === 0
||
selectedRegions.includes(
offer.location
);

return (

jobMatch
&&
sectorMatch
&&
rateMatch
&&
contractMatch
&&
regionMatch

);

});

renderOffers(
filteredOffers
);

}

function getCheckedValues(selector){

return [

...document.querySelectorAll(
`${selector}:checked`
)

].map(
item => item.value
);

}

function resetFilters(){

document
.querySelectorAll(
'input[type="checkbox"]'
)
.forEach(input => {

input.checked = false;

});

renderOffers(
offers
);

}
/* ==========================================
OUVERTURE OFFRE
========================================== */

function openOffer(offer){

if(
offer.url &&
offer.url.trim() !== ""
){

window.open(
offer.url,
"_blank"
);

}
else{

alert(
"Aucune URL disponible pour cette offre."
);

}

}

/* ==========================================
LETTRE IA
========================================== */

function generateLetter(offer){

const startsWithVowel =
/^[aeiouyhàâéèêëîïôöùûü]/i
.test(
offer.title
);

const article =
startsWithVowel
? "d'"
: "de ";

const letter = `

Nom Prénom

Adresse

NPA Ville



                                    ${offer.company || "Entreprise"}

                                    Adresse

                                    NPA Ville



Lausanne, le ${new Date().toLocaleDateString("fr-CH")}



Votre annonce parue pour un poste ${article}${offer.title}



Madame, Monsieur,

Je vous adresse ma candidature pour le poste mentionné dans votre annonce.

Mon expérience administrative, ma polyvalence et ma capacité d'organisation me permettent de répondre efficacement aux exigences de cette fonction.

Motivé(e), rigoureux(se) et orienté(e) qualité, je serais heureux(se) de pouvoir mettre mes compétences au service de votre organisation.

Je vous remercie de l'attention portée à ma candidature et me tiens à votre disposition pour un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.



Nom Prénom

`;

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
CV
========================================== */

document
.getElementById(
"cvFile"
)
?.addEventListener(
"change",
event => {

currentCV =
event.target.files[0];

}
);

document
.getElementById(
"analyzeCVBtn"
)
?.addEventListener(
"click",
() => {

if(!currentCV){

alert(
"Veuillez importer un CV."
);

return;

}

alert(
`CV importé :

${currentCV.name}

Analyse IA simulée terminée.`
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

updateDashboard();

}
);

/* ==========================================
EXPORT GLOBAL
========================================== */

window.openOffer =
openOffer;

window.generateLetter =
generateLetter;

window.addFavorite =
addFavorite;

window.addApplication =
addApplication;

window.changeStatus =
changeStatus;

/* ==========================================
FIN APP.JS
========================================== */
