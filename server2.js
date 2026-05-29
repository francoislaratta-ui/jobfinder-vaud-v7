const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "Job Finder Vaud V7",
    version: "1.0"
  });
});
app.get("/offers", (req, res) => {
  const data = require("./offers.json");
  res.json(data);
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
