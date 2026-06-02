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
