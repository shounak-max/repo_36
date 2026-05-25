"use client";

import { useState, useEffect } from "react";
import styles from "./admin.module.css";

interface ApiKey {
  id: string;
  label: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      localStorage.setItem("adminKey", adminKey);
      setIsAuthenticated(true);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newKeyLabel,
          expires_at: expiresAt || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.key);
        setNewKeyLabel("");
        setExpiresAt("");
        // Optionally fetch keys list
      } else {
        alert("Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Error creating API key");
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== keyId));
      } else {
        alert("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      alert("Error revoking API key");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey("");
    localStorage.removeItem("adminKey");
  };

  useEffect(() => {
    const savedKey = localStorage.getItem("adminKey");
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      alert("API key copied to clipboard!");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <h1>Admin Panel</h1>
          <p>Enter your admin API key</p>
          <form onSubmit={handleAdminLogin}>
            <input
              type="password"
              placeholder="Enter admin API key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <a href="/" className={styles.backLink}>
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Panel</h1>
        <div className={styles.headerActions}>
          <a href="/" className={styles.backLink}>
            Dashboard
          </a>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.createSection}>
        <h2>Create New API Key</h2>
        <form onSubmit={createApiKey}>
          <input
            type="text"
            placeholder="Key label (e.g., 'Production API')"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            placeholder="Expiration date (optional)"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create API Key"}
          </button>
        </form>

        {createdKey && (
          <div className={styles.createdKeyBox}>
            <h3>✓ API Key Created!</h3>
            <p>Save this key in a secure location. You won't see it again.</p>
            <div className={styles.keyDisplay}>
              <code>{createdKey}</code>
              <button type="button" onClick={copyToClipboard}>
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreatedKey(null)}
              className={styles.dismissBtn}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <h2>API Key Usage</h2>
        <p>Use the API key in the <code>X-API-Key</code> header:</p>
        <pre>
          <code>
            curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/api/tasks
          </code>
        </pre>
      </div>

      <div className={styles.envBox}>
        <h2>Environment Configuration</h2>
        <p>For Vercel deployment, set these environment variables:</p>
        <pre>
          <code>
{`POSTGRES_URL=your-database-url
POSTGRES_URL_NON_POOLING=your-database-url-non-pooling
ADMIN_API_KEY=your-admin-secret-key
NODE_ENV=production`}
          </code>
        </pre>
      </div>
    </div>
  );
}
