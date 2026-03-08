const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Endpoint to get the data
app.get("/api/kanji", (req, res) => {
  fs.readFile(path.join(__dirname, "db/roots.json"), "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    res.send(JSON.parse(data));
  });
});

// Endpoint to save the data
app.post("/api/kanji", (req, res) => {
  const newData = req.body;
  fs.writeFile(
    path.join(__dirname, "db/roots.json"),
    JSON.stringify(newData, null, 4),
    (err) => {
      if (err) return res.status(500).send("Error saving file");
      res.send({ message: "Saved successfully!" });
    },
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public/KanjiAdmin.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
