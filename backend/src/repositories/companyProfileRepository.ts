import crypto from "node:crypto";
import { Pool } from "pg";
import env from "../config/env.js";
import type { CompanyProfilePayload, StoredCompanyProfile } from "../types/companyProfile.js";

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined
});

export async function initCompanyProfileRepository(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_profiles (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      normalized_url TEXT NOT NULL UNIQUE,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function findByNormalizedUrl(normalizedUrl: string): Promise<StoredCompanyProfile | null> {
  const result = await pool.query(
    `
    SELECT id, url, normalized_url, payload, created_at, updated_at
    FROM company_profiles
    WHERE normalized_url = $1
    LIMIT 1;
  `,
    [normalizedUrl]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function findById(id: string): Promise<StoredCompanyProfile | null> {
  const result = await pool.query(
    `
    SELECT id, url, normalized_url, payload, created_at, updated_at
    FROM company_profiles
    WHERE id = $1
    LIMIT 1;
  `,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function listProfiles(limit = 25): Promise<StoredCompanyProfile[]> {
  const result = await pool.query(
    `
    SELECT id, url, normalized_url, payload, created_at, updated_at
    FROM company_profiles
    ORDER BY created_at DESC
    LIMIT $1;
  `,
    [limit]
  );

  return result.rows.map(mapRow);
}

export async function insertProfile(url: string, normalizedUrl: string, payload: CompanyProfilePayload): Promise<StoredCompanyProfile> {
  const id = crypto.randomUUID();
  const result = await pool.query(
    `
    INSERT INTO company_profiles (id, url, normalized_url, payload)
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING id, url, normalized_url, payload, created_at, updated_at;
  `,
    [id, url, normalizedUrl, JSON.stringify(payload)]
  );

  return mapRow(result.rows[0]);
}

export async function updateProfile(
  id: string,
  url: string,
  normalizedUrl: string,
  payload: CompanyProfilePayload
): Promise<StoredCompanyProfile | null> {
  const result = await pool.query(
    `
    UPDATE company_profiles
    SET url = $2,
        normalized_url = $3,
        payload = $4::jsonb,
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, url, normalized_url, payload, created_at, updated_at;
  `,
    [id, url, normalizedUrl, JSON.stringify(payload)]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

function mapRow(row: any): StoredCompanyProfile {
  return {
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalized_url,
    payload: row.payload as CompanyProfilePayload,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
