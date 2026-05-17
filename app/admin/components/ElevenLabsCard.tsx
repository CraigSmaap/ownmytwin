"use client";

export interface ElevenLabsUsage {
  characterCount:   number;
  characterLimit:   number;
  voiceLimit:       number;
  voicesUsed:       number;
  tier:             string;
  daysIntoMonth:    number;
  daysInMonth:      number;
  error?:           string;
}

export function ElevenLabsCard({ usage }: { usage: ElevenLabsUsage }) {
  if (usage.error || !usage.characterLimit) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">ElevenLabs</h2>
        <p className="text-red-400 text-sm">{usage.error}</p>
      </div>
    );
  }

  const usedPct      = Math.round((usage.characterCount / usage.characterLimit) * 100);
  const remaining    = usage.characterLimit - usage.characterCount;
  const dailyRate    = usage.daysIntoMonth > 0 ? Math.round(usage.characterCount / usage.daysIntoMonth) : 0;
  const daysLeft     = dailyRate > 0 ? Math.floor(remaining / dailyRate) : usage.daysInMonth - usage.daysIntoMonth;
  const daysToReset  = usage.daysInMonth - usage.daysIntoMonth;
  const willRunOut   = daysLeft < daysToReset;

  const barColor = usedPct > 85 ? "bg-red-500" : usedPct > 60 ? "bg-amber-500" : "bg-indigo-500";
  const statusColor = willRunOut ? "text-red-400" : "text-green-400";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">ElevenLabs</h2>
        <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-semibold capitalize">
          {usage.tier}
        </span>
      </div>

      {/* Character usage */}
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Characters used this month</span>
          <span className="text-white font-semibold">
            {usage.characterCount.toLocaleString()} / {usage.characterLimit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(usedPct, 100)}%` }} />
        </div>
        <p className="text-xs text-slate-600 mt-1.5">{usedPct}% used · {remaining.toLocaleString()} remaining</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{dailyRate.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-0.5">chars/day avg</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className={`text-lg font-bold ${statusColor}`}>{daysLeft}</div>
          <div className="text-xs text-slate-500 mt-0.5">days at this rate</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{daysToReset}</div>
          <div className="text-xs text-slate-500 mt-0.5">days to reset</div>
        </div>
      </div>

      {/* Warning / status */}
      {willRunOut ? (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs text-red-300">
          ⚠️ At current usage, characters will run out <strong>{daysLeft} days</strong> before the monthly reset.
          Consider upgrading your ElevenLabs plan.
        </div>
      ) : (
        <div className="bg-green-950/30 border border-green-800/30 rounded-xl p-3 text-xs text-green-300">
          ✓ On track — credits will last until the monthly reset in {daysToReset} days.
        </div>
      )}

      {/* Voices */}
      <div className="flex justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
        <span>Voices used</span>
        <span className="text-slate-300 font-semibold">{usage.voicesUsed} / {usage.voiceLimit}</span>
      </div>
    </div>
  );
}
