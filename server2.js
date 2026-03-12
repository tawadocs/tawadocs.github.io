// server.js
const express = require('express');
const path = require('path');
const app = express();

// serve all files in current directory
app.use(express.static(__dirname));

// default route to testing.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'testing.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});