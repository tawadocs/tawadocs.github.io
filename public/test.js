const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.listen(3000, () => {
  console.log(`Admin Server running at http://localhost:3000`);
  console.log(
    `Update data.json and it should show on http://localhost:3000/idioms.html.`,
  );
});
