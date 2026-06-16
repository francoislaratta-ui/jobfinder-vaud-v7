/* ==========================================
JOB FINDER VAUD V14.6 PREMIUM IA
Créateur : F. Laratta
========================================== */

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const https = require("https");
const http = require("http");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 3000;

/* ==========================================
MIDDLEWARES
========================================== */

app.use(cors());
app.use(express.json());

/* ==========================================
FICHIERS
========================================== */

const OFFERS_FILE = path.join(
__dirname,
"offers.json"
);

const FAVORITES_FILE = path.join(
__dirname,
"favorites.json"
);

const APPLICATIONS_FILE = path.join(
__dirname,
"candidatures.json"
);

const LETTERS_FILE = path.join(
__dirname,
"letters.json"
);

/* ==========================================
LECTURE JSON
========================================== */

function readJson(file){

try{

if(!fs.existsSync(file)){
return [];
}

const data =
fs.readFileSync(
file,
"utf8"
);

return JSON.parse(data);

}
catch(error){

console.error(error);

return [];

}

}

/* ==========================================
ECRITURE JSON
========================================== */

function writeJson(
file,
data
){

try{

fs.writeFileSync(
file,
JSON.stringify(
data,
null,
2
),
"utf8"
);

return true;

}
catch(error){

console.error(error);

return false;

}

}

/* ==========================================
NETTOYAGE HTML DESCRIPTION
========================================== */

