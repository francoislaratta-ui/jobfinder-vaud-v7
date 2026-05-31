const express = require("express");
const path = require("path");

const app = express();

const PORT =
process.env.PORT || 3000;

app.use(
express.json()
);

app.use(
express.static(__dirname)
);

app.get(
"/offers",
(req,res) => {

try{

const offres =
require("./offers.json");

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
(req,res) => {

res.json({

status:"ok",

application:
"Job Finder Vaud V8.6",

version:
"8.6"

});

}
);

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

app.use(
(req,res) => {

res.status(404).json({

error:
"Page introuvable"

});

}
);

app.listen(
PORT,
() => {

console.log(

`🤘 Job Finder Vaud V8.6 lancé sur le port ${PORT}`

);

}
);
