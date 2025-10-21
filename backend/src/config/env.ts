import "dotenv/config";

type EnvConfig = {
  port: number;
  openAiApiKey: string;
  openAiModel: string;
  databaseUrl: string;
  databaseSsl: boolean;
};

function getConfig(): EnvConfig {
  const port = Number.parseInt(process.env.PORT ?? "4000", 10) || 4000;
  const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
  const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseSsl = (process.env.DATABASE_SSL ?? "").toLowerCase() === "true";

  const config: EnvConfig = {
    port,
    openAiApiKey,
    openAiModel,
    databaseUrl,
    databaseSsl
  };

  validateConfig(config);
  return config;
}

function validateConfig(config: EnvConfig): void {
  const missing: string[] = [];

  if (!config.openAiApiKey) missing.push("OPENAI_API_KEY");
  if (!config.databaseUrl) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

const env = getConfig();

export default env;
