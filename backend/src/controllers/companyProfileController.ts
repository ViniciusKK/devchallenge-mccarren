import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";
import { analyzeCompany, getProfile, getProfileHistory, updateCompanyProfile, type AnalyzeResult } from "../services/companyProfileService.js";
import { normalizeClientProfile } from "../utils/profile.js";

export async function analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = req.body ?? {};

    if (!url || typeof url !== "string") {
      throw new HttpError(400, "Body must include a non-empty string 'url' field.");
    }

    const result = await analyzeCompany(url);
    res.json(toApiResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function listProfiles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await getProfileHistory(50);
    res.json({
      items: items.map((item) => ({
        id: item.id,
        url: item.url,
        normalized_url: item.normalizedUrl,
        profile: item.payload,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const record = await getProfile(id);
    res.json({
      id: record.id,
      url: record.url,
      normalized_url: record.normalizedUrl,
      profile: record.payload,
      created_at: record.createdAt.toISOString(),
      updated_at: record.updatedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { url, profile } = req.body ?? {};

    if (!profile || typeof profile !== "object") {
      throw new HttpError(400, "Body must include a 'profile' object.");
    }

    const normalizedPayload = normalizeClientProfile(profile);
    if (!normalizedPayload) {
      throw new HttpError(400, "Profile payload could not be parsed.");
    }

    const updated = await updateCompanyProfile(id, typeof url === "string" ? url : undefined, normalizedPayload);

    res.json({
      id: updated.id,
      url: updated.url,
      normalized_url: updated.normalizedUrl,
      profile: updated.payload,
      cached: true,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString()
    });
  } catch (error) {
    next(error);
  }
}

function toApiResponse(result: AnalyzeResult) {
  return {
    id: result.record.id,
    url: result.record.url,
    normalized_url: result.record.normalizedUrl,
    profile: result.profile,
    cached: result.cached,
    created_at: result.record.createdAt.toISOString(),
    updated_at: result.record.updatedAt.toISOString()
  };
}
