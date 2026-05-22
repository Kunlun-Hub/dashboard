export interface Relay {
  address: string;
  id?: string;
  name?: string;
  observed_id?: string;
  registered?: boolean;
  status: "online" | "offline";
  connected_clients?: number;
  registered_clients: number;
  public_ip?: string;
  country_code?: string;
  city_name?: string;
  last_checked: string;
  error?: string;
}