function cleanHtmlText(html){

if(!html){
return "";
}

return html
.replace(/<script[\s\S]*?<\/script>/gi, " ")
.replace(/<style[\s\S]*?<\/style>/gi, " ")
.replace(/<nav[\s\S]*?<\/nav>/gi, " ")
.replace(/<header[\s\S]*?<\/header>/gi, " ")
.replace(/<footer[\s\S]*?<\/footer>/gi, " ")
.replace(/<[^>]+>/g, " ")
.replace(/&nbsp;/g, " ")
.replace(/&amp;/g, "&")
.replace(/&quot;/g, "\"")
.replace(/&#39;/g, "'")
.replace(/&#x27;/g, "'")
.replace(/&#x2F;/g, "/")
.replace(/&#x3A;/g, ":")
.replace(/\s+/g, " ")
.trim();

}

function extractUsefulDescription(html){

const text = cleanHtmlText(html);

if(!text){
return "";
}

// Détection État de Vaud
const isEtatVaud =
html.includes("offres-emploi.vd.ch") ||
html.includes("Pourquoi rejoindre l") ||
html.includes("POSTULER MAINTENANT");

if(isEtatVaud){

const sections = [
"DESCRIPTION DE L'EMPLOI",
"Description de l'emploi",
"RESPONSABILITÉS",
"Responsabilités",
"QUALIFICATIONS",
"Qualifications",
"QUI SOMMES-NOUS",
"Qui sommes-nous",
"POURQUOI REJOINDRE",
"Pourquoi rejoindre"
];

const fields = [
{ label: "Taux d'activité", regex: /Taux d'activité\s*([^\n]{3,30})/i },
{ label: "Type de contrat", regex: /Type de contrat\s*([^\n]{3,30})/i },
{ label: "Date d'entrée", regex: /Date d'entr[ée]+e? en fonction\s*([^\n]{3,30})/i },
{ label: "Postuler avant", regex: /Postuler avant\s*([^\n]{3,30})/i },
{ label: "Classe salariale", regex: /Classe salariale\s*([^\n]{1,10})/i },
{ label: "Adresse", regex: /Adresse\s*([\s\S]{10,120}?)(?=Date|Taux|Type|Classe|Postuler|$)/i }
];

let result = "";

const structuredFields = fields
.map(f => {
const m = text.match(f.regex);
return m ? `${f.label} : ${m[1].trim()}` : null;
})
.filter(Boolean)
.join("\n");

if(structuredFields){
result += structuredFields + "\n\n";
}

let startIndex = -1;
for(const section of sections){
const index = text.toLowerCase().indexOf(section.toLowerCase());
if(index !== -1){
startIndex = index;
break;
}
}

if(startIndex !== -1){
let extracted = text.substring(startIndex, startIndex + 5000);

const stopWords = [
"Emplois similaires",
"Offres similaires",
"POSTULER MAINTENANT"
];

for(const stop of stopWords){
const idx = extracted.toLowerCase().indexOf(stop.toLowerCase());
if(idx > 200){
extracted = extracted.substring(0, idx).trim();
}
}

result += extracted;
}

return result.trim() || text.substring(0, 3500).trim();

}

// Détection Jobup
const isJobup = html.includes("jobup.ch");

if(isJobup){

const jobupFields = [
{ label: "Date de parution", regex: /(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/i },
{ label: "Taux", regex: /(\d{2,3}\s*[-–]\s*\d{2,3}\s*%|\d{2,3}\s*%)/i },
{ label: "Contrat", regex: /(Durée indéterminée|Durée déterminée|Temporaire|Apprentissage)/i },
{ label: "Lieu de travail", regex: /Lieu de travail\s*[:\s]+([A-Za-zÀ-ÿ\s,.-]+?)(?=\s{2,}|Vous êtes|$)/i },
{ label: "Adresse", regex: /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+\d+[,\s]+\d{4}\s+[A-Za-zÀ-ÿ\s-]+)/i },
{ label: "Salaire", regex: /(CHF\s*[\d\s'.]+(?:\s*[-–]\s*[\d\s'.]+)?\s*\/(?:an|mois))/i },
{ label: "Entrée en service", regex: /Entr[ée]e en (?:service|fonction)[^\w]*([^\n.]{3,50})/i }
];

let jobupResult = "";

jobupFields.forEach(f => {
const m = text.match(f.regex);
if(m) jobupResult += `${f.label} : ${(m[1] || m[0]).trim()}\n`;
});

if(jobupResult) jobupResult += "\n";

const keywords = [
"Votre mission",
"Vos missions",
"Vos tâches",
"Vos responsabilités",
"Votre profil",
"Profil recherché",
"Description du poste"
];

let startIndex = -1;
for(const keyword of keywords){
const index = text.toLowerCase().indexOf(keyword.toLowerCase());
if(index !== -1){ startIndex = index; break; }
}

let extracted = startIndex === -1
? text.substring(0, 3500)
: text.substring(startIndex, startIndex + 4500);

const stopWords = ["Autres recherches","Offres similaires","Emplois similaires","Estimateur de salaire"];
for(const stop of stopWords){
const idx = extracted.toLowerCase().indexOf(stop.toLowerCase());
if(idx > 200) extracted = extracted.substring(0, idx).trim();
}

const structured = extracted
.replace(/(MISSION DETAILLEE|VOTRE PROFIL|Votre profil|CE QUE NOUS OFFRONS|Ce que nous offrons|PROFIL RECHERCHÉ|Profil recherché|VOS MISSIONS|Vos missions|VOS TÂCHES|Vos tâches|NOS AVANTAGES|Nos avantages|NOUS OFFRONS|Nous offrons|VOTRE MISSION|Votre mission|Comment postuler|COMMENT POSTULER|Entrée en fonction|Contact)/g,
"\n\n$1\n");

return (jobupResult + structured).trim();
}

// Autres sources
const keywords = [
"Votre mission",
"Vos missions",
"Vos tâches",
"Vos responsabilités",
"Votre profil",
"Profil recherché",
"Description du poste",
"Ce que vous faites",
"Nous offrons",
"Votre rôle"
];

let startIndex = -1;

for(const keyword of keywords){
const index = text.toLowerCase().indexOf(keyword.toLowerCase());
if(index !== -1){
startIndex = index;
break;
}
}

let result =
startIndex === -1
? text.substring(0, 3500)
: text.substring(startIndex, startIndex + 4500);

const stopWords = [
"Autres recherches",
"Catégories :",
"Estimateur de salaire",
"Offres similaires",
"Emplois similaires"
];

for(const stopWord of stopWords){
const index = result.toLowerCase().indexOf(stopWord.toLowerCase());
if(index > 800){
result = result.substring(0, index).trim();
}
}

if(result.length < 300){
return text.substring(0, 3500).trim();
}

return result.trim();

}


/* ==========================================
API HEALTH
========================================== */

app.get(
"/api/health",
(req,res)=>{

res.json({

status:"OK",

version:"14.3.1",

application:
"Job Finder Vaud",

timestamp:
new Date().toISOString()

});

}
);


/* ==========================================
VALIDATION URL ANNONCE
========================================== */

function isGenericSourceUrl(url){

if(!url){
return true;
}

const cleanUrl =
String(url).toLowerCase().trim().replace(/\/$/, "");

const genericUrls = [
"https://www.vd.ch",
"http://www.vd.ch",
"https://vd.ch",
"http://vd.ch",

"https://www.lausanne.ch",
"http://www.lausanne.ch",
"https://lausanne.ch",
"http://lausanne.ch",

"https://www.retraitespopulaires.ch",
"http://www.retraitespopulaires.ch",
"https://retraitespopulaires.ch",
"http://retraitespopulaires.ch",

"https://www.epfl.ch/fr",
"https://www.epfl.ch",
"http://www.epfl.ch",
"https://epfl.ch",
"http://epfl.ch",

"https://www.migros.ch/fr",
"https://www.migros.ch",
"http://www.migros.ch",
"https://migros.ch",
"http://migros.ch",

"https://www.chuv.ch/fr",
"https://www.chuv.ch",
"http://www.chuv.ch",
"https://chuv.ch",
"http://chuv.ch",

"https://www.jobup.ch",
"http://www.jobup.ch",
"https://jobup.ch",
"http://jobup.ch",

"https://www.indeed.com",
"http://www.indeed.com",
"https://indeed.com",
"http://indeed.com",

"https://www.jobscout24.ch",
"http://www.jobscout24.ch",
"https://jobscout24.ch",
"http://jobscout24.ch",

"https://www.linkedin.com",
"http://www.linkedin.com",
"https://linkedin.com",
"http://linkedin.com"
];

return genericUrls.includes(cleanUrl);

}

function isRealOfferUrl(url){

if(!url){
return false;
}

const value =
String(url).toLowerCase().trim();

if(isGenericSourceUrl(value)){
return false;
}

/* JOBUP */
if(value.includes("jobup.ch") &&
(value.includes("/emplois/detail/") ||
value.includes("/jobs/detail/"))){
return true;
}

/* INDEED */
if(value.includes("indeed.") &&
(value.includes("/viewjob") ||
value.includes("jk="))){
return true;
}

/* JOBSCOUT24 */
if(value.includes("jobscout24.ch") &&
(value.includes("/job/") ||
value.includes("/jobs/") ||
value.includes("/detail/"))){
return true;
}

/* LINKEDIN */
if(value.includes("linkedin.com") &&
(value.includes("/jobs/view/") ||
value.includes("currentjobid="))){
return true;
}

/* VD.CH */
if(value.includes("vd.ch") &&
(value.includes("/offres-demploi/") ||
value.includes("/emploi/") ||
value.includes("/jobs/") ||
value.includes("jobid=") ||
value.includes("offre="))){
return true;
}

/* LAUSANNE.CH */
if(value.includes("lausanne.ch") &&
(value.includes("/emploi/") ||
value.includes("/offres-demploi/") ||
value.includes("/postes-vacants/") ||
value.includes("/jobs/"))){
return true;
}

/* RETRAITES POPULAIRES */
if(value.includes("retraitespopulaires.ch") &&
(value.includes("/emploi/") ||
value.includes("/carrieres/") ||
value.includes("/offres-demploi/") ||
value.includes("/jobs/"))){
return true;
}

/* EPFL */
if(value.includes("epfl.ch") &&
(value.includes("/about/working/") ||
value.includes("/careers/") ||
value.includes("/jobs/") ||
value.includes("/emploi/") ||
value.includes("jobid="))){
return true;
}

/* MIGROS */
if(value.includes("migros.ch") &&
(value.includes("/jobs/") ||
value.includes("/career/") ||
value.includes("/carriere/") ||
value.includes("/emploi/") ||
value.includes("jobid="))){
return true;
}

/* CHUV */
if(value.includes("chuv.ch") &&
(value.includes("/emploi/") ||
value.includes("/jobs/") ||
value.includes("/carrieres/") ||
value.includes("/offres-demploi/") ||
value.includes("jobid="))){
return true;
}

return false;
}

/* ==========================================
DETECTION SOURCE EMPLOYEUR
========================================== */

function getEmployerSource(url){

if(!url){
return "";
}

const value =
String(url).toLowerCase();

if(value.includes("vd.ch")){
return "vd";
}

if(value.includes("lausanne.ch")){
return "lausanne";
}

if(value.includes("retraitespopulaires.ch")){
return "retraitespopulaires";
}

if(value.includes("epfl.ch")){
return "epfl";
}

if(value.includes("migros.ch")){
return "migros";
}

if(value.includes("chuv.ch")){
return "chuv";
}

if(value.includes("jobup.ch")){
return "jobup";
}

if(value.includes("indeed")){
return "indeed";
}

if(value.includes("jobscout24")){
return "jobscout24";
}

if(value.includes("linkedin")){
return "linkedin";
}

return "";

}

/* ==========================================
API VALIDATION URL ANNONCE
========================================== */

app.get(
"/api/validate-offer-url",
(req,res)=>{

try{

const url =
req.query.url || "";

res.json({

success:true,

url,

isGeneric:
isGenericSourceUrl(url),

isRealOffer:
isRealOfferUrl(url),

source:
getEmployerSource(url)

});

}catch(error){

res.status(500).json({

success:false,

message:"Erreur validate-offer-url",

error:error.message

});

}

}
);


/* ==========================================
API EXTRACTION DESCRIPTION URL
========================================== */
app.post(
"/api/extract-description",
async (req,res)=>{

try{

const url = req.body?.url;

if(!url){
return res.status(400).json({
success:false,
description:"",
message:"URL manquante"
});
}

// Détection État de Vaud (Oracle HCM)
const etatVaudMatch = url.match(/#fr\/sites\/CX_1\/job\/(\d+)/);
const jobId = etatVaudMatch ? etatVaudMatch[1] : req.body?.id;

if(jobId && (url.includes("offres-emploi.vd.ch") || req.body?.source === "État de Vaud")){

const apiUrl = `https://fa-ewrg-saasfaeuraprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=ById;Id=%22${jobId}%22,siteNumber=CX_1`;

const axios = require("axios");

const response = await axios.get(apiUrl, {
headers:{
"Accept": "application/json",
"Accept-Language": "fr"
},
timeout: 10000
});

const items = response.data?.items;
if(!items || items.length === 0){
return res.json({ success:false, description:"Descriptif non disponible." });
}

const job = items[0];

const stripHtml = s => s ? s
.replace(/<[^>]+>/g," ")
.replace(/&nbsp;/g," ")
.replace(/&amp;/g,"&")
.replace(/&quot;/g,"\"")
.replace(/&#39;/g,"'")
.replace(/&eacute;/g,"é")
.replace(/&egrave;/g,"è")
.replace(/&agrave;/g,"à")
.replace(/&ccedil;/g,"ç")
.replace(/&\w+;/g," ")
.replace(/\s+/g," ")
.trim() : "";

const description = job.ExternalDescriptionStr || "";
const responsibilities = job.ExternalResponsibilitiesStr || "";
const qualifications = job.ExternalQualificationsStr || "";
const whoWeAre = job.OrganizationDescriptionStr || "";
const whyJoin = job.CorporateDescriptionStr || "";

const flexFields = job.requisitionFlexFields || [];
const getField = label => (flexFields.find(f => f.Prompt === label)?.Value || "");

const workRate = getField("Taux d'activité");
const salaryGrade = getField("Classe salariale");
const startDate = getField("Date d'entrée en fonction");
const contractType = getField("Type de contrat");
const address = getField("Adresse");
const applyBefore = job.ExternalPostedEndDate || "";
const applyBeforeFormatted = applyBefore ? new Date(applyBefore).toLocaleDateString("fr-CH") : "";

let result = "";
if(workRate) result += `Taux d'activité : ${workRate}\n`;
if(contractType) result += `Type de contrat : ${contractType}\n`;
if(salaryGrade) result += `Classe salariale : ${salaryGrade}\n`;
if(startDate) result += `Date d'entrée : ${startDate}\n`;
if(applyBeforeFormatted) result += `Postuler avant : ${applyBeforeFormatted}\n`;
if(address) result += `Adresse :\n${address}\n`;
if(result) result += "\n";
if(description) result += `DESCRIPTION DE L'EMPLOI\n${stripHtml(description)}\n\n`;
if(responsibilities) result += `RESPONSABILITÉS\n${stripHtml(responsibilities)}\n\n`;
if(qualifications) result += `QUALIFICATIONS\n${stripHtml(qualifications)}\n\n`;
if(whoWeAre) result += `QUI SOMMES-NOUS?\n${stripHtml(whoWeAre)}\n\n`;
if(whyJoin) result += `POURQUOI REJOINDRE L'ÉTAT DE VAUD?\n${stripHtml(whyJoin)}\n\n`;

return res.json({
success: true,
url,
description: result.trim() || "Descriptif non disponible.",
rate: workRate,
contract: contractType,
address: address,
startDate: startDate,
applyBefore: applyBeforeFormatted,
salaryGrade: salaryGrade
});

}

// Autres sources — extraction HTML classique
const client = url.startsWith("https") ? https : http;

client.get(url,(response)=>{

let html = "";
response.on("data", chunk => { html += chunk; });
response.on("end", ()=>{

try{
const description = extractUsefulDescription(html);
res.json({
success:true,
url,
description: description || "Descriptif non disponible."
});
}catch(error){
console.error("Erreur analyse HTML :", error);
res.status(500).json({ success:false, description:"", message:"Erreur analyse HTML" });
}

});

}).on("error",(error)=>{
console.error("Erreur téléchargement :", error);
res.status(500).json({ success:false, description:"", message:"Erreur téléchargement page" });
});

}
catch(error){
console.error("Erreur extraction description :", error);
res.status(500).json({ success:false, description:"", message:"Erreur extraction description" });
}

}
);


/* ==========================================
API OFFRES
========================================== */

app.get(
"/api/offers",
(req,res)=>{

const offers =
readJson(
OFFERS_FILE
);

res.json(
offers
);

}
);

app.delete("/api/offers/cache", (req,res)=>{
writeJson(OFFERS_FILE, []);
res.json({ success:true, message:"Cache vidé" });
});


/* ==========================================
API FAVORIS
========================================== */

app.get(
"/api/favorites",
(req,res)=>{

const favorites =
readJson(
FAVORITES_FILE
);

res.json(
favorites
);

}
);

app.post(
"/api/favorites",
(req,res)=>{

const favorites =
readJson(
FAVORITES_FILE
);

favorites.push(
req.body
);

writeJson(
FAVORITES_FILE,
favorites
);

res.json({

success:true,

message:
"Favori ajouté"

});

}
);

app.delete(
"/api/favorites/:id",
(req,res)=>{

let favorites =
readJson(
FAVORITES_FILE
);

favorites =
favorites.filter(
item =>
item.id !== req.params.id
);

writeJson(
FAVORITES_FILE,
favorites
);

res.json({

success:true,

message:
"Favori supprimé"

});

}
);


/* ==========================================
API CANDIDATURES
========================================== */

app.get(
"/api/candidatures",
(req,res)=>{

const candidatures =
readJson(
APPLICATIONS_FILE
);

res.json(
candidatures
);

}
);

app.post(
"/api/candidatures",
(req,res)=>{

const candidatures =
readJson(
APPLICATIONS_FILE
);

candidatures.push(
req.body
);

writeJson(
APPLICATIONS_FILE,
candidatures
);

res.json({

success:true,

message:
"Candidature ajoutée"

});

}
);

app.put(
"/api/candidatures/:id",
(req,res)=>{

const candidatures =
readJson(
APPLICATIONS_FILE
);

const index =
candidatures.findIndex(
item =>
item.id === req.params.id
);

if(index === -1){

return res.status(404)
.json({

success:false,

message:
"Candidature introuvable"

});

}

candidatures[index] = {

...candidatures[index],

...req.body

};

writeJson(
APPLICATIONS_FILE,
candidatures
);

res.json({

success:true,

message:
"Candidature mise à jour"

});

}
);

app.delete(
"/api/candidatures/:id",
(req,res)=>{

let candidatures =
readJson(
APPLICATIONS_FILE
);

candidatures =
candidatures.filter(
item =>
item.id !== req.params.id
);

writeJson(
APPLICATIONS_FILE,
candidatures
);

res.json({

success:true,

message:
"Candidature supprimée"

});

}
);

/* ==========================================
API LETTRES
========================================== */

app.get(
"/api/letters",
(req,res)=>{

const letters =
readJson(
LETTERS_FILE
);

res.json(
letters
);

}
);

app.post(
"/api/letters",
(req,res)=>{

const letters =
readJson(
LETTERS_FILE
);

letters.push(
req.body
);

writeJson(
LETTERS_FILE,
letters
);

res.json({

success:true,

message:
"Lettre sauvegardée"

});

}
);

app.delete(
"/api/letters/:id",
(req,res)=>{

let letters =
readJson(
LETTERS_FILE
);

letters =
letters.filter(
item =>
item.id !== req.params.id
);

writeJson(
LETTERS_FILE,
letters
);

res.json({

success:true,

message:
"Lettre supprimée"

});

}
);

/* ==========================================
API STATISTIQUES
========================================== */

app.get(
"/api/stats",
(req,res)=>{

const offers =
readJson(
OFFERS_FILE
);

const favorites =
readJson(
FAVORITES_FILE
);

const candidatures =
readJson(
APPLICATIONS_FILE
);

const letters =
readJson(
LETTERS_FILE
);

const sent =
candidatures.filter(
item =>
item.status === "Envoyée"
).length;

const responses =
candidatures.filter(
item =>
item.status === "Réponse"
).length;

const interviews =
candidatures.filter(
item =>
item.status === "Entretien"
).length;

const hired =
candidatures.filter(
item =>
item.status === "Embauche"
).length;

res.json({

offers:
offers.length,

favorites:
favorites.length,

applications:
candidatures.length,

letters:
letters.length,

sent,

responses,

interviews,

hired,

responseRate:
candidatures.length
? Math.round(
(responses /
candidatures.length)

* 100
  )
  : 0,

interviewRate:
candidatures.length
? Math.round(
(interviews /
candidatures.length)

* 100
  )
  : 0,

successRate:
candidatures.length
? Math.round(
(hired /
candidatures.length)

* 100
  )
  : 0

});

}
);

/* ==========================================
API RESET
========================================== */

app.post(
"/api/reset",
(req,res)=>{

writeJson(
FAVORITES_FILE,
[]
);

writeJson(
APPLICATIONS_FILE,
[]
);

writeJson(
LETTERS_FILE,
[]
);

res.json({

success:true,

message:
"Application réinitialisée"

});

}
);

/* ==========================================
ROUTE PRINCIPALE
========================================== */

app.use(express.static(path.join(__dirname)));

app.get(
"/",
(req,res)=>{

res.sendFile(
path.join(
__dirname,
"index.html"
)
);

}
);



/* ==========================================
OUTILS DECOUVERTE URL REELLE
========================================== */

function normalizeDiscoveryText(value){

return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^a-z0-9]+/g, " ")
.trim();

}

function scoreDiscoveryMatch(title, text){

const cleanTitle =
normalizeDiscoveryText(title);

const cleanText =
normalizeDiscoveryText(text);

if(!cleanTitle || !cleanText){
return 0;
}

const words =
cleanTitle
.split(" ")
.filter(word => word.length >= 4);

if(words.length === 0){
return 0;
}

let hits = 0;

for(const word of words){

if(cleanText.includes(word)){
hits++;
}

}

return hits / words.length;

}

async function fetchExternalText(url){

const isJobup = url.includes("jobup.ch");
const isJobScout = url.includes("jobscout24.ch");

const headers = isJobup ? {
"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
"Accept-Language":"fr-CH,fr;q=0.9",
"Referer":"https://www.jobup.ch/fr/emplois/",
"Origin":"https://www.jobup.ch"
} : isJobScout ? {
"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
"Accept-Language":"fr-CH,fr;q=0.9",
"Referer":"https://www.jobscout24.ch/fr/jobs/",
"Origin":"https://www.jobscout24.ch"
} : {
"User-Agent":"Mozilla/5.0 JobFinderVaud/14.5",
"Accept":"application/json,text/html,application/xhtml+xml,*/*",
"Accept-Language":"fr",
"Origin":"https://offres-emploi.vd.ch",
"Referer":"https://offres-emploi.vd.ch/",
"ora-irc-language":"fr"
};

const response = await axios.get(url, {
headers,
timeout: 10000,
maxRedirects: 5,
responseType: "text",
decompress: true
});

return response.data;

}

function extractLinksFromHtml(html, baseUrl){

const links = [];

const regex =
/href=["']([^"']+)["']/gi;

let match;

while((match = regex.exec(html)) !== null){

try{

const absoluteUrl =
new URL(match[1], baseUrl).href;

links.push(absoluteUrl);

}catch(error){

}

}

return [...new Set(links)];

}

/* ==========================================
DECOUVERTE URL REELLE ANNONCE V14.3.2
Recherche ciblée title + company + location
========================================== */

function isBadDiscoveryUrlV1433(url){

const value =
String(url || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

const blockedPatterns = [
"arc-emploi",
"arc emploi",
"programme-demploi",
"programme-emploi",
"programme emploi",
"emploi-temporaire",
"emploi temporaire",
"mesure",
"insertion",
"reinsertion",
"apprentissage",
"apprenti",
"places-dapprentissage",
"stage",
"stagiaire",
"formation",
"ecole",
"ecoles",
"campus",
"newsletter",
"agenda",
"actualite",
"actualites",
"communique",
"media",
"medias",
"portrait",
"temoignage",
"benevolat"
];

return blockedPatterns.some(pattern =>
value.includes(pattern)
);

}


function scoreDiscoveryUrlV1433(url, offer){

const value =
String(url || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

if(isBadDiscoveryUrlV1433(url)){
return 0;
}

let score =
scoreDiscoveryMatch(
`${offer.title || ""} ${offer.company || ""} ${offer.location || ""}`,
url
);

if(value.includes("job") || value.includes("jobs")){
score += 0.25;
}

if(value.includes("emploi") || value.includes("emplois")){
score += 0.2;
}

if(value.includes("offre") || value.includes("offres")){
score += 0.25;
}

if(value.includes("poste") || value.includes("postes")){
score += 0.2;
}

if(value.includes("recrutement")){
score += 0.2;
}

if(value.includes("career") || value.includes("carriere")){
score += 0.15;
}

if(value.includes("postuler") || value.includes("apply")){
score += 0.25;
}

return Math.max(0,score);

}


/* ==========================================
DECOUVERTE URL REELLE ANNONCE V14.4
Recherche précise + fallback carrière fiable
========================================== */

function getDiscoverySearchPages(domain){

const searchPagesMap = {
"vd.ch":[
"https://offres-emploi.vd.ch/#fr/sites/CX_1"
],
"lausanne.ch":[
"https://www.lausanne.ch/portrait/travailler-pour-la-ville/offres-emploi.html"
],
"chuv.ch":[
"https://www.chuv.ch/fr/chuv-home/carrieres/emplois"
],
"epfl.ch":[
"https://www.epfl.ch/about/working/fr/offres-emploi/"
],
"migros.ch":[
"https://jobs.migros.ch/fr"
],
"retraitespopulaires.ch":[
"https://www.retraitespopulaires.ch/emploi"
],
"jobup.ch":[
"https://www.jobup.ch/fr/emploi/"
],
"indeed.com":[
"https://ch.indeed.com/jobs"
],
"jobscout24.ch":[
"https://www.jobscout24.ch/fr/jobs/"
],
"linkedin.com":[
"https://www.linkedin.com/jobs/"
]
};

return searchPagesMap[domain] || [];

}

function getDiscoveryFallbackUrl(domain){

const pages =
getDiscoverySearchPages(domain);

return pages[0] || "";

}

function isBadDiscoveryUrl(url){

const value =
String(url || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

const blockedPatterns = [
"arc-emploi",
"arc emploi",
"programme-demploi",
"programme-emploi",
"programme emploi",
"emploi-temporaire",
"emploi temporaire",
"mesure",
"mesures",
"insertion",
"reinsertion",
"apprentissage",
"apprenti",
"places-dapprentissage",
"stage",
"stagiaire",
"formation",
"ecole",
"ecoles",
"campus",
"newsletter",
"agenda",
"actualite",
"actualites",
"communique",
"media",
"medias",
"portrait",
"temoignage",
"benevolat",
"login",
"connexion"
];

return blockedPatterns.some(pattern =>
value.includes(pattern)
);

}

function scoreDiscoveryUrlV144(url, offer){

const title =
String(offer.title || "").toLowerCase();

const company =
String(offer.company || "").toLowerCase();

const location =
String(offer.location || "").toLowerCase();

const value =
String(url || "").toLowerCase();

if(isBadDiscoveryUrl(value)){
return 0;
}

let score = 0;

/* TITRE */

const titleWords =
title
.split(/\s+/)
.filter(word => word.length >= 4);

let titleMatches = 0;

titleWords.forEach(word => {
if(value.includes(word)){
titleMatches++;
}
});

if(titleWords.length){
score += Math.min(
0.50,
(titleMatches / titleWords.length) * 0.50
);
}

/* ENTREPRISE */

const companyWords =
company
.split(/\s+/)
.filter(word => word.length >= 3);

let companyMatches = 0;

companyWords.forEach(word => {
if(value.includes(word)){
companyMatches++;
}
});

if(companyWords.length){
score += Math.min(
0.20,
(companyMatches / companyWords.length) * 0.20
);
}

/* LOCALISATION */

if(location && value.includes(location)){
score += 0.15;
}

/* MOTS POSITIFS */

if(value.includes("offre")){
score += 0.15;
}

if(value.includes("emploi")){
score += 0.10;
}

if(value.includes("job")){
score += 0.10;
}

if(value.includes("poste")){
score += 0.10;
}

if(value.includes("recrutement")){
score += 0.10;
}

if(value.includes("postuler")){
score += 0.10;
}

if(value.includes("apply")){
score += 0.10;
}

/* PENALITES PAGES GENERIQUES */

if(value.includes("carriere")){
score -= 0.10;
}

if(value.includes("career")){
score -= 0.10;
}

if(value.includes("etat-employeur")){
score -= 0.30;
}

if(value.includes("travailler-pour")){
score -= 0.20;
}

if(value.includes("ressources-humaines")){
score -= 0.20;
}

if(isGenericSourceUrl(value)){
score -= 0.30;
}

return Math.max(0, Number(score.toFixed(2)));

}

async function discoverGenericOfferUrl(offer, domain){

const searchPages =
getDiscoverySearchPages(domain);

const fallbackUrl =
getDiscoveryFallbackUrl(domain);

const isVd =
domain === "vd.ch";

const allowedDomains =
isVd
? [
"vd.ch",
"offres-emploi.vd.ch",
"oraclecloud.com",
"oraclecloud.eu"
]
: [domain];

let bestUrl = "";
let bestScore = 0;

function extractExtraUrlsFromHtml(html, baseUrl){

const results = [];

const raw =
String(html || "");

const absoluteMatches =
raw.match(/https?:\/\/[^"' <>()\\]+/g) || [];

for(const url of absoluteMatches){
results.push(url);
}

const relativeMatches =
raw.match(/["'](\/[^"']+)["']/g) || [];

for(const item of relativeMatches){

try{

const clean =
item.replace(/^["']|["']$/g,"");

const absolute =
new URL(clean, baseUrl).href;

results.push(absolute);

}catch(error){}

}

return [...new Set(results)];

}

for(const pageUrl of searchPages){

try{

const html =
await fetchExternalText(pageUrl);

console.log("V14.4.3 SEARCH PAGE:", pageUrl);
console.log("V14.4.3 HTML LENGTH:", html ? html.length : 0);

const directMatches =
String(html || "")
.match(/detail-offre-emploi\/pj[0-9]+\.html/g) || [];

const directLinks =
directMatches.map(path =>
new URL(path, pageUrl).href
);

const links =
[
...extractLinksFromHtml(html, pageUrl),
...extractExtraUrlsFromHtml(html, pageUrl),
...directLinks
];

const uniqueLinks =
[...new Set(links)];

console.log(
"V14.5 DIRECT LAUSANNE LINKS:",
directLinks.length
);

console.log("V14.4.3 LINKS FOUND:", uniqueLinks.length);
console.log("V14.4.3 FIRST LINKS:", uniqueLinks.slice(0,10));

const candidateLinks =
uniqueLinks.filter(link => {

const value =
String(link || "").toLowerCase();

const blockedTechnicalLinks = [
".css",
".js",
".png",
".jpg",
".jpeg",
".svg",
".ico",
".webmanifest",
"favicon",
"typo3conf",
"typo3temp",
"assets",
"resources/public",
"fonts",
"analytics",
"matomo",
"cookie",
"privacy",
"mentions-legales"
];

const isTechnicalLink =
blockedTechnicalLinks.some(pattern =>
value.includes(pattern)
);

const isAllowedDomain =
allowedDomains.some(allowed =>
value.includes(allowed)
);

const looksLikeJobUrl =
value.includes("job") ||
value.includes("emploi") ||
value.includes("offer") ||
value.includes("offre") ||
value.includes("requisition") ||
value.includes("requisitions") ||
value.includes("posting") ||
value.includes("career") ||
value.includes("cx_1");

return (
isAllowedDomain &&
!isTechnicalLink &&
!isBadDiscoveryUrl(value) &&
(
!isVd ||
looksLikeJobUrl
)
);

});

console.log("V14.4.3 CANDIDATE LINKS:", candidateLinks.length);
console.log("V14.4.3 FIRST CANDIDATES:", candidateLinks.slice(0,20));

for(const link of candidateLinks){

const score =
scoreDiscoveryUrlV144(link, offer);

if(score > bestScore){

bestScore = score;
bestUrl = link;

}

}

}catch(error){

console.warn(
"Découverte V14.4.3 impossible :",
domain,
error.message
);

}

}

console.log(
"V14.4.3 BEST URL:",
bestUrl,
"BEST SCORE:",
bestScore
);

if(bestUrl && bestScore >= 0.65 && !isBadDiscoveryUrl(bestUrl)){

return {
success:true,
message:"URL réelle trouvée par recherche ciblée V14.4.3",
discoveredUrl:bestUrl,
score:bestScore,
fallback:false
};

}

if(fallbackUrl){

return {
success:true,
message:"Aucune annonce précise trouvée, retour vers la page officielle des offres",
discoveredUrl:fallbackUrl,
score:0.25,
fallback:true
};

}

return {
success:false,
message:"Aucune annonce réelle trouvée",
discoveredUrl:"",
score:bestScore,
fallback:false
};

}

async function discoverVdOfferUrl(offer){

const title =
offer.title || offer.jobTitle || "";

const location =
offer.location || "";

const keyword =
encodeURIComponent(`"${title}"`);

const oracleUrl =
`https://fa-ewrg-saasfaeuraprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.workLocation,requisitionList.otherWorkLocations,requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields&finder=findReqs;siteNumber=CX_1,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=25,keyword=${keyword},sortBy=RELEVANCY`;

try{

const jsonText =
await fetchExternalText(oracleUrl);

const data =
JSON.parse(jsonText);

const requisitions =
data?.items?.[0]?.requisitionList || [];

console.log("V14.5 VD ORACLE JOBS FOUND:", requisitions.length);

let bestJob = null;
let bestScore = 0;

for(const job of requisitions){

const jobTitle =
job.Title || "";

const jobLocation =
job.PrimaryLocation || "";

const shortDescription =
job.ShortDescriptionStr || "";

let score = 0;

const cleanTextLocal = value =>
String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.replace(/[^a-z0-9\s]/g," ")
.replace(/\s+/g," ")
.trim();

const cleanA =
cleanTextLocal(jobTitle + " " + jobLocation + " " + shortDescription);

const cleanTitle =
cleanTextLocal(title);

const cleanLocation =
cleanTextLocal(location);

const cleanCompany =
cleanTextLocal(offer.company || "Etat de Vaud");

if(cleanTitle && cleanA.includes(cleanTitle)){
score += 0.7;
}

if(cleanLocation && cleanA.includes(cleanLocation)){
score += 0.2;
}

if(cleanCompany && cleanA.includes(cleanCompany)){
score += 0.1;
}

score += Number(job.Relevancy || 0) / 100;

if(score > bestScore){

bestScore = score;
bestJob = job;

}

}

if(bestJob && bestJob.Id){

const discoveredUrl =
`https://offres-emploi.vd.ch/#fr/sites/CX_1/job/${bestJob.Id}`;

return {
success:true,
message:"Annonce VD trouvée via Oracle Recruiting Cloud",
discoveredUrl,
score:bestScore,
fallback:false,
oracleId:bestJob.Id,
title:bestJob.Title || "",
location:bestJob.PrimaryLocation || "",
description:bestJob.ShortDescriptionStr || ""
};

}

}catch(error){

console.warn(
"Découverte VD Oracle impossible :",
error.message
);

}

return await discoverGenericOfferUrl(offer,"vd.ch");

}

async function discoverLausanneOfferUrl(offer){

const searchUrl =
"https://www.lausanne.ch/officiel/travailler-a-la-ville/nous-rejoindre/offres-emploi.html";

const fallbackUrl =
searchUrl;

const title =
offer.title || offer.jobTitle || "";

const cleanTextLocal = value =>
String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.replace(/[^a-z0-9\s]/g," ")
.replace(/\s+/g," ")
.trim();

try{

const html =
await fetchExternalText(searchUrl);

const links =
extractLinksFromHtml(html, searchUrl);

const raw =
String(html || "");

const directMatches =
raw.match(/detail-offre-emploi\/pj[0-9]+\.html/g) || [];

const directLinks =
directMatches.map(path =>
new URL(path, searchUrl).href
);

const candidates =
[...new Set([
...links,
...directLinks
])]
.filter(link =>
String(link || "").includes("detail-offre-emploi/pj") &&
String(link || "").includes(".html")
);

console.log("V14.5 LAUSANNE CANDIDATES:", candidates.length);
console.log("V14.5 LAUSANNE FIRST CANDIDATES:", candidates.slice(0,10));

let bestUrl = "";
let bestScore = 0;

for(const link of candidates){

try{

const detailHtml =
await fetchExternalText(link);

const cleanPage =
cleanTextLocal(detailHtml);

const cleanTitle =
cleanTextLocal(title);

let score = 0;

if(cleanTitle && cleanPage.includes(cleanTitle)){
score += 0.8;
}

if(cleanPage.includes("lausanne")){
score += 0.1;
}

if(cleanPage.includes("ville de lausanne")){
score += 0.1;
}

if(score > bestScore){
bestScore = score;
bestUrl = link;
}

}catch(error){

console.warn(
"Lecture annonce Lausanne impossible :",
link,
error.message
);

}

}

if(bestUrl && bestScore >= 0.7){

return {
success:true,
message:"Annonce Lausanne trouvée via page officielle",
discoveredUrl:bestUrl,
score:bestScore,
fallback:false
};

}

}catch(error){

console.warn(
"Découverte Lausanne impossible :",
error.message
);

}

return {
success:true,
message:"Aucune annonce Lausanne précise trouvée, retour vers la page officielle des offres",
discoveredUrl:fallbackUrl,
score:0.25,
fallback:true
};

}

async function discoverChuvOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"chuv.ch");
}

async function discoverEpflOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"epfl.ch");
}

async function discoverMigrosOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"migros.ch");
}

async function discoverRetraitesOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"retraitespopulaires.ch");
}

async function discoverJobupOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"jobup.ch");
}

async function discoverIndeedOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"indeed.com");
}

