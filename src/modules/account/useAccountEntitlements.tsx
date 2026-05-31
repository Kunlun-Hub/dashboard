import useFetchApi from "@utils/api";
import { useCallback } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  AccountEntitlements,
  EntitlementFeature,
  EntitlementLimit,
} from "@/interfaces/AccountEntitlements";
import { useAccount } from "@/modules/account/useAccount";

export const useAccountEntitlements = () => {
  const account = useAccount();
  const { permission } = usePermissions();
  const allowFetch = Boolean(account?.id && permission?.accounts?.read);

  const {
    data: entitlements,
    isLoading,
    error,
  } = useFetchApi<AccountEntitlements>(
    account?.id ? `/accounts/${account.id}/entitlements` : "",
    true,
    true,
    allowFetch,
  );

  const isFeatureEnabled = useCallback(
    (feature: EntitlementFeature) => {
      return entitlements?.features?.[feature] ?? true;
    },
    [entitlements],
  );

  const limitValue = useCallback(
    (limit: EntitlementLimit) => {
      return entitlements?.limits?.[limit];
    },
    [entitlements],
  );

  return {
    entitlements,
    error,
    isLoading,
    isFeatureEnabled,
    limitValue,
  } as const;
};
