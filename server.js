/* ==========================================
JOB FINDER VAUD V14.3.1 PREMIUM IA
Créateur : F. Laratta
========================================== */

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const https = require("https");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 3000;

/* ==========================================
MIDDLEWARES
========================================== */

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
.replace(/\s+/g, " ")
.trim();

}

function extractUsefulDescription(html){

const text =
cleanHtmlText(html);

if(!text){
return "";
}

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

const index =
text.toLowerCase().indexOf(keyword.toLowerCase());

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

const index =
result.toLowerCase().indexOf(stopWord.toLowerCase());

if(index > 800){
result =
result.substring(0, index).trim();
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
(req,res)=>{

try{

const url =
req.body?.url;

if(!url){

return res.status(400).json({
success:false,
description:"",
message:"URL manquante"
});

}

const client =
url.startsWith("https")
? https
: http;

client.get(url,(response)=>{

let html = "";

response.on(
"data",
chunk => {
html += chunk;
}
);

response.on(
"end",
()=>{

try{

const description =
extractUsefulDescription(html);

res.json({

success:true,

url,

description:
description ||
"Descriptif non disponible."

});

}
catch(error){

console.error(
"Erreur analyse HTML :",
error
);

res.status(500).json({

success:false,

description:"",

message:
"Erreur analyse HTML"

});

}

});

}).on(
"error",
(error)=>{

console.error(
"Erreur téléchargement :",
error
);

res.status(500).json({

success:false,

description:"",

message:
"Erreur téléchargement page"

});

}

);

}
catch(error){


console.error(
"Erreur extraction description :",
error
);

res.status(500).json({

success:false,

description:"",

message:
"Erreur extraction description"

});

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

function fetchExternalText(url){

return new Promise((resolve,reject)=>{

try{

const parsedUrl =
new URL(url);

const client =
parsedUrl.protocol === "https:"
? require("https")
: require("http");

const request =
client.get(
url,
{
headers:{
"User-Agent":"Mozilla/5.0 JobFinderVaud/14.3.1",
"Accept":"text/html,application/xhtml+xml"
}
},
response=>{

let data = "";

response.on("data", chunk => {
data += chunk;
});

response.on("end", () => {
resolve(data);
});

}
);

request.on("error", reject);

request.setTimeout(10000, () => {
request.destroy();
reject(new Error("Timeout récupération page"));
});

}catch(error){

reject(error);

}

});

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

if(isBadDiscoveryUrl(url)){
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

const links =
[
...extractLinksFromHtml(html, pageUrl),
...extractExtraUrlsFromHtml(html, pageUrl)
];

const uniqueLinks =
[...new Set(links)];

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
return await discoverGenericOfferUrl(offer,"vd.ch");
}

async function discoverLausanneOfferUrl(offer){
return await discoverGenericOfferUrl(offer,"lausanne.ch");
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
return await discoverGenericOfferUrl(offer,"linkedin.com");
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
DECOUVERTE URL REELLE ANNONCE V14.3.2
Recherche par title + company + location
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
TEST DECOUVERTE URL GET TEMPORAIRE V14.3.2
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
source:getEmployerSource(offer.offerUrl)
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
GESTION ERREURS
========================================== */

app.use(
(req,res)=>{

res.status(404)
.json({

success:false,

message:
"Route introuvable"

});

}
);

app.use(
(error,req,res,next)=>{

console.error(error);

res.status(500)
.json({

success:false,

message:
"Erreur interne serveur"

});

}
);

/* ==========================================
DEMARRAGE SERVEUR
========================================== */

app.listen(
PORT,
()=>{

console.log(
"=================================="
);

console.log(
"JOB FINDER VAUD V14.3.1 PREMIUM IA"
);

console.log(
`Serveur démarré :
http://localhost:${PORT}`
);

console.log(
"=================================="
);

}
);

/* ==========================================
FIN SERVER.JS
========================================== */