async function discoverJobScoutOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"jobscout24.ch");
}

async function discoverLinkedInOfferUrl(offer){

const discovery =
await discoverGenericOfferUrl(offer,"linkedin.com");

const url =
String(discovery?.discoveredUrl || "");

const match =
url.match(/[?&]currentJobId=([0-9]+)/i);

if(match && match[1]){

return {
...discovery,
success:true,
discoveredUrl:`https://www.linkedin.com/jobs/view/${match[1]}`,
changed:true,
score:Math.max(Number(discovery?.score || 0),0.85)
};

}

return discovery;

}

async function discoverRealOfferUrl(offer){

const originalUrl =
offer.offerUrl || offer.url || "";

const source =
getEmployerSource(originalUrl);

switch(source){

case "vd":
return await discoverVdOfferUrl(offer);

case "lausanne":
return await discoverLausanneOfferUrl(offer);

case "chuv":
return await discoverChuvOfferUrl(offer);

case "epfl":
return await discoverEpflOfferUrl(offer);

case "migros":
return await discoverMigrosOfferUrl(offer);

case "retraites":
return await discoverRetraitesOfferUrl(offer);

case "jobup":
return await discoverJobupOfferUrl(offer);

case "indeed":
return await discoverIndeedOfferUrl(offer);

case "jobscout24":
return await discoverJobScoutOfferUrl(offer);

case "linkedin":
return await discoverLinkedInOfferUrl(offer);

default:
return {
success:false,
discoveredUrl:"",
score:0
};

}

}

