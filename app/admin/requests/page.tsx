import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminRequestsList } from "./requests-list";

const LICENSE_LABELS: Record<string, { label: string; icon: string }> = {
  voice_only:         { label: "Voice Only",        icon: "🎤" },
  voiceover:          { label: "Voiceover",          icon: "🎙️" },
  public_speaking:    { label: "Public Speaking",    icon: "📢" },
  face_avatar:        { label: "Face / Avatar",      icon: "🪞" },
  full_likeness:      { label: "Full Likeness",      icon: "👤" },
  social_media:       { label: "Social Media",       icon: "📱" },
  ads:                { label: "Advertising",        icon: "📺" },
  ai_presenter:       { label: "AI Presenter",       icon: "🎬" },
  virtual_influencer: { label: "Virtual Influencer", icon: "⭐" },
  educational:        { label: "Educational",        icon: "📚" },
  corporate_training: { label: "Corporate Training", icon: "🏢" },
  customer_service:   { label: "Customer Service",   icon: "🤝" },
  film_tv:            { label: "Film / TV",          icon: "🎥" },
  game_npc:           { label: "Game NPC",           icon: "🎮" },
  motion_style:       { label: "Motion Style",       icon: "🕺" },
};

export default async function AdminRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") redirect("/dashboard");

  const requests = await db.licenseRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      twin: {
        select: {
          name: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const serialized = requests.map((r) => ({
    id:           r.id,
    buyerName:    r.buyerName,
    buyerEmail:   r.buyerEmail,
    company:      r.company,
    usageType:    r.usageType,
    message:      r.message,
    status:       r.status,
    responseNote: r.responseNote,
    respondedAt:  r.respondedAt?.toISOString() ?? null,
    createdAt:    r.createdAt.toISOString(),
    twinName:     r.twin.name,
    creatorName:  r.twin.user.name,
    creatorEmail: r.twin.user.email,
    usageLabel:   LICENSE_LABELS[r.usageType]?.label ?? r.usageType,
    usageIcon:    LICENSE_LABELS[r.usageType]?.icon  ?? "📄",
    agreedPrice:  r.agreedPrice,
  }));

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">License Requests</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review all incoming requests and approve or reject on behalf of creators.
          </p>
        </div>
        {pending > 0 && (
          <div className="shrink-0 flex items-center gap-2 bg-amber-900/30 border border-amber-800/50 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pending} pending
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending",  value: pending,  color: "text-amber-400",  bg: "from-amber-500/10 border-amber-800/40"  },
          { label: "Approved", value: approved, color: "text-green-400",  bg: "from-green-500/10 border-green-800/40"  },
          { label: "Declined", value: rejected, color: "text-slate-400",  bg: "from-slate-500/10 border-slate-700/40"  },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden bg-gradient-to-br ${s.bg} to-slate-900 border rounded-2xl p-4 sm:p-5`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <AdminRequestsList initialRequests={serialized} />
    </div>
  );
}
