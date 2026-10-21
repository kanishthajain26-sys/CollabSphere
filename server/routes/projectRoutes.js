
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// All routes below require a valid JWT token
router.use(authMiddleware);

// Create a project
router.post("/", createProject);

// Get all projects of the logged-in user
router.get("/", getProjects);

// Update a project by its ID
router.put("/:id", updateProject);

// Delete a project by its ID
router.delete("/:id", deleteProject);

module.exports = router;
