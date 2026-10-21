
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CollabSphere backend is running!");
});

app.get("/api/test", (req, res) => {
  res.send("API TEST WORKING!");
});

app.use((req, res) => {
  res.status(404).send("Route not found: " + req.url);
});

app.listen(PORT, () => {
  console.log("SERVER FILE:", __filename);
  console.log("Server is running on http://localhost:" + PORT);
});