/* ==========================================
DECOUVERTE URL REELLE ANNONCE V14.5
========================================== */

app.post(
"/api/discover-offer-url",
async (req,res)=>{

try{

const offer =
req.body?.offer || {};

const originalUrl =
offer.offerUrl || offer.url || "";

if(!originalUrl){

return res.json({
success:false,
message:"URL source absente",
originalUrl:"",
discoveredUrl:"",
changed:false
});

}

if(isRealOfferUrl(originalUrl)){

return res.json({
success:true,
message:"URL déjà réelle",
originalUrl,
discoveredUrl:originalUrl,
changed:false,
source:getEmployerSource(originalUrl)
});

}

if(!isGenericSourceUrl(originalUrl)){

return res.json({
success:false,
message:"URL non générique mais non reconnue comme annonce réelle",
originalUrl,
discoveredUrl:"",
changed:false,
source:getEmployerSource(originalUrl)
});

}

const discovery =
await discoverRealOfferUrl(offer);

if(discovery.success && discovery.discoveredUrl){

return res.json({
success:true,
message:"URL réelle trouvée",
originalUrl,
discoveredUrl:discovery.discoveredUrl,
changed:true,
score:discovery.score,
company:offer.company || "",
title:offer.title || "",
location:offer.location || "",
source:getEmployerSource(originalUrl)
});

}

return res.json({
success:false,
message:"Aucune URL réelle trouvée",
originalUrl,
discoveredUrl:"",
changed:false,
score:discovery.score || 0,
company:offer.company || "",
title:offer.title || "",
location:offer.location || "",
source:getEmployerSource(originalUrl)
});

}catch(error){

res.status(500).json({
success:false,
message:"Erreur discover-offer-url",
error:error.message
});

}

}
);


