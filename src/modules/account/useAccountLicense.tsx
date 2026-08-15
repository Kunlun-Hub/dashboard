import useFetchApi from "@utils/api";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { AccountLicense } from "@/interfaces/AccountLicense";
import { useAccount } from "@/modules/account/useAccount";

export const useAccountLicense = () => {
  const account = useAccount();
  const { permission } = usePermissions();
  const allowFetch = Boolean(account?.id && permission?.accounts?.read);

  const { data, error, isLoading, isValidating, mutate } =
    useFetchApi<AccountLicense>(
      account?.id ? `/accounts/${account.id}/license` : "",
      true,
      true,
      allowFetch,
    );

  return {
    license: data,
    error,
    isLoading,
    isValidating,
    mutate,
  } as const;
};
