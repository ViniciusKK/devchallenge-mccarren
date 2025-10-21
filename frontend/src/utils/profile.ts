export function normalizeServiceLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    const sanitized = dedupeStrings(value);
    return sanitized.length > 0 ? sanitized : [""];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [""];

    const parts = trimmed
      .split(/[\n•;]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      return dedupeStrings(parts);
    }

    return [trimmed];
  }

  return [""];
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return dedupeStrings(value);
  }

  if (typeof value === "string") {
    const parts = value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return dedupeStrings(parts);
  }

  return [];
}

export function splitServiceLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const parts = trimmed
    .split(/(?:;|,|\/|\band\b|\||\r?\n)+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [trimmed];
}

export function dedupeStrings(values: Array<unknown>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((item) => {
    const trimmed = typeof item === "string" ? item.trim() : "";
    if (!trimmed) return;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    result.push(trimmed);
  });

  return result;
}
