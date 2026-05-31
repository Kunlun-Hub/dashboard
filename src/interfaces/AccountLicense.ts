import {
  EntitlementFeature,
  EntitlementLimit,
  EntitlementPlan,
} from "@/interfaces/AccountEntitlements";

export type LicenseStatus =
  | "unlicensed"
  | "active"
  | "invalid"
  | "url_mismatch"
  | "not_started"
  | "expired";

export type LicenseType = "try" | "year" | "enterprise";

export interface AccountLicense {
  machine_id: string;
  server_url?: string;
  name?: string;
  status: LicenseStatus;
  plan: EntitlementPlan;
  license_key_masked?: string;
  license: LicenseType[];
  message?: string;
  start_time?: string;
  end_time?: string;
  updated_at?: string;
  features: Partial<Record<EntitlementFeature, boolean>>;
  limits: Partial<Record<EntitlementLimit, number>>;
  usage: Partial<Record<EntitlementLimit, number>>;
}

export interface UpdateAccountLicenseRequest {
  license_key: string;
  server_url?: string;
}
