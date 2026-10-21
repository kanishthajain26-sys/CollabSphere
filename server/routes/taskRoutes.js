
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getUsers,
} = require("../controllers/taskController");

// Every task route requires login
router.use(authMiddleware);

router.get("/users", getUsers);

// Create a task
router.post("/", createTask);

// Get tasks for a specific project
router.get("/project/:projectId", getTasks);

// Update a task
router.put("/:id", updateTask);

// Delete a task
router.delete("/:id", deleteTask);

module.exports = router;