/* ==========================================
TEST DECOUVERTE URL GET TEMPORAIRE V14.5
========================================== */

app.get(
"/api/test-discover-offer-url",
async (req,res)=>{

try{

const offer = {
title:req.query.title || "Gestionnaire de dossiers",
company:req.query.company || "Etat de Vaud",
location:req.query.location || "Lausanne",
offerUrl:req.query.url || "https://www.vd.ch"
};

const discovery =
await discoverRealOfferUrl(offer);

res.json({
success:discovery.success,
message:discovery.success ? "URL réelle trouvée par recherche ciblée" : "Aucune URL réelle trouvée",
originalUrl:offer.offerUrl,
discoveredUrl:discovery.discoveredUrl || "",
changed:!!discovery.discoveredUrl,
score:discovery.score || 0,
company:offer.company,
title:offer.title,
location:offer.location,
source:getEmployerSource(offer.offerUrl),
oracleId:discovery.oracleId || "",
detailTitle:discovery.title || "",
detailLocation:discovery.location || "",
detailDescription:discovery.description || ""
});

}catch(error){

res.status(500).json({
success:false,
message:"Erreur test-discover-offer-url",
error:error.message
});

}

}
);

/* ==========================================
API SCRAPE ON DEMAND
========================================== */

app.post(
"/api/scrape",
async (req,res)=>{

try{

await scrapeAllOffers();

const offers = readJson(OFFERS_FILE);

res.json({
success:true,
count:offers.length,
message:`${offers.length} offres récupérées`
});

}catch(error){

res.status(500).json({
success:false,
message:"Erreur scraping",
error:error.message
});

}

}
);


