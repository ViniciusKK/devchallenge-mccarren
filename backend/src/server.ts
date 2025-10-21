import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import OpenAI from "openai";

type AnalyzeRequestBody = {
  url?: string;
};

type ErrorResponse = {
  error: string;
  details?: string;
};

type CompanyProfileResponse = {
  company_name: string | null;
  service_line: string | string[] | null;
  company_description: string | null;
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  poc: string | null;
};

const REQUIRED_ENV_VARS = ["OPENAI_API_KEY"] as const;
const missingEnv = REQUIRED_ENV_VARS.filter((variable) => !process.env[variable]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const app = express();
const port = parseInt(process.env.PORT ?? "4000", 10) || 4000;
const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post(
  "/api/analyze",
  async (req: Request<Record<string, never>, CompanyProfileResponse | ErrorResponse, AnalyzeRequestBody>, res, next) => {
    try {
      const { url } = req.body ?? {};

      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({ error: "Body must include a non-empty string 'url' field." });
      }

      const normalizedUrl = normalizeUrl(url);
      let websiteContent = "";

      try {
        const response = await fetch(normalizedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; CompanyProfiler/1.0; +https://github.com/devchallenge-mccarren)"
          },
          redirect: "follow"
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${normalizedUrl}: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        websiteContent = condenseHtml(html);
      } catch (fetchError) {
        return res.status(400).json({
          error: `Unable to retrieve content from ${normalizedUrl}`,
          details: getErrorMessage(fetchError)
        });
      }

      const aiResponse = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract structured company intelligence from website content. Always reply with strict JSON using the required keys. " +
              "When a data field is unavailable, return null for strings and an empty array for keyword lists."
          },
          {
            role: "user",
            content:
              "Given the company website below, infer and return:\n" +
              "{\n" +
              '  "company_name": string | null,\n' +
              '  "service_line": string | string[] | null,\n' +
              '  "company_description": string | null,\n' +
              '  "tier1_keywords": string[],\n' +
              '  "tier2_keywords": string[],\n' +
              '  "emails": string[],\n' +
              '  "poc": string | null\n' +
              "}\n" +
              "Use simple language and keep description under 70 words. " +
              "Extract company emails and representative name(s) when explicitly available.\n\n" +
              `Website URL: ${normalizedUrl}\n\n` +
              "Website Content:\n" +
              `\"\"\"${websiteContent}\"\"\"`
          }
        ]
      });

      const content = aiResponse.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI API returned an empty response.");
      }

      const parsed = safeJsonParse<unknown>(content);
      const result = normalizeAiResponse(parsed);

      if (!result) {
        throw new Error("Failed to parse OpenAI response into the expected structure.");
      }

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
);

app.use((error: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error", details: getErrorMessage(error) });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const prefixed = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(prefixed);
    url.hash = "";
    return url.toString();
  } catch {
    throw new Error(`Invalid URL supplied: ${input}`);
  }
}

function condenseHtml(html: string): string {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const stripped = withoutStyles.replace(/\s+/g, " ");
  return stripped.slice(0, 15000);
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function normalizeAiResponse(payload: unknown): CompanyProfileResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;

  return {
    company_name: parseNullableString(source.company_name),
    service_line: parseServiceLine(source.service_line),
    company_description: parseNullableString(source.company_description),
    tier1_keywords: parseStringArray(source.tier1_keywords),
    tier2_keywords: parseStringArray(source.tier2_keywords),
    emails: parseStringArray(source.emails),
    poc: parseNullableString(source.poc)
  };
}

function parseNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function parseServiceLine(value: unknown): string | string[] | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const entries = value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
    return entries.length > 0 ? entries : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
