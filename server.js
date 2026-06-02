const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT =
process.env.PORT || 3000;

app.use(
express.json()
);

app.use(
express.static(
__dirname
)
);

app.get(
"/offers",
(req,res) => {

fs.readFile(
path.join(
__dirname,
"offers.json"
),
"utf8",
(err,data) => {

if(err){

return res
.status(500)
.json({
error:
"Impossible de lire offers.json"
});

}

try{

res.json(
JSON.parse(data)
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
"/candidatures",
(req,res) => {

fs.readFile(
path.join(
__dirname,
"candidatures.json"
),
"utf8",
(err,data) => {

if(err){

return res.json([]);

}

try{

res.json(
JSON.parse(data)
);

}catch(e){

res.json([]);

}

});

}
);

app.get(
"/settings",
(req,res) => {

fs.readFile(
path.join(
__dirname,
"settings.json"
),
"utf8",
(err,data) => {

if(err){

return res.json({});

}

try{

res.json(
JSON.parse(data)
);

}catch(e){

res.json({});

}

});

}
);

app.get(
"/profils-cv",
(req,res) => {

fs.readFile(
path.join(
__dirname,
"profils-cv.json"
),
"utf8",
(err,data) => {

if(err){

return res.json([]);

}

try{

res.json(
JSON.parse(data)
);

}catch(e){

res.json([]);

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

version:"11.0",

date:
new Date()
.toISOString()

});

}
);

app.get(
"*",
(req,res) => {

res.sendFile(
path.join(
__dirname,
"index.html"
)
);

}
);

app.listen(
PORT,
() => {

console.log(

"🚀 Job Finder Vaud V11 lancé sur le port " +

PORT

);

}
);
