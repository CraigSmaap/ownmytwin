"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ApiKey {
  id:         string;
  name:       string;
  prefix:     string;
  lastUsedAt: string | null;
  createdAt:  string;
}

export default function DeveloperPage() {
  const [isPro,      setIsPro]      = useState<boolean | null>(null);
  const [keys,       setKeys]       = useState<ApiKey[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealed,   setRevealed]   = useState<string | null>(null); // raw key shown once
  const [revoking,   setRevoking]   = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const fetchKeys = useCallback(async () => {
    const [userRes, keysRes] = await Promise.all([
      fetch("/api/user"),
      fetch("/api/keys"),
    ]);
    if (userRes.ok) {
      const { user } = await userRes.json();
      setIsPro(user?.plan === "pro");
    }
    if (keysRes.ok) {
      const data = await keysRes.json();
      setKeys(data.keys);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/keys", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setRevealed(data.key);
      setNewKeyName("");
      await fetchKeys();
    } else {
      alert(data.error ?? "Failed to create key");
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? This cannot be undone.")) return;
    setRevoking(id);
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setRevoking(null);
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Developer API</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Use API keys to access your twin programmatically via the Studio API.
        </p>
      </div>

      {/* Revealed key banner */}
      {revealed && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 space-y-3">
          <p className="text-amber-300 font-semibold text-sm">
            Copy your API key — it will not be shown again.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-slate-950 text-green-400 text-xs px-3 py-2 rounded-lg font-mono break-all">
              {revealed}
            </code>
            <button
              onClick={() => copyKey(revealed)}
              className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setRevealed(null)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pro gate / Create new key */}
      {isPro === false ? (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5 flex items-start gap-4">
          <span className="text-2xl shrink-0">🔒</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300 mb-1">Pro plan required</p>
            <p className="text-xs text-slate-400 mb-3">API keys let external apps and buyers access your Twin programmatically. Upgrade to Pro to create keys.</p>
            <Link href="/settings" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors">
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">Create API Key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              placeholder="Key name (e.g. My App)"
              maxLength={60}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={createKey}
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          <p className="text-xs text-slate-500">Maximum 5 active keys per account.</p>
        </div>
      )}

      {/* Keys list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Active Keys</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No API keys yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{key.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{key.prefix}…</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">
                    {key.lastUsedAt
                      ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : "Never used"}
                  </p>
                  <p className="text-xs text-slate-600">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  disabled={revoking === key.id}
                  className="shrink-0 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {revoking === key.id ? "…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Docs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">API Reference</h2>
        <div className="space-y-3 text-sm text-slate-400">
          <p>Authenticate every request with your key in the <code className="text-indigo-300">Authorization</code> header:</p>
          <pre className="bg-slate-950 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">
{`Authorization: Bearer omt_xxxxxxxxxxxxxxxx…`}
          </pre>
          <div className="space-y-2">
            {[
              { method: "GET",  path: "/api/v1/twins",                   desc: "List all marketplace twins" },
              { method: "GET",  path: "/api/v1/twins/:id",               desc: "Get a single twin's details and reviews" },
              { method: "POST", path: "/api/v1/twins/:id/chat",          desc: "Chat with a twin programmatically" },
            ].map((e) => (
              <div key={e.path} className="flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${e.method === "GET" ? "bg-green-900/50 text-green-400" : "bg-blue-900/50 text-blue-400"}`}>
                  {e.method}
                </span>
                <div>
                  <code className="text-slate-300 text-xs">{e.path}</code>
                  <p className="text-slate-500 text-xs mt-0.5">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Chat endpoint accepts <code className="text-indigo-300">{`{ message: "..." }`}</code> or a{" "}
            <code className="text-indigo-300">messages</code> array (OpenAI-compatible format).
          </p>
        </div>
      </div>
    </div>
  );
}