/* ==========================================
PROXY RSS JOBUP
========================================== */

app.get(
"/api/proxy-rss",
async (req,res)=>{

try{

const term = req.query.term || "";
const region = req.query.region || "vd";

const url =
`https://www.jobup.ch/fr/emplois/rss/?term=${encodeURIComponent(term)}&region=${region}`;

const response =
await axios.get(url, {
headers:{
"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
"Accept":"application/rss+xml, text/xml, */*",
"Accept-Language":"fr-CH,fr;q=0.9",
"Referer":"https://www.jobup.ch/fr/emplois/",
"Origin":"https://www.jobup.ch"
},
timeout: 10000,
responseType: "text"
});

res.set("Content-Type", "application/xml");
res.set("Access-Control-Allow-Origin", "*");
res.send(response.data);

}catch(error){

console.warn("Erreur proxy RSS Jobup :", error.message);

res.status(500).json({
success:false,
message:"Erreur proxy RSS",
error:error.message
});

}

}
);

/* ==========================================
SCRAPING OFFRES AU DEMARRAGE
========================================== */

const SEARCH_KEYWORDS = [
"employé de commerce",
"assistant administratif",
"gestionnaire de dossier",
"technicien informatique",
"support informatique",
"helpdesk",
"back-office",
"collaborateur administratif"
];

