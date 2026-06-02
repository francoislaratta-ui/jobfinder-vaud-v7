
/* ==========================================
   JOB FINDER VAUD
   V8.6.2 PREMIUM IA PRO
   Créateur F. Laratta
========================================== */

const express =
require(
"express"
);

const path =
require(
"path"
);

const fs =
require(
"fs"
);

const app =
express();

const PORT =
process.env.PORT ||
3000;

/* ==========================================
   MIDDLEWARES
========================================== */

app.use(

express.json({
limit:"10mb"
})

);

app.use(

express.urlencoded({

extended:true

})

);

app.use(

express.static(

path.join(
__dirname
)

)

);

/* ==========================================
   PAGE PRINCIPALE
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
   API OFFRES
========================================== */

app.get(

"/api/offers",

(req,res)=>{

try{

const offers =

JSON.parse(

fs.readFileSync(

path.join(

__dirname,

"offers.json"

),

"utf8"

)

);

res.json(
offers
);

}catch(error){

console.error(
error
);

res.status(500).json({

error:
"Erreur lecture offres"

});

}

}

);

/* ==========================================
   API SANTE
========================================== */

app.get(

"/api/health",

(req,res)=>{

res.json({

status:"ok",

application:

"Job Finder Vaud",

version:

"8.6.2",

creator:

"F. Laratta",

timestamp:

new Date()

});

}

);

/* ==========================================
   API ANALYSE IA
========================================== */

app.post(

"/api/analyze",

(req,res)=>{

const {

cv,

offer

} = req.body;

let score = 70;

if(

cv &&
cv.toLowerCase()
.includes(
"administratif"
)

){

score += 10;

}

if(

cv &&
cv.toLowerCase()
.includes(
"commerce"
)

){

score += 10;

}

if(

cv &&
cv.toLowerCase()
.includes(
"informatique"
)

){

score += 10;

}

if(score > 98){

score = 98;

}

res.json({

compatibility:

score

});

}

);

/* ==========================================
   API LETTRE
========================================== */

app.post(

"/api/letter",

(req,res)=>{

const {

company,

job

} = req.body;

const letter =

`Madame, Monsieur,

Je vous présente ma candidature pour le poste :

${job || ""}

au sein de :

${company || ""}

Je suis particulièrement motivé par cette opportunité et serais heureux de pouvoir vous rencontrer.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.`;

res.json({

letter

});

}

);

/* ==========================================
   404
========================================== */

app.use(

(req,res)=>{

res.status(404).json({

error:
"Route introuvable"

});

}

);

/* ==========================================
   START
========================================== */

app.listen(

PORT,

()=>{

console.log(

"==================================="

);

console.log(

"JOB FINDER VAUD"

);

console.log(

"V8.6.2 PREMIUM IA PRO"

);

console.log(

"Créateur F. Laratta"

);

console.log(

`Serveur actif : ${PORT}`

);

console.log(

"==================================="

);

}

);
