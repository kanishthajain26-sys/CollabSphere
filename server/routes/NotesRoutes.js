const express = require("express");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Get logged-in user's notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id })
      .sort({ updatedAt: -1 });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: "Failed to load notes." });
  }
});

// Create a note
router.post("/", async (req, res) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const note = await Note.create({
      title,
      content: req.body.content || "",
      user: req.user.id,
    });

    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ message: "Failed to create note." });
  }
});

// Update a note
router.put("/:id", async (req, res) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content: req.body.content || "" },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: "Failed to update note." });
  }
});

// Delete a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete note." });
  }
});

module.exports = router;