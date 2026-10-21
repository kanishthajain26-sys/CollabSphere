
const Project = require("../models/Project");

// Create a project
async function createProject(req, res) {
  try {
    const { name, category, color, progress, due } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const userId = req.user.id;

    const project = await Project.create({
      name: name.trim(),
      category: category || "New Project",
      color: color || "green",
      progress: progress ?? 0,
      due: due || "Not set",
      owner: userId,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);

    return res.status(500).json({
      message: "Server error while creating project",
    });
  }
}

// Get projects belonging to the logged-in user
async function getProjects(req, res) {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      owner: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching projects",
    });
  }
}

// Update a project
async function updateProject(req, res) {
  try {
    const { name, category, color, progress, due } = req.body;

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        message: "Project name cannot be empty",
      });
    }

    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category;
    if (color !== undefined) updates.color = color;
    if (progress !== undefined) updates.progress = progress;
    if (due !== undefined) updates.due = due;

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error.message);

    return res.status(500).json({
      message: "Server error while updating project",
    });
  }
}

// Delete a project
async function deleteProject(req, res) {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting project",
    });
  }
}

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
