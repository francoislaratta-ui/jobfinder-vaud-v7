const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT =
process.env.PORT || 3000;

app.use(express.json());

app.use(
express.urlencoded({
extended:true
})
);

app.use(
express.static(__dirname)
);

function readJsonFile(file){

try{

const data = fs.readFileSync(
path.join(
__dirname,
file
),
"utf8"
);

return JSON.parse(data);

}catch{

return [];

}

}

function writeJsonFile(
file,
data
){

fs.writeFileSync(

path.join(
__dirname,
file
),

JSON.stringify(
data,
null,
2
)

);

}

/* ==========================
   OFFERS
========================== */

app.get(
"/offers",
(req,res)=>{

const offers =
readJsonFile(
"offers.json"
);

res.json(
offers
);

}
);

/* ==========================
   CRM
========================== */

app.get(
"/crm",
(req,res)=>{

res.json(

readJsonFile(
"crm.json"
)

);

}
);

app.post(
"/crm",
(req,res)=>{

const crm =
readJsonFile(
"crm.json"
);

const item = {

id:Date.now(),

...req.body

};

crm.push(
item
);

writeJsonFile(
"crm.json",
crm
);

res.json({
success:true,
item
});

}
);

app.put(
"/crm/:id",
(req,res)=>{

const crm =
readJsonFile(
"crm.json"
);

const updated =

crm.map(item=>{

if(
item.id ==
req.params.id
){

return {
...item,
...req.body
};

}

return item;

});

writeJsonFile(
"crm.json",
updated
);

res.json({
success:true
});

}
);
/* ==========================
   DELETE CRM
========================== */

app.delete(
"/crm/:id",
(req,res)=>{

const crm =
readJsonFile(
"crm.json"
);

const filtered =

crm.filter(
item =>
item.id != req.params.id
);

writeJsonFile(
"crm.json",
filtered
);

res.json({
success:true
});

}
);

/* ==========================
   NOTES
========================== */

app.get(
"/notes",
(req,res)=>{

res.json(

readJsonFile(
"notes.json"
)

);

}
);

app.post(
"/notes",
(req,res)=>{

const notes =
readJsonFile(
"notes.json"
);

const note = {

id:Date.now(),

date:
new Date()
.toISOString(),

...req.body

};

notes.push(
note
);

writeJsonFile(
"notes.json",
notes
);

res.json({
success:true,
note
});

}
);

app.put(
"/notes/:id",
(req,res)=>{

const notes =
readJsonFile(
"notes.json"
);

const updated =

notes.map(note=>{

if(
note.id ==
req.params.id
){

return {
...note,
...req.body
};

}

return note;

});

writeJsonFile(
"notes.json",
updated
);

res.json({
success:true
});

}
);

app.delete(
"/notes/:id",
(req,res)=>{

const notes =
readJsonFile(
"notes.json"
);

const filtered =

notes.filter(
note =>
note.id != req.params.id
);

writeJsonFile(
"notes.json",
filtered
);

res.json({
success:true
});

}
);

/* ==========================
   SETTINGS
========================== */

app.get(
"/settings",
(req,res)=>{

res.json(

readJsonFile(
"settings.json"
)

);

}
);

app.post(
"/settings",
(req,res)=>{

writeJsonFile(
"settings.json",
req.body
);

res.json({
success:true
});

}
);

/* ==========================
   STATS
========================== */

app.get(
"/stats",
(req,res)=>{

const crm =
readJsonFile(
"crm.json"
);

const offers =
readJsonFile(
"offers.json"
);

const hired =

crm.filter(
item =>
item.statut==="Embauché"
).length;

const interviews =

crm.filter(
item =>
item.statut==="Entretien"
).length;

res.json({

offers:
offers.length,

applications:
crm.length,

interviews,

hired,

successRate:

crm.length
?

Math.round(
(hired/crm.length)
*100
)

:

0

});

}
);
/* ==========================
   HEALTH CHECK
========================== */

app.get(
"/health",
(req,res)=>{

res.json({

status:"ok",

application:
"Job Finder Vaud V13",

version:
"13.0.0",

timestamp:
new Date()
.toISOString()

});

}
);

/* ==========================
   INFORMATIONS API
========================== */

app.get(
"/api",
(req,res)=>{

res.json({

name:
"Job Finder Vaud V13 API",

version:
"13.0.0",

endpoints:[

"/offers",

"/crm",

"/notes",

"/settings",

"/stats",

"/health"

]

});

}
);

/* ==========================
   FALLBACK
========================== */

app.get(
"*",
(req,res)=>{

res.sendFile(

path.join(
__dirname,
"index.html"
)

);

}
);

/* ==========================
   START SERVER
========================== */

app.listen(
PORT,
()=>{

console.log(
"================================"
);

console.log(
"Job Finder Vaud V13 Premium"
);

console.log(
"Serveur démarré"
);

console.log(
"Port :",
PORT
);

console.log(
"URL : http://localhost:" +
PORT
);

console.log(
"================================"
);

}
);
