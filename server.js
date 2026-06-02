const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT =
process.env.PORT || 3000;

app.use(
express.static(
path.join(
__dirname,
"public"
)
)
);

app.get(
"/offers",
(req,res) => {

const filePath =

path.join(
__dirname,
"offers.json"
);

fs.readFile(
filePath,
"utf8",
(err,data) => {

if(err){

return res
.status(500)
.json({
error:
"Erreur lecture offers.json"
});

}

try{

const offres =
JSON.parse(data);

res.json(
offres
);

}catch(e){

res
.status(500)
.json({
error:
"JSON invalide"
});

}

});

}
);

app.get(
"/health",
(req,res) => {

res.json({

status:"OK",

application:
"Job Finder Vaud V11 Ultimate AI Career Manager",

version:"11.0"

});

}
);

app.get(
"*",
(req,res) => {

res.sendFile(

path.join(
__dirname,
"public",
"index.html"
)

);

}
);

app.listen(
PORT,
() => {

console.log(
`🚀 Job Finder Vaud V11 démarré sur le port ${PORT}`
);

}
);
