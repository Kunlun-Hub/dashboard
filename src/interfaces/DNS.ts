export interface DNSZone {
  id?: string;
  name: string;
  domain: string;
  enabled: boolean;
  enable_search_domain: boolean;
  distribution_groups: string[];
  records?: DNSRecord[];
  groups_search?: string;
}

export interface DNSRecord {
  id?: string;
  name: string;
  type: "A" | "AAAA" | "CNAME";
  content: string;
  ttl: number;
}

export type DNSRecordType = "A" | "AAAA" | "CNAME";