const VAUD_REGIONS = [
"Vaud",
"Lausanne",
"Morges",
"Nyon",
"Vevey",
"Renens",
"Yverdon",
"Aigle",
"Broye-Vully",
"Gros-de-Vaud",
"Jura-Nord vaudois",
"Lavaux-Oron",
"Riviera-Pays-d'Enhaut",
"Ouest lausannois"
];

const VAUD_PLACES = [
"lausanne","morges","nyon","vevey","renens",
"yverdon","aigle","montreux","pully","prilly",
"bussigny","crissier","gland","rolle","aubonne",
"cossonay","echallens","moudon","oron","payerne",
"ste-croix","vallorbe","orbe","grandson","avenches",
"cudrefin","estavayer","lucens","romont","bulle",
"villeneuve","bex","ollon","leysin","gryon",
"vd","vaud","west lausanne","lausanne district"
];

async function fetchJobupOffers(){

const offers = [];

try{

for(const keyword of SEARCH_KEYWORDS){

const encodedKeyword =
encodeURIComponent(keyword);

const url =
`https://www.jobup.ch/fr/emplois/?term=${encodedKeyword}&regionIds=52`;

const html =
await fetchExternalText(url);

const initMatch =
html.match(/__INIT__\s*=\s*(\{[\s\S]*?\});\s*(?:__LOAD_LAZY__|__LOCALE__)/);

if(!initMatch){
console.log(`Jobup "${keyword}": __INIT__ non trouvé`);
continue;
}

const data = JSON.parse(initMatch[1]);

const results =
data?.vacancy?.results?.main?.results || [];

console.log(`Jobup "${keyword}": ${results.length} offres`);

for(const job of results){

const jobId = job.id || "";
const place = job.place || "";

const isVaud =
job.regions?.some(r =>
String(r).includes("52") ||
String(r).toLowerCase().includes("vaud")
) ||
VAUD_PLACES.some(v =>
place.toLowerCase().includes(v)
) ||
job.locations?.some(l =>
l.cantonCode === "VD"
);

if(!isVaud) continue;

const titleLower = (job.title || "").toLowerCase();
const keywordWords = keyword.toLowerCase().split(" ");
if(!keywordWords.some(w => w.length > 4 && titleLower.includes(w))) continue;

const apprentiKeywords = [
"apprenti","apprentie","apprenant",
"préapprentissage","préapprenti",
"cfc en cours","stage","stagiaire"
];
if(apprentiKeywords.some(a => titleLower.includes(a))) continue;

offers.push({
id: String(jobId || generateServerId()),
title: job.title || "",
company: job.company?.name || "",
location: place,
address: job.street
? `${job.street}, ${job.zipCode || ""} ${place}`.trim()
: "",
sector: "",
rate: job.employmentGrades
? job.employmentGrades[0] === job.employmentGrades[1]
? `${job.employmentGrades[0]}%`
: `${job.employmentGrades[0]}-${job.employmentGrades[1]}%`
: "",
contract: job.contractType || "",
source: "Jobup",
offerUrl: jobId
? `https://www.jobup.ch/fr/emplois/detail/${jobId}/`
: "",
date: job.publicationDate
? job.publicationDate.split("T")[0]
: new Date().toISOString().split("T")[0],
description: job.lead || "Descriptif non disponible.",
salary: job.salary
? `CHF ${job.salary}`
: "",
});

}

}

}catch(error){

console.warn("Erreur scraping Jobup :", error.message);

}

return offers;

}

