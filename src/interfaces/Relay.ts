export interface Relay {
  address: string;
  status: "online" | "offline";
  connected_clients?: number;
  registered_clients: number;
  last_checked: string;
  error?: string;
}
