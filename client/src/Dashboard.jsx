
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  CalendarDays,
  MessageSquare,
  NotebookPen,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  Clock,
  CircleCheck,
  MoreHorizontal,
  Menu,
  X,
  LogOut,
  Pencil,
  Trash2,
} from "lucide-react";

import Notes from "./pages/Notes";
import "./App.css";

const API = "https://collabsphere-82ia.onrender.com/api";

const navigation = [
  { label: "Projects", icon: FolderKanban },
  { label: "My Tasks", icon: CheckSquare },
  { label: "Team", icon: Users },
  { label: "Calendar", icon: CalendarDays },
  { label: "Messages", icon: MessageSquare },
  { label: "Notes", icon: NotebookPen },
];

function Dashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Projects");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [profileUser, setProfileUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskStatus, setTaskStatus] = useState("To Do");
  const [assignedTo, setAssignedTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const userName = profileUser?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const request = useCallback(
    
    async (path, options = {}) => {
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        throw new Error("Please log in again.");
      }

      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          Authorization: `Bearer ${currentToken}`,
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        throw new Error("Your session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      return data;
    },
    [navigate]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };
  

  // Load user profile and projects.
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [profileData, projectData] = await Promise.all([
          request("/auth/profile"),
          request("/projects"),
        ]);

        if (cancelled) return;

        if (profileData.user) {
          setProfileUser(profileData.user);
          localStorage.setItem(
            "user",
            JSON.stringify(profileData.user)
          );
        }

        const loadedProjects = projectData.projects || [];
        setProjects(loadedProjects);

        setSelectedProjectId((current) => {
          if (
            current &&
            loadedProjects.some((project) => project._id === current)
          ) {
            return current;
          }

          return loadedProjects[0]?._id || "";
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, request]);

  // Load tasks for the selected project.
  useEffect(() => {
    if (!selectedProjectId || !token) {
      setTasks([]);
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      try {
        const data = await request(
          `/tasks/project/${selectedProjectId}`
        );

        if (!cancelled) {
          setTasks(data.tasks || []);
        }
      } catch (err) {
        if (!cancelled) {
          setTasks([]);
          setError(err.message);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, token, request]);

  // Load team members, if the existing backend endpoint supports it.
  useEffect(() => {
    let cancelled = false;

    async function loadTeamMembers() {
      try {
        const data = await request("/tasks/users");

        if (!cancelled) {
          setTeamMembers(data.users || []);
        }
      } catch {
        if (!cancelled) setTeamMembers([]);
      }
    }

    if (token) loadTeamMembers();

    return () => {
      cancelled = true;
    };
  }, [token, request]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const filteredProjects = projects.filter((project) =>
    (project.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const currentProject =
    projects.find(
      (project) => project._id === selectedProjectId
    ) || null;

  const resetProjectForm = () => {
    setShowProjectForm(false);
    setEditingProjectId(null);
    setProjectName("");
  };

  const saveProject = async (event) => {
    event.preventDefault();

    if (!projectName.trim()) return;

    setSaving(true);
    setError("");

    try {
      const editing = Boolean(editingProjectId);

      const data = await request(
        editing ? `/projects/${editingProjectId}` : "/projects",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({ name: projectName.trim() }),
        }
      );

      if (!data.project) {
        throw new Error("The server did not return the saved project.");
      }

      const savedProject = data.project;

      setProjects((previous) =>
        editing
          ? previous.map((project) =>
              project._id === editingProjectId
                ? savedProject
                : project
            )
          : [...previous, savedProject]
      );

      setSelectedProjectId(savedProject._id);
      setActivePage("Projects");
      resetProjectForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editProject = (project) => {
    setEditingProjectId(project._id);
    setProjectName(project.name || "");
    setError("");
    setShowProjectForm(true);
  };

  const deleteProject = async (project) => {
    if (!project._id) return;

    if (!window.confirm(`Delete "${project.name}"?`)) return;

    try {
      setError("");

      await request(`/projects/${project._id}`, {
        method: "DELETE",
      });

      const remaining = projects.filter(
        (item) => item._id !== project._id
      );

      setProjects(remaining);

      if (selectedProjectId === project._id) {
        setSelectedProjectId(remaining[0]?._id || "");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const resetTaskForm = () => {
    setShowTaskForm(false);
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setTaskStatus("To Do");
    setAssignedTo("");
  };

  const saveTask = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      setError("Create or select a project first.");
      return;
    }

    if (!taskTitle.trim()) return;

    setSaving(true);
    setError("");

    try {
      const editing = Boolean(editingTaskId);

      const body = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        status: taskStatus,
        ...(editing
          ? {}
          : { project: selectedProjectId }),
        assignedTo: assignedTo || null,
      };

      const data = await request(
        editing ? `/tasks/${editingTaskId}` : "/tasks",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      if (!data.task) {
        throw new Error("The server did not return the saved task.");
      }

      setTasks((previous) =>
        editing
          ? previous.map((task) =>
              task._id === editingTaskId ? data.task : task
            )
          : [data.task, ...previous]
      );

      resetTaskForm();
      setActivePage("My Tasks");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editTask = (task) => {
    setEditingTaskId(task._id);
    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority || "Medium");
    setTaskStatus(task.status || "To Do");
    setAssignedTo(
      typeof task.assignedTo === "object"
        ? task.assignedTo?._id || ""
        : task.assignedTo || ""
    );
    setError("");
    setShowTaskForm(true);
  };

  const toggleTask = async (task) => {
    const nextStatus =
      task.status === "Done" ? "To Do" : "Done";

    try {
      setError("");

      const data = await request(`/tasks/${task._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (data.task) {
        setTasks((previous) =>
          previous.map((item) =>
            item._id === task._id ? data.task : item
          )
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      setError("");

      await request(`/tasks/${task._id}`, {
        method: "DELETE",
      });

      setTasks((previous) =>
        previous.filter((item) => item._id !== task._id)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const pageTitle = activePage;

  function openNewProject() {
    setEditingProjectId(null);
    setProjectName("");
    setError("");
    setShowProjectForm(true);
  }

  function openNewTask() {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setTaskStatus("To Do");
    setAssignedTo("");
    setError("");
    setShowTaskForm(true);
  }

  function renderTaskList() {
    if (!selectedProjectId) {
      return (
        <p className="empty-state">
          Create or select a project to see its tasks.
        </p>
      );
    }

    if (tasks.length === 0) {
      return (
        <p className="empty-state">
          No tasks in this project yet. Add your first task.
        </p>
      );
    }

    return tasks.map((task) => (
      <div
        className={`task-row ${
          task.status === "Done" ? "task-done" : ""
        }`}
        key={task._id}
      >
        <input
          type="checkbox"
          checked={task.status === "Done"}
          onChange={() => toggleTask(task)}
          aria-label={`Mark ${task.title} complete`}
        />

        <span className="task-copy">
          <strong>{task.title}</strong>
          <span>
            {task.priority || "Medium"} priority ·{" "}
            {task.status || "To Do"}
            {task.description ? ` · ${task.description}` : ""}
          </span>
        </span>

        <div className="task-row-actions">
          <button
            type="button"
            className="icon-button"
            title="Edit task"
            aria-label={`Edit ${task.title}`}
            onClick={() => editTask(task)}
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            className="icon-button"
            title="Delete task"
            aria-label={`Delete ${task.title}`}
            onClick={() => deleteTask(task)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    ));
  }

  function renderProjectList() {
    if (loading) {
      return <p className="empty-state">Loading projects...</p>;
    }

    if (filteredProjects.length === 0) {
      return (
        <p className="empty-state">
          No projects found. Create your first project.
        </p>
      );
    }

    return filteredProjects.map((project, index) => {
      const color =
        project.color || ["purple", "blue", "orange"][index % 3];

      const progress = Number(project.progress ?? 0);

      return (
        <div
          className="project-row"
          key={project._id}
          style={{
            outline:
              selectedProjectId === project._id
                ? "1px solid #b8a6ff"
                : "none",
            borderRadius: "12px",
            padding: "10px",
          }}
        >
          <button
            type="button"
            className={`project-symbol ${color}`}
            aria-label={`Select ${project.name}`}
            onClick={() => setSelectedProjectId(project._id)}
          >
            <FolderKanban size={20} />
          </button>

          <button
            type="button"
            className="project-details"
            style={{
              textAlign: "left",
              background: "transparent",
              border: 0,
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedProjectId(project._id);
              setActivePage("My Tasks");
            }}
          >
            <div className="project-title-row">
              <strong>{project.name}</strong>
              <span className={`category-tag ${color}`}>
                {project.category || "Project"}
              </span>
            </div>

            <div className="progress-track">
              <div
                className={`progress-fill ${color}`}
                style={{
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                }}
              />
            </div>

            <div className="project-meta">
              <span>{progress}% complete</span>
              <span>Due {project.due || "Not set"}</span>
            </div>
          </button>

          <div className="member-stack">
            <span className="mini-avatar mini-0">{userInitial}</span>
          </div>

          <div className="project-row-actions">
            <button
              type="button"
              className="icon-button"
              aria-label={`Edit ${project.name}`}
              onClick={() => editProject(project)}
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label={`Delete ${project.name}`}
              onClick={() => deleteProject(project)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      );
    });
  }

  function renderTaskForm() {
    if (!showTaskForm) return null;

    return (
      <form
        className="new-project-form"
        onSubmit={saveTask}
        style={{ margin: 16 }}
      >
        <strong>{editingTaskId ? "Edit task" : "Create a task"}</strong>

        <input
          autoFocus
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="Task title"
          required
        />

        <textarea
          value={taskDescription}
          onChange={(event) => setTaskDescription(event.target.value)}
          placeholder="Description (optional)"
          rows={3}
        />

        <label htmlFor="task-priority">Priority</label>
        <select
          id="task-priority"
          value={taskPriority}
          onChange={(event) => setTaskPriority(event.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          value={taskStatus}
          onChange={(event) => setTaskStatus(event.target.value)}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : editingTaskId
              ? "Save task"
              : "Create task"}
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={resetTaskForm}
          aria-label="Cancel task form"
        >
          <X size={18} />
        </button>
      </form>
    );
  }

  function renderProjectsPage() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              YOUR WORKSPACE AT A GLANCE
            </div>
            <h1>Projects</h1>
            <p className="welcome-description">
              Organize projects and keep your team moving.
            </p>
          </div>

          <button className="primary-button" onClick={openNewProject}>
            <Plus size={18} /> New project
          </button>
        </section>

        {showProjectForm && (
          <form className="new-project-form" onSubmit={saveProject}>
            <div>
              <strong>
                {editingProjectId ? "Edit project" : "Create a project"}
              </strong>
              <p>Give your project a name.</p>
            </div>

            <input
              autoFocus
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. Portfolio Website"
              required
            />

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingProjectId
                  ? "Save changes"
                  : "Create"}
            </button>

            <button
              className="icon-button"
              type="button"
              onClick={resetProjectForm}
              aria-label="Cancel project form"
            >
              <X size={18} />
            </button>
          </form>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total projects</span>
              <div className="stat-icon purple-bg">
                <FolderKanban size={19} />
              </div>
            </div>
            <div className="stat-value">
              {String(projects.length).padStart(2, "0")}
            </div>
            <div className="stat-footer">
              <span className="trend">Active workspace</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Tasks completed</span>
              <div className="stat-icon green-bg">
                <CircleCheck size={19} />
              </div>
            </div>
            <div className="stat-value">
              {String(completedTasks).padStart(2, "0")}
              <span className="stat-total">
                {" "}/ {String(tasks.length).padStart(2, "0")}
              </span>
            </div>
            <div className="stat-footer">
              <span className="trend">Keep it going</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Team members</span>
              <div className="stat-icon blue-bg">
                <Users size={19} />
              </div>
            </div>
            <div className="stat-value">{teamMembers.length}</div>
            <div className="stat-footer">
              <span className="muted-text">Loaded from workspace</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Pending tasks</span>
              <div className="stat-icon orange-bg">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-value">
              {String(pendingTasks).padStart(2, "0")}
            </div>
            <div className="stat-footer">
              <span className="muted-text">Tasks left to finish</span>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel projects-panel">
            <div className="panel-heading">
              <div>
                <h2>Projects in progress</h2>
                <p>Track progress and keep things moving.</p>
              </div>
              <button className="text-button" onClick={openNewProject}>
                <Plus size={16} /> New
              </button>
            </div>

            <div className="project-list">{renderProjectList()}</div>
          </article>

          <article className="panel tasks-panel">
            <div className="panel-heading">
              <div>
                <h2>{currentProject?.name || "Project tasks"}</h2>
                <p>{tasks.length} tasks in the selected project.</p>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={!selectedProjectId}
                onClick={openNewTask}
              >
                <Plus size={16} /> Add task
              </button>
            </div>

            <div style={{ padding: "0 16px 12px" }}>
              <label htmlFor="project-select">Selected project</label>
              <select
                id="project-select"
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                }}
              >
                <option value="">Choose a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {renderTaskForm()}

            <div className="task-list">{renderTaskList()}</div>

            <button
              className="all-tasks-button"
              onClick={() => setActivePage("My Tasks")}
            >
              Go to my tasks <ArrowUpRight size={16} />
            </button>
          </article>
        </section>
      </>
    );
  }

  function renderTasksPage() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <h1>My Tasks</h1>
            <p className="welcome-description">
              Review and update tasks for the selected project.
            </p>
          </div>
          <button
            className="primary-button"
            disabled={!selectedProjectId}
            onClick={openNewTask}
          >
            <Plus size={18} /> Add task
          </button>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>{currentProject?.name || "Select a project"}</h2>
              <p>
                {completedTasks} completed · {pendingTasks} remaining
              </p>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <label htmlFor="task-project-select">Project</label>
            <select
              id="task-project-select"
              value={selectedProjectId}
              onChange={(event) =>
                setSelectedProjectId(event.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                marginTop: 8,
                padding: 10,
              }}
            >
              <option value="">Choose a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {renderTaskForm()}
          <div className="task-list">{renderTaskList()}</div>
        </section>
      </>
    );
  }

  function renderTeamPage() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <h1>Team</h1>
            <p className="welcome-description">
              Your available workspace members.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Team members</h2>
              <p>
                {teamMembers.length} member
                {teamMembers.length === 1 ? "" : "s"} loaded
              </p>
            </div>
          </div>

          {teamMembers.length === 0 ? (
            <p className="empty-state">
              No team members were returned by the current API.
              Your backend may need a dedicated team-members endpoint.
            </p>
          ) : (
            <div className="team-grid">
              {teamMembers.map((member) => (
                <article className="note-card" key={member._id}>
                  <div className="avatar">
                    {(member.name || member.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <h3>{member.name || "Team member"}</h3>
                  <p>{member.email || "No email provided"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderCalendarPage() {
    const datedTasks = tasks.filter(
      (task) => task.dueDate || task.due
    );

    return (
      <>
        <section className="welcome-row">
          <div>
            <h1>Calendar</h1>
            <p className="welcome-description">
              Review task dates from your selected project.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Scheduled tasks</h2>
              <p>Tasks with a due date.</p>
            </div>
          </div>

          {datedTasks.length === 0 ? (
            <p className="empty-state">
              No dated tasks are available yet. Add due dates to your tasks
              to see them here.
            </p>
          ) : (
            <div className="task-list">
              {datedTasks.map((task) => (
                <div className="task-row" key={task._id}>
                  <CalendarDays size={20} />
                  <span className="task-copy">
                    <strong>{task.title}</strong>
                    <span>
                      {new Date(task.dueDate || task.due).toLocaleDateString()}
                      {" · "}
                      {task.status || "To Do"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderMessagesPage() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <h1>Messages</h1>
            <p className="welcome-description">
              Your workspace communication area.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Team conversations</h2>
              <p>Messaging interface ready for integration.</p>
            </div>
          </div>
          <p className="empty-state">
            Real-time messaging is not connected yet. A messages backend
            and conversation model are needed to send and save messages.
          </p>
        </section>
      </>
    );
  }

  function renderSettingsPage() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <h1>Settings</h1>
            <p className="welcome-description">
              Your account information and session controls.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Account</h2>
              <p>Your current profile.</p>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            <p><strong>Name:</strong> {userName}</p>
            <p>
              <strong>Email:</strong>{" "}
              {profileUser?.email || "Not available"}
            </p>
            <button className="primary-button" onClick={logout}>
              <LogOut size={17} /> Log out
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderActivePage() {
    if (activePage === "Notes") {
      return <Notes />;
    }

    if (activePage === "My Tasks") return renderTasksPage();
    if (activePage === "Team") return renderTeamPage();
    if (activePage === "Calendar") return renderCalendarPage();
    if (activePage === "Messages") return renderMessagesPage();
    if (activePage === "Settings") return renderSettingsPage();

    return renderProjectsPage();
  }

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <h2>CollabSphere</h2>
            <span>TEAM WORKSPACE</span>
          </div>
          <button
            className="icon-button close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setMenuOpen(false);
                setError("");
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Messages" && (
                <span className="nav-badge">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-symbol">✦</div>
            <h3>Work better together</h3>
            <p>
              Keep your team and projects organized in one place.
            </p>
            <button onClick={() => setActivePage("Team")}>
              Explore workspace <ArrowUpRight size={15} />
            </button>
          </div>

          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar avatar-main">{userInitial}</div>
            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{profileUser?.email || "Workspace user"}</span>
            </div>
            <button
              className="icon-button"
              aria-label="Profile menu"
              onClick={() =>
                setShowProfileMenu((value) => !value)
              }
            >
              <MoreHorizontal size={20} />
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <button
  className="profile-logout"
  onClick={handleLogout}
>
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
              />
            </label>

            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                onClick={() =>
                  setShowNotifications((value) => !value)
                }
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>

              {showNotifications && (
                <div className="notification-popover">
                  <strong>Notifications</strong>
                  <p>Your workspace is ready to organize.</p>
                  <p>Check your project tasks for updates.</p>
                </div>
              )}
            </div>

            <div className="avatar avatar-top">{userInitial}</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="form-hint" role="alert">
              {error}
              <button
                type="button"
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {renderActivePage()}

          <footer className="footer">
            <span>© 2026 CollabSphere</span>
            <span>
              Built for better teamwork <span className="footer-star">✦</span>
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
