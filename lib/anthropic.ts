import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function modelForPlan(plan: string | null | undefined): string {
  return plan === "pro" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";
}

export function cachedSystem(text: string): Anthropic.TextBlockParam[] {
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}
