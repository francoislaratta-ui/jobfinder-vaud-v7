const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(__dirname));

const FAVORITES_FILE =
path.join(__dirname,"favorites.json");

const CRM_FILE =
path.join(__dirname,"crm.json");

/* ==========================================
UTILS
========================================== */

function readJson(file, fallback = []) {

  try {

    if (!fs.existsSync(file)) {
      return fallback;
    }

    const data =
    fs.readFileSync(
      file,
      "utf8"
    );

    return JSON.parse(data);

  } catch {

    return fallback;

  }

}

function saveJson(file,data){

  fs.writeFileSync(
    file,
    JSON.stringify(
      data,
      null,
      2
    )
  );

}

/* ==========================================
HOME
========================================== */

app.get("/",(req,res)=>{

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});

/* ==========================================
OFFERS
========================================== */

app.get("/api/offers",(req,res)=>{

  const offers = readJson(
    path.join(
      __dirname,
      "offers.json"
    ),
    []
  );

  res.json(
    offers
  );

});

/* ==========================================
FAVORITES
========================================== */

app.get(
"/api/favorites",
(req,res)=>{

  res.json(
    readJson(
      FAVORITES_FILE,
      []
    )
  );

});

app.post(
"/api/favorites",
(req,res)=>{

  const favorites =
  readJson(
    FAVORITES_FILE,
    []
  );

  favorites.push(
    req.body
  );

  saveJson(
    FAVORITES_FILE,
    favorites
  );

  res.json({

    success:true

  });

});

app.delete(
"/api/favorites/:id",
(req,res)=>{

  const id =
  Number(
    req.params.id
  );

  const favorites =
  readJson(
    FAVORITES_FILE,
    []
  ).filter(

    item =>
    item.id !== id

  );

  saveJson(
    FAVORITES_FILE,
    favorites
  );

  res.json({

    success:true

  });

});

/* ==========================================
CRM
========================================== */

app.get(
"/api/crm",
(req,res)=>{

  res.json(
    readJson(
      CRM_FILE,
      []
    )
  );

});

app.post(
"/api/crm",
(req,res)=>{

  const crm =
  readJson(
    CRM_FILE,
    []
  );

  crm.push(
    req.body
  );

  saveJson(
    CRM_FILE,
    crm
  );

  res.json({

    success:true

  });

});

app.delete(
"/api/crm/:id",
(req,res)=>{

  const id =
  Number(
    req.params.id
  );

  const crm =
  readJson(
    CRM_FILE,
    []
  ).filter(

    item =>
    item.id !== id

  );

  saveJson(
    CRM_FILE,
    crm
  );

  res.json({

    success:true

  });

});

/* ==========================================
STATISTICS
========================================== */

app.get(
"/api/stats",
(req,res)=>{

  const favorites =
  readJson(
    FAVORITES_FILE,
    []
  );

  const crm =
  readJson(
    CRM_FILE,
    []
  );

  res.json({

    offers:
    readJson(
      path.join(
        __dirname,
        "offers.json"
      ),
      []
    ).length,

    favorites:
    favorites.length,

    applications:
    crm.length

  });

});

/* ==========================================
HEALTH
========================================== */

app.get(
"/api/health",
(req,res)=>{

  res.json({

    status:"ok",

    app:
    "Job Finder Vaud",

    version:
    "13.0.1"

  });

});

/* ==========================================
START
========================================== */

app.listen(
PORT,
()=>{

  console.log(

    `Job Finder Vaud V13.0.1 lancé sur le port ${PORT}`

  );

});
