import { HttpError } from "../lib/httpError.js";
import { defaultModel, openai } from "../lib/openaiClient.js";
import type { CompanyProfilePayload, StoredCompanyProfile } from "../types/companyProfile.js";
import { condenseHtml } from "../utils/html.js";
import { safeJsonParse } from "../utils/json.js";
import { normalizeAiProfile, normalizeClientProfile } from "../utils/profile.js";
import { normalizeUrl } from "../utils/url.js";
import { findById, findByNormalizedUrl, insertProfile, listProfiles, updateProfile } from "../repositories/companyProfileRepository.js";

export type AnalyzeResult = {
  profile: CompanyProfilePayload;
  cached: boolean;
  record: StoredCompanyProfile;
};

export async function analyzeCompany(url: string): Promise<AnalyzeResult> {
  const normalizedUrl = normalizeUrl(url);
  const originalUrl = url.trim();
  const existing = await findByNormalizedUrl(normalizedUrl);

  if (existing) {
    return {
      profile: existing.payload,
      cached: true,
      record: existing
    };
  }

  const websiteContent = await fetchWebsite(normalizedUrl);
  const aiPayload = await requestProfileFromAi(normalizedUrl, websiteContent);
  const profile = normalizeAiProfile(aiPayload);

  if (!profile) {
    throw new HttpError(500, "Failed to parse OpenAI response into the expected structure.");
  }

  const saved = await insertProfile(originalUrl, normalizedUrl, profile);

  return {
    profile,
    cached: false,
    record: saved
  };
}

export async function getProfile(id: string): Promise<StoredCompanyProfile> {
  const record = await findById(id);
  if (!record) {
    throw new HttpError(404, "Profile not found.");
  }
  return record;
}

export async function getProfileHistory(limit?: number): Promise<StoredCompanyProfile[]> {
  return listProfiles(limit);
}

export async function updateCompanyProfile(
  id: string,
  url: string | undefined,
  payload: CompanyProfilePayload
): Promise<StoredCompanyProfile> {
  const existing = await findById(id);
  if (!existing) {
    throw new HttpError(404, "Profile not found.");
  }

  const nextUrl = url && url.trim().length > 0 ? url.trim() : existing.url;
  const normalizedUrl = normalizeUrl(nextUrl);

  const sanitizedPayload = normalizeClientProfile(payload) ?? existing.payload;

  let updated: StoredCompanyProfile | null = null;

  try {
    updated = await updateProfile(id, nextUrl, normalizedUrl, sanitizedPayload);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "Another profile already exists for this website.");
    }
    throw error;
  }

  if (!updated) {
    throw new HttpError(500, "Failed to update the company profile.");
  }

  return updated;
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

async function fetchWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CompanyProfiler/1.0; +https://github.com/devchallenge-mccarren)"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      throw new HttpError(400, `Unable to retrieve content from ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return condenseHtml(html);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new HttpError(400, `Unable to retrieve content from ${url}`, message);
  }
}

async function requestProfileFromAi(url: string, websiteContent: string): Promise<Record<string, unknown>> {
  const completion = await openai.chat.completions.create({
    model: defaultModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You extract structured company intelligence from website content. Always reply with strict JSON using the required keys. " +
          "Return null for unknown strings and an empty array for lists when data is unavailable."
      },
      {
        role: "user",
        content:
          "Given the company website below, infer and return:\n" +
          "{\n" +
          '  "company_name": string | null,\n' +
          '  "company_description": string | null,\n' +
          '  "service_lines": string[],\n' +
          '  "tier1_keywords": string[],\n' +
          '  "tier2_keywords": string[],\n' +
          '  "emails": string[],\n' +
          '  "poc": string | null\n' +
          "}\n" +
          "Use simple language and keep description under 70 words. Extract company emails and representative names when explicitly available.\n\n" +
          `Website URL: ${url}\n\nWebsite Content:\n\"\"\"${websiteContent}\"\"\"`
      }
    ]
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new HttpError(500, "OpenAI API returned an empty response.");
  }

  const parsed = safeJsonParse<Record<string, unknown>>(content);
  if (!parsed) {
    throw new HttpError(500, "Failed to parse OpenAI response as JSON.");
  }

  return parsed;
}
