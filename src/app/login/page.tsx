"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "2rem"
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-header" style={{ justifyContent: "center", borderBottom: "none" }}>
          <h2>Admin Login</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              padding: "0.75rem", 
              background: "var(--color-accent-red)", 
              borderRadius: "var(--radius-md)",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/" className="text-secondary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
