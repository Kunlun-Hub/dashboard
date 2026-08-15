import { useMemo } from "react";
import { useAccount } from "@/modules/account/useAccount";

export type DashboardFeaturesState = {
  loading: boolean;
  cloud: boolean;
  billing: boolean;
  agentNetwork: boolean;
};

/** Resolve account-scoped dashboard capabilities with a closed default. */
export const useDashboardFeatures = (): DashboardFeaturesState => {
  const account = useAccount();

  return useMemo(() => {
    const flags = account?.settings?.dashboard_features;
    return {
      loading: account === undefined,
      cloud: flags?.cloud === true,
      billing: flags?.billing === true,
      agentNetwork: flags?.agent_network === true,
    };
  }, [account]);
};
