export interface CompanyProfileState {
  company_name: string;
  company_description: string;
  poc: string;
  service_lines: string[];
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  source_url: string;
}

export type ProfileEditableField = "company_name" | "company_description" | "poc";
export type ProfileListField = "service_lines" | "tier1_keywords" | "tier2_keywords" | "emails";

export interface AnalyzeResponsePayload {
  company_name: string | null;
  service_line: string | string[] | null;
  company_description: string | null;
  tier1_keywords: string[];
  tier2_keywords: string[];
  emails: string[];
  poc: string | null;
}
