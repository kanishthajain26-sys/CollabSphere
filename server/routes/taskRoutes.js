
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


router.use(authMiddleware);

router.get("/users", getUsers);


router.post("/", createTask);


router.get("/project/:projectId", getTasks);

router.put("/:id", updateTask);


router.delete("/:id", deleteTask);

module.exports = router;
