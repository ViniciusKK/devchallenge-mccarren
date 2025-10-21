export interface ApiCompanyProfile {
  company_name: string | null;
  company_description: string | null;
  service_lines: string[];
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  poc: string | null;
}

export interface AnalyzeApiResponse {
  id: string;
  url: string;
  normalized_url: string;
  profile: ApiCompanyProfile;
  cached: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoredProfileSummary {
  id: string;
  url: string;
  normalized_url: string;
  profile: ApiCompanyProfile;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileState {
  id?: string;
  company_name: string;
  company_description: string;
  poc: string;
  service_lines: string[];
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  source_url: string;
  cached: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ProfileEditableField = "company_name" | "company_description" | "poc";
export type ProfileListField = "service_lines" | "tier1_keywords" | "tier2_keywords" | "emails";
