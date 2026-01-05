"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to change password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
              <Link href="/admin" className="admin-sidebar-link">
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/instructions/new" className="admin-sidebar-link">
                ➕ New Instruction
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="admin-sidebar-link active">
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
        <div className="mb-xl">
          <h1>Settings</h1>
          <p className="text-secondary">
            Logged in as: {session.user?.name || session.user?.username}
          </p>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ maxWidth: "500px" }}>
          <div className="card-header">
            <h2 className="card-title">🔐 Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange}>
            {error && (
              <div style={{ 
                padding: "0.75rem", 
                background: "var(--color-accent-red)", 
                borderRadius: "var(--radius-md)",
                marginBottom: "1rem"
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                padding: "0.75rem", 
                background: "var(--color-accent-green)", 
                borderRadius: "var(--radius-md)",
                marginBottom: "1rem"
              }}>
                {success}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
