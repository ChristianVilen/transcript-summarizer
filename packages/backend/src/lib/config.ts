function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const rawProvider = requireEnv("AI_PROVIDER");
if (rawProvider !== "anthropic" && rawProvider !== "lm-studio") {
  throw new Error(`AI_PROVIDER must be "anthropic" or "lm-studio", got: "${rawProvider}"`);
}

const provider = rawProvider as "anthropic" | "lm-studio";

export const config = {
  port: Number(process.env.PORT ?? 3001),

  ai: {
    provider,
    anthropicModel: "claude-opus-4-6",
    lmStudioModel: "qwen3-8b",
    anthropicApiKey: provider === "anthropic" ? requireEnv("ANTHROPIC_API_KEY") : null,
    lmStudioUrl: provider === "lm-studio" ? requireEnv("LM_STUDIO_URL") : null,
    password: provider === "anthropic" ? requireEnv("AI_PASSWORD") : null,
  },
};
