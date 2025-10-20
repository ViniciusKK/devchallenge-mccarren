import "dotenv/config";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import OpenAI from "openai";

const REQUIRED_ENV_VARS = ["OPENAI_API_KEY"];
for (const variable of REQUIRED_ENV_VARS) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", async (req, res, next) => {
  try {
    const { url } = req.body ?? {};

    if (!url || typeof url !== "string") {
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
      return res.status(400).json({ error: `Unable to retrieve content from ${normalizedUrl}`, details: fetchError.message });
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
            '  "service_line": string | null,\n' +
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

    const result = safeJsonParse(content);
    if (!result) {
      throw new Error("Failed to parse OpenAI response as JSON.");
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error", details: error.message });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

function normalizeUrl(input) {
  try {
    const initial = input.trim();
    const prefixed = initial.startsWith("http://") || initial.startsWith("https://") ? initial : `https://${initial}`;
    const url = new URL(prefixed);
    url.hash = "";
    return url.toString();
  } catch {
    throw new Error(`Invalid URL supplied: ${input}`);
  }
}

function condenseHtml(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const stripped = withoutStyles.replace(/\s+/g, " ");
  return stripped.slice(0, 15000);
}

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
