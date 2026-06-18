"use client";

import useFetchApi from "@utils/api";
import React, { createContext, useCallback, useContext } from "react";
import { SaaSMenuVisibility, SaaSTrafficUsage } from "@/interfaces/SaaS";

type SaaSContextValue = {
  menus?: SaaSMenuVisibility;
  usage?: SaaSTrafficUsage;
  isLoading: boolean;
  isMenuVisible: (key: string) => boolean;
};

const SaaSContext = createContext<SaaSContextValue>({
  isLoading: false,
  isMenuVisible: () => true,
});

export function SaaSProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: menus, isLoading: menusLoading } = useFetchApi<SaaSMenuVisibility>(
    "/saas/menus",
    true,
    true,
    true,
    { shouldRetryOnError: false },
  );
  const { data: usage, isLoading: usageLoading } = useFetchApi<SaaSTrafficUsage>(
    "/saas/usage",
    true,
    true,
    true,
    { shouldRetryOnError: false },
  );

  const isMenuVisible = useCallback(
    (key: string) => menus?.[key] ?? true,
    [menus],
  );

  return (
    <SaaSContext.Provider
      value={{
        menus,
        usage,
        isLoading: menusLoading || usageLoading,
        isMenuVisible,
      }}
    >
      {children}
    </SaaSContext.Provider>
  );
}

export function useSaaS() {
  return useContext(SaaSContext);
}
