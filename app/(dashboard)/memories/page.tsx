"use client";

import { useState, useEffect } from "react";
import type { Memory } from "@/types";

const CATEGORIES = [
  { value: "life_event",   label: "Life Event",   icon: "📅", color: "blue"   },
  { value: "preference",   label: "Preference",   icon: "❤️", color: "pink"   },
  { value: "relationship", label: "Relationship", icon: "👥", color: "purple" },
  { value: "achievement",  label: "Achievement",  icon: "🏆", color: "amber"  },
  { value: "belief",       label: "Belief",       icon: "💡", color: "yellow" },
  { value: "correction",   label: "Correction",   icon: "✏️", color: "teal"   },
  { value: "other",        label: "Other",        icon: "📝", color: "slate"  },
] as const;

const COLOR_MAP: Record<string, string> = {
  blue:   "bg-blue-900/40 text-blue-300 border-blue-800/50",
  pink:   "bg-pink-900/40 text-pink-300 border-pink-800/50",
  purple: "bg-purple-900/40 text-purple-300 border-purple-800/50",
  amber:  "bg-amber-900/40 text-amber-300 border-amber-800/50",
  yellow: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
  teal:   "bg-teal-900/40 text-teal-300 border-teal-800/50",
  slate:  "bg-slate-800 text-slate-400 border-slate-700",
};

type CategoryValue = (typeof CATEGORIES)[number]["value"] | "all";

function getCat(val: string) {
  return CATEGORIES.find((c) => c.value === val);
}

const VISIBILITY_OPTIONS = [
  { value: "private",     label: "Private",     icon: "🔒", desc: "Only you can see this" },
  { value: "twin_only",   label: "Twin Use",    icon: "🤖", desc: "Used by your Twin in replies" },
  { value: "marketplace", label: "Marketplace", icon: "🌐", desc: "Shown on your public profile" },
] as const;

const IMPORTANCE_OPTIONS = [
  { value: "low",           label: "Low",          color: "text-slate-400  bg-slate-800  border-slate-700" },
  { value: "medium",        label: "Medium",        color: "text-blue-300   bg-blue-900/40  border-blue-800/50" },
  { value: "high",          label: "High",          color: "text-amber-300  bg-amber-900/40 border-amber-800/50" },
  { value: "core_identity", label: "Core Identity", color: "text-indigo-300 bg-indigo-900/40 border-indigo-800/50" },
] as const;

export default function MemoriesPage() {
  const [memories,    setMemories]    = useState<Memory[]>([]);
  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [category,    setCategory]    = useState<(typeof CATEGORIES)[number]["value"]>("life_event");
  const [visibility,  setVisibility]  = useState<"private" | "twin_only" | "marketplace">("twin_only");
  const [importance,  setImportance]  = useState<"low" | "medium" | "high" | "core_identity">("medium");
  const [filter,      setFilter]      = useState<CategoryValue>("all");
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then(({ memories }) => { setMemories(memories ?? []); setLoading(false); });
  }, []);

  async function handleAdd() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category, visibility, importance }),
    });
    const { memory } = await res.json();
    setMemories((prev) => [memory, ...prev]);
    setTitle("");
    setContent("");
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setDeleting(null);
  }

  const filtered = filter === "all" ? memories : memories.filter((m) => m.category === filter);

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Memories</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Teach your Twin about your life. The more detail, the more authentic the replies.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shrink-0 touch-manipulation"
        >
          {showForm ? "✕ Cancel" : "+ Add Memory"}
        </button>
      </div>

      {/* Stats strip */}
      {!loading && memories.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((c) => {
            const count = memories.filter((m) => m.category === c.value).length;
            if (!count) return null;
            return (
              <button
                key={c.value}
                onClick={() => setFilter(filter === c.value ? "all" : c.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all touch-manipulation ${
                  filter === c.value
                    ? COLOR_MAP[c.color]
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                {c.icon} {c.label} <span className="opacity-60">·</span> {count}
              </button>
            );
          })}
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear filter ✕
            </button>
          )}
        </div>
      )}

      {/* Add form */}
      {(showForm || memories.length === 0) && !loading && (
        <div className="bg-slate-900 border border-indigo-800/40 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Add a Memory</h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this memory a title..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe this memory in as much detail as you like. The more context, the better your Twin understands you."
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
          />

          {/* Category picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    category === c.value
                      ? COLOR_MAP[c.color] + " ring-1 ring-current"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Visibility</p>
            <div className="flex gap-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVisibility(v.value)}
                  title={v.desc}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    visibility === v.value
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.desc}
            </p>
          </div>

          {/* Importance */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Importance</p>
            <div className="flex flex-wrap gap-2">
              {IMPORTANCE_OPTIONS.map((imp) => (
                <button
                  key={imp.value}
                  onClick={() => setImportance(imp.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    importance === imp.value
                      ? imp.color + " ring-1 ring-current"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {imp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {memories.length > 0 && (
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleAdd}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
            >
              {saving ? "Adding..." : "Add Memory"}
            </button>
          </div>
        </div>
      )}


      {/* Memory list */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && memories.length > 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>No memories in this category.</p>
          <button onClick={() => setFilter("all")} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            Show all memories
          </button>
        </div>
      )}

      {!loading && memories.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-5xl mb-4">🧠</p>
          <p className="font-medium text-slate-400">No memories yet</p>
          <p className="text-sm mt-1">Add your first memory above to teach your Twin about you.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((memory) => {
          const cat = getCat(memory.category ?? "other");
          return (
            <div
              key={memory.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 group transition-all relative"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{cat?.icon ?? "📝"}</span>
                  <h3 className="font-semibold text-white truncate">{memory.title}</h3>
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  disabled={deleting === memory.id}
                  className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 hover:text-red-400 active:text-red-400 transition-all shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/20 touch-manipulation"
                  aria-label="Delete memory"
                >
                  {deleting === memory.id ? "·" : "✕"}
                </button>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{memory.content}</p>

              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                {cat && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${COLOR_MAP[cat.color]}`}>
                    {cat.label}
                  </span>
                )}
                {memory.importance && memory.importance !== "medium" && (() => {
                  const imp = IMPORTANCE_OPTIONS.find((i) => i.value === memory.importance);
                  return imp ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${imp.color}`}>
                      {imp.label}
                    </span>
                  ) : null;
                })()}
                {memory.visibility && memory.visibility !== "twin_only" && (() => {
                  const vis = VISIBILITY_OPTIONS.find((v) => v.value === memory.visibility);
                  return vis ? (
                    <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-400">
                      {vis.icon} {vis.label}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && memories.length > 0 && (
        <p className="text-xs text-slate-700 text-center">
          {memories.length} {memories.length === 1 ? "memory" : "memories"} total
        </p>
      )}
    </div>
  );
}
