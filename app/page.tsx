"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Task {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_at?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  avg_completion_hours: number;
}

export default function Dashboard() {
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem("apiKey", apiKey);
      setIsAuthenticated(true);
      fetchTasks(apiKey);
      fetchStats(apiKey);
    }
  };

  const fetchTasks = async (key: string) => {
    setLoading(true);
    try {
      const queryFilter = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`/api/tasks${queryFilter}`, {
        headers: { "X-API-Key": key },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      } else {
        alert("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (key: string) => {
    try {
      const response = await fetch("/api/tasks/stats", {
        headers: { "X-API-Key": key },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTask,
          description: newTaskDescription || undefined,
          priority: newTaskPriority,
          status: "pending",
        }),
      });

      if (response.ok) {
        setNewTask("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        fetchTasks(apiKey);
        fetchStats(apiKey);
      } else {
        alert("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task");
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed" | "cancelled"
  ) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks(apiKey);
        fetchStats(apiKey);
      } else {
        alert("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "X-API-Key": apiKey },
      });

      if (response.ok) {
        fetchTasks(apiKey);
        fetchStats(apiKey);
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setApiKey("");
    localStorage.removeItem("apiKey");
    setTasks([]);
    setStats(null);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem("apiKey");
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
      fetchTasks(savedKey);
      fetchStats(savedKey);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && apiKey) {
      fetchTasks(apiKey);
    }
  }, [filter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      case "low":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: "#1e293b", text: "#94a3b8" },
      in_progress: { bg: "#1e40af", text: "#93c5fd" },
      completed: { bg: "#15803d", text: "#86efac" },
      cancelled: { bg: "#7f1d1d", text: "#fca5a5" },
    };
    return badges[status] || badges.pending;
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <h1>Task Manager</h1>
          <p>Enter your API key to get started</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <p className={styles.hint}>
            Don't have an API key? Create one in the admin panel.
          </p>
          <a href="/admin" className={styles.adminLink}>
            Go to Admin Panel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Task Manager</h1>
        <div className={styles.headerActions}>
          <a href="/admin" className={styles.adminLink}>
            Admin
          </a>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>Total Tasks</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.in_progress}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
      )}

      <div className={styles.createTaskForm}>
        <h2>Create Task</h2>
        <form onSubmit={createTask}>
          <input
            type="text"
            placeholder="Task name"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
          />
          <select
            value={newTaskPriority}
            onChange={(e) =>
              setNewTaskPriority(
                e.target.value as "low" | "medium" | "high" | "critical"
              )
            }
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
          <button type="submit">Create Task</button>
        </form>
      </div>

      <div className={styles.filters}>
        <button
          className={filter === "all" ? styles.active : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "pending" ? styles.active : ""}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
        <button
          className={filter === "in_progress" ? styles.active : ""}
          onClick={() => setFilter("in_progress")}
        >
          In Progress
        </button>
        <button
          className={filter === "completed" ? styles.active : ""}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className={styles.empty}>No tasks found</p>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => {
            const statusBadge = getStatusBadge(task.status);
            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h3>{task.name}</h3>
                  <div className={styles.taskMeta}>
                    <span
                      className={styles.priority}
                      style={{
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={styles.status}
                      style={{
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.text,
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className={styles.description}>{task.description}</p>
                )}

                <div className={styles.taskActions}>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      updateTaskStatus(
                        task.id,
                        e.target.value as
                          | "pending"
                          | "in_progress"
                          | "completed"
                          | "cancelled"
                      )
                    }
                    className={styles.statusSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>

                <div className={styles.taskFooter}>
                  <small>
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
