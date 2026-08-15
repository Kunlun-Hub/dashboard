"use client";

import React, { createContext, useContext } from "react";

type RefreshContextType = {
  refreshTrigger: number;
  refreshInterval: number;
  triggerRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
};

export const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function useOverviewRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useOverviewRefresh must be used within RefreshContext.Provider");
  }
  return context;
}
