export type WorkbenchVisibility = "all" | "restricted";
export type WorkbenchScope = "server" | "personal";
export type WorkbenchIconMode = "uploaded" | "fetched" | "letter";

export interface WorkbenchResource {
  id?: string;
  name: string;
  category: string;
  description: string;
  iconUrl: string;
  iconMode: WorkbenchIconMode | string;
  url: string;
  tags: string[];
  enabled: boolean;
  favorite: boolean;
  sort: number;
  scope: WorkbenchScope | string;
  source: string;
  visibility: WorkbenchVisibility | string;
  visibleGroups: string[];
  visibleUsers: string[];
  metadata?: Record<string, unknown>;
}

export interface WorkbenchIconResult {
  iconUrl: string;
  iconMode: WorkbenchIconMode | string;
}
