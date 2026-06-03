/* ==========================================
JOB FINDER VAUD V14.0.0 PREMIUM IA
Créateur : F. Laratta
========================================== */

const express =
require(
"express"
);

const fs =
require(
"fs"
);

const path =
require(
"path"
);

const cors =
require(
"cors"
);

const app =
express();

const PORT =
process.env.PORT || 3000;

/* ==========================================
MIDDLEWARES
========================================== */

app.use(
cors()
);

app.use(
express.json()
);

app.use(
express.static(
path.join(
__dirname
)
)
);

/* ==========================================
FICHIERS
========================================== */

const OFFERS_FILE =
path.join(
__dirname,
"offers.json"
);

const FAVORITES_FILE =
path.join(
__dirname,
"favorites.json"
);

const APPLICATIONS_FILE =
path.join(
__dirname,
"candidatures.json"
);

/* ==========================================
LECTURE JSON
========================================== */

function readJson(file){

try{

const data =
fs.readFileSync(
file,
"utf8"
);

return JSON.parse(
data
);

}
catch(error){

console.error(
error
);

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

console.error(
error
);

return false;

}

}
/* ==========================================
API HEALTH
========================================== */

app.get(
"/api/health",
(req,res) => {

res.json({

status:"OK",

version:"14.0.0",

application:
"Job Finder Vaud",

timestamp:
new Date().toISOString()

});

}
);

/* ==========================================
API OFFRES
========================================== */

app.get(
"/api/offers",
(req,res) => {

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
(req,res) => {

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
(req,res) => {

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
(req,res) => {

let favorites =
readJson(
FAVORITES_FILE
);

favorites =
favorites.filter(
item =>
item.id !==
req.params.id
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
(req,res) => {

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
(req,res) => {

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
(req,res) => {

const candidatures =
readJson(
APPLICATIONS_FILE
);

const index =
candidatures.findIndex(
item =>
item.id ===
req.params.id
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
(req,res) => {

let candidatures =
readJson(
APPLICATIONS_FILE
);

candidatures =
candidatures.filter(
item =>
item.id !==
req.params.id
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
API STATISTIQUES
========================================== */

app.get(
"/api/stats",
(req,res) => {

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
(req,res) => {

writeJson(
FAVORITES_FILE,
[]
);

writeJson(
APPLICATIONS_FILE,
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
(req,res) => {

res.sendFile(
path.join(
__dirname,
"index.html"
)
);

}
);

/* ==========================================
GESTION ERREURS API
========================================== */

app.use(
(req,res) => {

res.status(404)
.json({

success:false,

message:
"Route introuvable"

});

}
);

app.use(
(error,req,res,next) => {

console.error(
error
);

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
() => {

console.log(
"=================================="
);

console.log(
"JOB FINDER VAUD V14.0.0 PREMIUM IA"
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