async function fetchJobScout24Offers(){

const offers = [];

try{

for(const keyword of SEARCH_KEYWORDS){

const encodedKeyword =
encodeURIComponent(keyword);

const url =
`https://www.jobscout24.ch/fr/jobs/rss/${encodedKeyword}/vaud/`;

const xml =
await fetchExternalText(url);

const items =
xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

console.log(`JobScout24 RSS "${keyword}": ${items.length} offres`);

for(const item of items){

const title =
(item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] ||
(item.match(/<title>(.*?)<\/title>/) || [])[1] || "";

const company =
(item.match(/<author>(.*?)<\/author>/) ||
item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) || [])[1] || "";

const link =
(item.match(/<link>(.*?)<\/link>/) || [])[1] || "";

const description =
(item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || "";

const pubDate =
(item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";

const location =
(item.match(/<city>(.*?)<\/city>/) ||
item.match(/<region>(.*?)<\/region>/) || [])[1] || "Vaud";

if(!title) continue;

offers.push({
id: generateServerId(),
title: title.trim(),
company: company.trim(),
location: location.trim(),
sector: "",
rate: "",
contract: "",
source: "JobScout24",
offerUrl: link.trim(),
date: pubDate
? new Date(pubDate).toISOString().split("T")[0]
: new Date().toISOString().split("T")[0],
description: description || "Descriptif non disponible.",
salary: ""
});

}

}

}catch(error){

console.warn("Erreur scraping JobScout24 RSS :", error.message);

}

return offers;

}

async function fetchVdOffers(){

const offers = [];

try{

for(const keyword of SEARCH_KEYWORDS){

const encodedKeyword =
encodeURIComponent(`"${keyword}"`);

const url =
`https://fa-ewrg-saasfaeuraprod1.fa.ocs.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.workLocation,requisitionList.otherWorkLocations&finder=findReqs;siteNumber=CX_1,limit=20,keyword=${encodedKeyword},sortBy=RELEVANCY`;

const html =
await fetchExternalText(url);

const data =
JSON.parse(html);

const jobs =
data?.items?.[0]?.requisitionList || [];

for(const job of jobs){

offers.push({
id: String(job.Id || generateServerId()),
title: job.Title || "",
company: "État de Vaud",
location: job.PrimaryLocation || "Vaud",
sector: "Administration publique",
rate: "",
contract: "",
source: "État de Vaud",
offerUrl: job.Id
? `https://offres-emploi.vd.ch/#fr/sites/CX_1/job/${job.Id}`
: "",
date: job.PostedDate || new Date().toISOString().split("T")[0],
description: job.ShortDescriptionStr || "Descriptif non disponible.",
salary: ""
});

}

}

}catch(error){

console.warn("Erreur scraping État de Vaud :", error.message);

}

return offers;

}

function generateServerId(){
return Date.now().toString() +
Math.random().toString(36).substring(2, 8);
}

function deduplicateOffers(offers){

const seen = new Set();
const result = [];

for(const offer of offers){

const key =
`${offer.title}-${offer.company}-${offer.location}`
.toLowerCase()
.replace(/\s+/g, "");

if(!seen.has(key)){
seen.add(key);
result.push(offer);
}

}

return result;

}

async function scrapeAllOffers(){

console.log("🔄 Scraping des offres en cours...");

const [
jobupOffers,
jobscoutOffers,
vdOffers
] = await Promise.all([
fetchJobupOffers(),
fetchJobScout24Offers(),
fetchVdOffers()
]);

const allOffers =
deduplicateOffers([
...jobupOffers,
...jobscoutOffers,
...vdOffers
]);

if(allOffers.length > 0){

writeJson(OFFERS_FILE, allOffers);

console.log(
`✅ ${allOffers.length} offres scrapées et sauvegardées`
);

console.log(
`📊 Jobup: ${jobupOffers.length} | JobScout24: ${jobscoutOffers.length} | VD: ${vdOffers.length}`
);

}else{

console.warn(
"⚠️ Aucune offre récupérée — offers.json conservé"
);

}

}


/* ==========================================
DEMARRAGE SERVEUR
========================================== */

app.listen(
PORT,
async ()=>{

console.log(
"=================================="
);

console.log(
"JOB FINDER VAUD V14.5 PREMIUM IA"
);

console.log(
`Serveur démarré : http://localhost:${PORT}`
);

console.log(
"=================================="
);

await scrapeAllOffers();

}
);

/* ==========================================
FIN SERVER.JS
========================================== */
