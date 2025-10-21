export interface CompanyProfilePayload {
  company_name: string | null;
  company_description: string | null;
  service_lines: string[];
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  poc: string | null;
}

export interface StoredCompanyProfile {
  id: string;
  url: string;
  normalizedUrl: string;
  payload: CompanyProfilePayload;
  createdAt: Date;
  updatedAt: Date;
}
