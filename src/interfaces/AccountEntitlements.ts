export type EntitlementPlan = "basic" | "pro";

export type EntitlementFeature =
  | "local_auth"
  | "identity_providers"
  | "jwt_groups"
  | "groups_propagation"
  | "flow_logs"
  | "dns_logs"
  | "self_hosted_relays"
  | "reverse_proxy"
  | "device_posture"
  | "dns"
  | "branding"
  | "ha_routes"
  | "web_ssh"
  | "web_rdp";

export type EntitlementLimit =
  | "self_hosted_relays"
  | "users"
  | "peers"
  | "reverse_proxy_servers"
  | "custom_domains"
  | "custom_rules";

export interface AccountEntitlements {
  account_id: string;
  plan: EntitlementPlan;
  features: Partial<Record<EntitlementFeature, boolean>>;
  limits: Partial<Record<EntitlementLimit, number>>;
}
