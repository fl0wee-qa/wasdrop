import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional().default(""),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional().default("dev-secret-change-me"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STEAM_API_KEY: z.string().optional(),
  STEAM_REALM_URL: z.string().url().optional(),
  STEAM_RETURN_URL: z.string().url().optional(),
  DEALS_API_BASE_URL: z.string().url().default("https://www.cheapshark.com/api/1.0"),
  DEALS_API_KEY: z.string().optional(),
  DEALS_SYNC_COUNTRIES: z.string().default("US,GB,DE"),
  ENABLE_MOCK_DATA: z.enum(["true", "false"]).default("false"),
  NEWS_SYNC_LIMIT: z.coerce.number().int().positive().default(100),
  NEWS_SUMMARY_ENABLED: z.enum(["true", "false"]).default("false"),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ALERTS_FROM_EMAIL: z.string().email().optional(),
  AI_CHAT_ENABLED: z.enum(["true", "false"]).default("false"),
  QWEN_USER_API_KEY: z.string().optional(),
  QWEN_USER_BASE_URL: z.string().url().optional(),
  QWEN_USER_MODEL: z.string().default("qwen/qwen3.5-397b-a17b"),
  ADMIN_AI_ENABLED: z.enum(["true", "false"]).default("false"),
  ADMIN_AI_AUTO_APPLY: z.enum(["true", "false"]).default("false"),
  QWEN_ADMIN_API_KEY: z.string().optional(),
  QWEN_ADMIN_BASE_URL: z.string().url().optional(),
  QWEN_ADMIN_MODEL: z.string().default("qwen/qwen3.5-397b-a17b"),
  CRON_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
});

let parsed: z.infer<typeof envSchema> | null = null;

export function env() {
  if (parsed) {
    return parsed;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }

  parsed = result.data;
  return parsed;
}

export function isMockModeEnabled() {
  return env().ENABLE_MOCK_DATA === "true";
}

export function isGoogleConfigured() {
  const e = env();
  return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
}

export function hasRequiredDatabaseEnv() {
  return Boolean(env().DATABASE_URL);
}

export function isUserAiChatEnabled() {
  return env().AI_CHAT_ENABLED === "true";
}

export function isAdminAiEnabled() {
  return env().ADMIN_AI_ENABLED === "true";
}

export function isAdminAiAutoApplyEnabled() {
  return env().ADMIN_AI_AUTO_APPLY === "true";
}
