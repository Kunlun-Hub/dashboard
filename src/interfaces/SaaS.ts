export type SaaSMenuVisibility = Record<string, boolean>;

export interface SaaSTrafficUsage {
  account_id: string;
  period_key: string;
  high_speed_traffic_bytes: number;
  high_speed_used_bytes: number;
  high_speed_remaining_bytes: number;
  traffic_tier: "high_speed" | "standard" | string;
  high_speed_rate_limit_mbps: number;
  standard_rate_limit_mbps: number;
  total_rate_limit_mbps: number;
  effective_rate_limit_mbps: number;
  relay_only_accounting: boolean;
  fair_share_enabled: boolean;
}
