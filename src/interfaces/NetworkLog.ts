export interface NetworkLogEndpoint {
  id: string;
  type: string;
  name: string;
  address: string;
  dns_label?: string | null;
  os?: string | null;
  geo_location: {
    country_code: string;
    city_name: string;
  };
}

export interface NetworkLogSubEvent {
  timestamp: string;
  type: string;
}

export interface NetworkLogUser {
  id: string;
  name: string;
  email: string;
}

export interface NetworkLog {
  flow_id: string;
  direction: string;
  protocol: number;
  reporter_id: string;
  rx_bytes: number;
  rx_packets: number;
  tx_bytes: number;
  tx_packets: number;
  source: NetworkLogEndpoint;
  destination: NetworkLogEndpoint;
  policy: {
    id: string;
    name: string;
  };
  icmp: {
    type: number;
    code: number;
  };
  user: NetworkLogUser;
  events: NetworkLogSubEvent[];
}
