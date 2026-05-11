"use client";

import { useState } from "react";

export function DailyUpdate() {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:      `Daily update — ${today}`,
        content:    text.trim(),
        category:   "life_event",
        visibility: "twin_only",
        importance: "medium",
      }),
    });
    setSaving(false);
    setSaved(true);
    setText("");
    setTimeout(() => { setSaved(false); setOpen(false); }, 2500);
  }

  if (saved) {
    return (
      <div className="bg-slate-900 border border-green-800/50 rounded-2xl p-5 text-center">
        <p className="text-green-400 font-semibold text-sm">✓ Saved — your Twin learned from today</p>
        <p className="text-slate-500 text-xs mt-1">Keep going — daily updates make your Twin sharper over time.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-800/50 flex items-center justify-center text-base shrink-0">
            📅
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              Tell your Twin about today
            </p>
            <p className="text-xs text-slate-500">Daily updates keep your Twin sharp</p>
          </div>
        </div>
        <span className={`text-slate-500 text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ↓
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened today? Anything interesting, a decision you made, someone you spoke to, something you learned or felt..."
            rows={4}
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setText(""); }}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save to Twin →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
