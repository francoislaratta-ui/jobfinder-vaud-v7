// server.js

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT =
process.env.PORT || 3000;

/* =========================
   STATIC FILES
========================= */

app.use(
express.static(
path.join(
__dirname
)
)
);

app.use(
