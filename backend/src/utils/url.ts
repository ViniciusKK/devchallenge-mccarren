import { HttpError } from "../lib/httpError.js";

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const prefixed = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(prefixed);
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    throw new HttpError(400, `Invalid URL supplied: ${input}`);
  }
}
