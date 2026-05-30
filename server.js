const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("SERVER V2 OK");
});

app.get("/offers", (req, res) => {
  res.send("OFFERS OK");
});

app.listen(PORT, () => {
  console.log("Serveur démarré");
});
