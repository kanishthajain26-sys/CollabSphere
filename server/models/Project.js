const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "New Project",
      trim: true,
    },
    color: {
      type: String,
      default: "green",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    due: {
      type: String,
      default: "Not set",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);