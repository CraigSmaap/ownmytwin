import { db } from "@/lib/db";

export interface MemoryResult {
  id:         string;
  title:      string;
  content:    string;
  category:   string | null;
  importance: string;
}

// Sanitise a free-text string so it is safe to pass to plainto_tsquery.
// plainto_tsquery handles most input gracefully, but stripping control chars
// and collapsing whitespace avoids edge cases.
function sanitiseQuery(q: string): string {
  return q.replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

/**
 * Return the most relevant memories for a given twin and search query.
 * Uses PostgreSQL full-text search (tsvector/tsquery) when a query is
 * provided; falls back to recency + importance ordering otherwise.
 */
export async function getRelevantMemories(
  twinId:     string,
  query:      string,
  limit = 10,
  visibility: "public" | "non-private" = "non-private",
): Promise<MemoryResult[]> {
  const visibilityFilter =
    visibility === "public" ? `AND visibility = 'public'` : `AND visibility != 'private'`;

  const clean = sanitiseQuery(query);

  if (clean.length > 2) {
    try {
      const rows = await db.$queryRawUnsafe<MemoryResult[]>(
        `
        SELECT id, title, content, category, importance
        FROM "Memory"
        WHERE "twinId" = $1
          ${visibilityFilter}
        ORDER BY
          ts_rank(
            to_tsvector('english', title || ' ' || content),
            plainto_tsquery('english', $2)
          ) DESC,
          CASE importance
            WHEN 'core identity' THEN 4
            WHEN 'high'          THEN 3
            WHEN 'medium'        THEN 2
            ELSE                      1
          END DESC,
          "createdAt" DESC
        LIMIT $3
        `,
        twinId,
        clean,
        limit,
      );
      if (rows.length > 0) return rows;
    } catch {
      // Fall through to recency-based retrieval on any SQL error
    }
  }

  // Fallback: recency + importance
  const rows = await db.memory.findMany({
    where:   { twinId, ...(visibility === "public" ? { visibility: "public" } : { visibility: { not: "private" } }) },
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take:    limit,
    select:  { id: true, title: true, content: true, category: true, importance: true },
  });
  return rows;
}
