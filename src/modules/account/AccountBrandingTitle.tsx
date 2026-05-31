"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  defaultBrandingTitle,
  getBrandedDocumentTitle,
  getEffectiveBrandingTitle,
} from "@/modules/account/accountBranding";
import { useAccount } from "@/modules/account/useAccount";

export default function AccountBrandingTitle() {
  const account = useAccount();
  const pathname = usePathname();
  const previousBrandingTitle = useRef(defaultBrandingTitle);

  const brandingTitle = useMemo(
    () => getEffectiveBrandingTitle(account),
    [account],
  );

  useEffect(() => {
    document.title = getBrandedDocumentTitle(
      document.title,
      brandingTitle,
      previousBrandingTitle.current,
    );
    previousBrandingTitle.current = brandingTitle;
  }, [brandingTitle, pathname]);

  return null;
}
