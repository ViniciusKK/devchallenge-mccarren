import type { CompanyProfilePayload } from "../types/companyProfile.js";

type RawAiProfile = {
  company_name?: unknown;
  service_line?: unknown;
  service_lines?: unknown;
  company_description?: unknown;
  tier1_keywords?: unknown;
  tier2_keywords?: unknown;
  emails?: unknown;
  poc?: unknown;
};

export function normalizeAiProfile(payload: RawAiProfile): CompanyProfilePayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return normalizeClientProfile({
    company_name: payload.company_name,
    company_description: payload.company_description,
    poc: payload.poc,
    service_lines: payload.service_lines ?? payload.service_line,
    tier1_keywords: payload.tier1_keywords,
    tier2_keywords: payload.tier2_keywords,
    emails: payload.emails
  });
}

type ClientProfileInput = {
  company_name?: unknown;
  company_description?: unknown;
  poc?: unknown;
  service_lines?: unknown;
  tier1_keywords?: unknown;
  tier2_keywords?: unknown;
  emails?: unknown;
};

export function normalizeClientProfile(input: ClientProfileInput): CompanyProfilePayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  return {
    company_name: toNullableString(input.company_name),
    company_description: toNullableString(input.company_description),
    poc: toNullableString(input.poc),
    service_lines: coerceStringArray(input.service_lines),
    tier1_keywords: coerceStringArray(input.tier1_keywords),
    tier2_keywords: coerceStringArray(input.tier2_keywords),
    emails: coerceStringArray(input.emails)
  };
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function coerceStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return dedupeStrings(value.map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")).trim()));
  }

  if (typeof value === "string") {
    return dedupeStrings(
      value
        .split(/[,;\n•]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });

  return result;
}
