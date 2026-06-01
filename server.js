const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT =
process.env.PORT || 3000;

app.use(
express.json({
limit:"10mb"
})
);

app.use(
express.static(__dirname)
);

app.get(
"/offers",
(req,res)=>{

try{

const offres =

JSON.parse(

fs.readFileSync(
"./offers.json",
"utf8"
)

);

res.json(
offres
);

}catch(error){

res.status(500).json({

error:
"Impossible de charger les offres"

});

}

}
);

app.get(
"/health",
(req,res)=>{

res.json({

status:"ok",

application:
"Job Finder Vaud V10",

version:
"10.0",

mode:
"Ultimate AI Edition"

});

}
);

app.get(
"/stats",
(req,res)=>{

try{

const offres =

JSON.parse(

fs.readFileSync(
"./offers.json",
"utf8"
)

);

const stats = {

offres:
offres.length,

regions:

[
...new Set(
offres.map(
o=>o.lieu
)
)
].length,

secteurs:

[
...new Set(
offres.map(
o=>o.secteur
)
)
].length,

entreprises:

[
...new Set(
offres.map(
o=>o.entreprise
)
)
].length

};

res.json(
stats
);

}catch(error){

res.status(500).json({

error:
"Impossible de générer les statistiques"

});

}

}
);

app.post(
"/analyse-cv",
(req,res)=>{

const {

cv,
offre

} = req.body;

if(
!cv ||
!offre
){

return res.status(400).json({

error:
"Données manquantes"

});

}

let score = 0;

const mots = [

"excel",
"office",
"administration",
"organisation",
"comptabilité",
"support",
"informatique",
"python"

];

mots.forEach(m=>{

if(

cv.toLowerCase()
.includes(m)

&&

offre.toLowerCase()
.includes(m)

){

score += 12;

}

});

res.json({

score:
Math.min(
100,
score
)

});

}
);

app.post(
"/generate-letter",
(req,res)=>{

const {

nom,
poste,
entreprise

} = req.body;

const lettre =

`Madame, Monsieur,

Je souhaite vous proposer ma candidature pour le poste de ${poste} au sein de ${entreprise}.

Mon expérience professionnelle et ma motivation me permettront de contribuer efficacement à vos activités.

Je reste à votre disposition pour un entretien.

Avec mes salutations distinguées.

${nom}`;

res.json({

lettre

});

}
);

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

app.use(
(req,res)=>{

res.status(404).json({

error:
"Page introuvable"

});

}
);

app.listen(
PORT,
()=>{

console.log(

`🤘 Job Finder Vaud V10 lancé sur le port ${PORT}`

);

}
);
