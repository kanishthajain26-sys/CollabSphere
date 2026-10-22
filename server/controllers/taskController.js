
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");


const createTask = async (req, res) => {
  try {
    const {
  title,
  description = "",
  status,
  priority,
  project,
  assignedTo,
} = req.body;

    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing. Please log in again.",
      });
    }

    if (!title || !title.trim() || !project) {
      return res.status(400).json({
        success: false,
        message: "Task title and project are required.",
      });
    }

    const validStatuses = ["To Do", "In Progress", "Done"];
    const validPriorities = ["Low", "Medium", "High"];

    const finalStatus = status || "To Do";
    const finalPriority = priority || "Medium";

    if (!validStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use To Do, In Progress, or Done.",
      });
    }

    if (!validPriorities.includes(finalPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority. Use Low, Medium, or High.",
      });
    }

    const existingProject = await Project.findOne({
  _id: project,
  owner: userId,
});

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }
    if (assignedTo) {
  const existingUser = await User.findById(assignedTo);

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "Assigned user not found.",
    });
  }
}

const task = await Task.create({
  title: title.trim(),
  description,
  status: finalStatus,
  priority: finalPriority,
  project,
  createdBy: userId,
  assignedTo: assignedTo || null,
});

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing. Please log in again.",
      });
    }

    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      createdBy: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing. Please log in again.",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const {
  title,
  description,
  status,
  priority,
  assignedTo,
} = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty.",
        });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (status !== undefined) {
      if (!["To Do", "In Progress", "Done"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }
      task.status = status;
    }

    if (priority !== undefined) {
      if (!["Low", "Medium", "High"].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }
      task.priority = priority;
    }
    if (assignedTo !== undefined) {
  if (assignedTo === null || assignedTo === "") {
    task.assignedTo = null;
  } else {
    const existingUser = await User.findById(assignedTo);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found.",
      });
    }

    task.assignedTo = assignedTo;
  }
}

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing. Please log in again.",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
    console.log("GET USERS FUNCTION CALLED");
  try {
    const users = await User.find().select("_id name email");
    console.log("USERS FROM DATABASE:" , users);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members.",
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getUsers,
};
