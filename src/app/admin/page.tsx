"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useInstructionModal } from "@/components/InstructionModalContext";

interface Instruction {
  id: string;
  title: string;
  phase: number;
  planet: string;
  missionNumber: number;
  missionType: string;
  isAutoPlay: boolean;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [userError, setUserError] = useState("");
  const [savingUser, setSavingUser] = useState(false);


  const isSuperAdmin = session?.user?.role === "super_admin";
  const { openModal } = useInstructionModal();

  // Callback to refresh instructions after modal save
  const refreshInstructions = useCallback(async () => {
    const res = await fetch("/api/instructions");
    if (res.ok) {
      const data = await res.json();
      setInstructions(data);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch instructions
        const res = await fetch("/api/instructions");
        if (res.ok) {
          const data = await res.json();
          setInstructions(data);
        }

        // Fetch users if super_admin
        if (session?.user?.role === "super_admin") {
          const usersRes = await fetch("/api/users");
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, session?.user?.role]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/instructions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstructions(instructions.filter(i => i.id !== id));
      } else {
        alert("Failed to delete instruction");
      }
    } catch (error) {
      console.error("Error deleting instruction:", error);
      alert("Failed to delete instruction");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    setDeletingUser(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setSavingUser(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
        }),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers([newUser, ...users]);
        setShowNewUserForm(false);
        setNewUsername("");
        setNewPassword("");
        setNewName("");
        setNewRole("admin");
      } else {
        const data = await res.json();
        setUserError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setUserError("Failed to create user");
    } finally {
      setSavingUser(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/" className="navbar-brand">
            <span>⚔️</span>
            <span>RotE TB</span>
          </Link>
        </div>
        
        <nav>
          <ul className="admin-sidebar-nav">
            <li>
              <Link href="/admin" className="admin-sidebar-link active">
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/instructions/new" className="admin-sidebar-link">
                ➕ New Instruction
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="admin-sidebar-link">
                ⚙️ Settings
              </Link>
            </li>
            <li>
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="admin-sidebar-link"
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
              >
                🚪 Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="flex-between mb-xl">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-secondary">
              Welcome, {session.user?.name || session.user?.username}
              {isSuperAdmin && <span className="badge badge-auto" style={{ marginLeft: "0.5rem" }}>Super Admin</span>}
            </p>
          </div>
          <button onClick={() => openModal(undefined, refreshInstructions)} className="btn btn-primary">
            + Create Instruction
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid-3 gap-lg mb-xl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="card">
            <div className="text-muted text-sm">Total Instructions</div>
            <div style={{ fontSize: "2rem", fontWeight: "700" }}>{instructions.length}</div>
          </div>
          <div className="card">
            <div className="text-muted text-sm">Auto-Play</div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--color-accent-green)" }}>
              {instructions.filter(i => i.isAutoPlay).length}
            </div>
          </div>
          <div className="card">
            <div className="text-muted text-sm">Manual Play</div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--color-accent-gold)" }}>
              {instructions.filter(i => !i.isAutoPlay).length}
            </div>
          </div>
        </div>

        {/* Instructions List */}
        <div className="card mb-xl">
          <div className="card-header">
            <h2 className="card-title">All Instructions</h2>
          </div>
          
          {loading ? (
            <p className="text-secondary">Loading instructions...</p>
          ) : instructions.length === 0 ? (
            <div className="text-center text-secondary" style={{ padding: "3rem" }}>
              <p>No instructions created yet.</p>
              <Link href="/admin/instructions/new" className="btn btn-primary mt-md">
                Create Your First Instruction
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Phase</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Planet</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Mission</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Type</th>
                  <th style={{ textAlign: "right", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructions.map((instruction) => (
                  <tr key={instruction.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 0" }}>{instruction.title}</td>
                    <td style={{ padding: "0.75rem 0" }}>Phase {instruction.phase}</td>
                    <td style={{ padding: "0.75rem 0" }} className="text-capitalize">{instruction.planet}</td>
                    <td style={{ padding: "0.75rem 0" }}>#{instruction.missionNumber}</td>
                    <td style={{ padding: "0.75rem 0" }}>
                      <span className={`badge ${instruction.isAutoPlay ? "badge-auto" : "badge-manual"}`}>
                        {instruction.isAutoPlay ? "Auto" : "Manual"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link 
                          href={`/admin/instructions/${instruction.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(instruction.id, instruction.title)}
                          disabled={deleting === instruction.id}
                          className="btn btn-danger"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                        >
                          {deleting === instruction.id ? "..." : "🗑️ Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User Management (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="card">
            <div className="card-header flex-between">
              <h2 className="card-title">👥 User Management</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewUserForm(!showNewUserForm)}
              >
                {showNewUserForm ? "Cancel" : "+ New User"}
              </button>
            </div>

            {/* New User Form */}
            {showNewUserForm && (
              <form onSubmit={handleCreateUser} style={{ 
                padding: "1rem", 
                background: "var(--color-bg-tertiary)", 
                borderRadius: "var(--radius-md)",
                marginBottom: "1rem"
              }}>
                {userError && (
                  <div style={{ 
                    padding: "0.5rem", 
                    background: "var(--color-accent-red)", 
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1rem"
                  }}>
                    {userError}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Role</label>
                    <select
                      className="form-input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary mt-md"
                  disabled={savingUser}
                >
                  {savingUser ? "Creating..." : "Create User"}
                </button>
              </form>
            )}

            {/* Users Table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Username</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Role</th>
                  <th style={{ textAlign: "right", padding: "0.75rem 0", color: "var(--color-text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 0" }}>{user.username}</td>
                    <td style={{ padding: "0.75rem 0" }}>{user.name || "—"}</td>
                    <td style={{ padding: "0.75rem 0" }}>
                      <span className={`badge ${user.role === "super_admin" ? "badge-auto" : "badge-manual"}`}>
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                      {session.user.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={deletingUser === user.id}
                          className="btn btn-danger"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                        >
                          {deletingUser === user.id ? "..." : "🗑️ Delete"}
                        </button>
                      )}
                      {session.user.id === user.id && (
                        <span className="text-muted">(You)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
