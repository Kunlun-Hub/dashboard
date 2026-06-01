"use client";

import { useEffect, useMemo } from "react";
import UsersProvider from "@/contexts/UsersProvider";
import {
  applyBrandingColor,
  defaultBrandingColor,
  getAccountBrandingPrimaryColor,
} from "@/modules/account/accountBranding";
import { useAccount } from "@/modules/account/useAccount";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UsersProvider>
      <RemoteAccessBrandingColor />
      {children}
    </UsersProvider>
  );
}

function RemoteAccessBrandingColor() {
  const account = useAccount();
  const primaryColor = useMemo(
    () => getAccountBrandingPrimaryColor(account) || defaultBrandingColor,
    [account],
  );

  useEffect(() => {
    applyBrandingColor(primaryColor);
  }, [primaryColor]);

  return null;
}
