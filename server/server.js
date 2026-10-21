
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("CollabSphere backend is running!");
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/notes", require("./routes/NotesRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// Start server after database connection
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("MongoDB connected successfully");
      console.log(`CollabSphere server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
