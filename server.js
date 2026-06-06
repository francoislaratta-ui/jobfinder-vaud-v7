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

return genericUrls.includes(cleanUrl);

}

function isRealOfferUrl(url){

if(!url){
return false;
}

const cleanUrl =
url.toLowerCase();

if(isGenericSourceUrl(cleanUrl)){
return false;
}

return (
cleanUrl.includes("/emplois/detail/") ||
cleanUrl.includes("/jobs/view/") ||
cleanUrl.includes("/rc/clk") ||
cleanUrl.includes("/job/")
);

}

/* ==========================================
API VALIDATION URL ANNONCE
========================================== */

app.post(
"/api/validate-offer-url",
(req,res)=>{

const url =
req.body?.url || "";

res.json({

success:true,

url,

isGeneric:
isGenericSourceUrl(url),

isRealOffer:
isRealOfferUrl(url)

});

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
