
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");


router.use(authMiddleware);

router.post("/", createProject);


router.get("/", getProjects);


router.put("/:id", updateProject);


router.delete("/:id", deleteProject);

module.exports = router;
