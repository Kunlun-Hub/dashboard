export interface Relay {
  address: string;
  id?: string;
  name?: string;
  observed_id?: string;
  registered?: boolean;
  status: "online" | "offline";
  connected_clients?: number;
  registered_clients: number;
  last_checked: string;
  error?: string;
}
