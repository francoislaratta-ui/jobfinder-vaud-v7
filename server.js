const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================
   FICHIERS STATIQUES
========================= */

app.use(express.static(__dirname));

/* =========================
   API OFFRES
========================= */

app.get("/offers", (req, res) => {

  try {

    const data = fs.readFileSync(
      path.join(__dirname, "offers.json"),
      "utf8"
    );

    res.json(JSON.parse(data));

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Impossible de charger les offres"
    });

  }

});

/* =========================
   PAGE PRINCIPALE
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});

/* =========================
   DEMARRAGE
========================= */

app.listen(PORT, () => {

  console.log(
    `Job Finder Vaud lancé sur le port ${PORT}`
  );

});
