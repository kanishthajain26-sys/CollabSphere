
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import "./Notes.css";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/notes");
      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  function startEditing(note) {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content || "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a note title.");
      return;
    }

    setSaving(true);

    try {
      const editing = Boolean(editingId);

      const data = await apiRequest(
        editing ? `/notes/${editingId}` : "/notes",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        }
      );

      if (editing) {
        setNotes((previous) =>
          previous.map((note) =>
            note._id === editingId ? data.note : note
          )
        );
      } else {
        setNotes((previous) => [data.note, ...previous]);
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id) {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setError("");

    try {
      await apiRequest(`/notes/${id}`, { method: "DELETE" });
      setNotes((previous) => previous.filter((note) => note._id !== id));

      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="notes-page">
      <div className="notes-heading">
        <div>
          <h1>My Notes</h1>
          <p>Keep your ideas and important information together.</p>
        </div>
        <span className="notes-count">{notes.length} notes</span>
      </div>

      {error && <div className="notes-error">{error}</div>}

      <form className="note-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit note" : "Create a note"}</h2>

        <label htmlFor="note-title">Title</label>
        <input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title"
          required
        />

        <label htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={4}
        />

        <div className="note-form-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update note"
                : "Save note"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="notes-list">
        {loading ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="notes-empty">
            <h3>No notes yet</h3>
            <p>Create your first note using the form above.</p>
          </div>
        ) : (
          notes.map((note) => (
            <article className="note-card" key={note._id}>
              <div>
                <h3>{note.title}</h3>
                <p>{note.content || "No additional content."}</p>
                <small>
                  Updated{" "}
                  {note.updatedAt
                    ? new Date(note.updatedAt).toLocaleDateString()
                    : "just now"}
                </small>
              </div>

              <div className="note-card-actions">
                <button type="button" onClick={() => startEditing(note)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="note-delete-button"
                  onClick={() => deleteNote(note._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
