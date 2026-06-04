"use client";

import Button from "@components/Button";
import { NetBirdLogo } from "@components/NetBirdLogo";
import DarkModeToggle from "@components/ui/DarkModeToggle";
import HelpAndSupportButton from "@components/ui/HelpAndSupportButton";
import UserDropdown from "@components/ui/UserDropdown";
import { cn } from "@utils/helpers";
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  getAccountBrandingDarkLogoDataURL,
  getAccountBrandingIconDataURL,
  getAccountBrandingLogoDataURL,
  getEffectiveBrandingTitle,
} from "@/modules/account/accountBranding";
import { LicenseExpiryBanner } from "@/modules/account/LicenseExpiryBanner";
import { useAccount } from "@/modules/account/useAccount";

export const headerHeight = 65;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

export default function NavbarWithDropdown() {
  const router = useRouter();
  const { toggleMobileNav } = useApplicationContext();
  const { isRestricted } = usePermissions();
  const account = useAccount();
  const brandingLogoDataURL = getAccountBrandingLogoDataURL(account);
  const brandingDarkLogoDataURL = getAccountBrandingDarkLogoDataURL(account);
  const brandingIconDataURL = getAccountBrandingIconDataURL(account);
  const brandingTitle = getEffectiveBrandingTitle(account);

  return (
    <>
      <div
        className={"relative z-50 w-full shrink-0"}
      >
        <div
          className={cn(
            "light-theme-surface bg-white px-2 py-3 border-neutral-200 dark:border-nb-gray-800/60 dark:bg-nb-gray backdrop-blur-lg sm:px-6",
            "border-b px-3 md:px-4 w-full",
            "flex justify-between items-center transition-all",
          )}
        >
          <div className={"flex items-center gap-4 md:hidden"}>
            <Button
              className={cn(
                "!px-3 md:hidden",
                isRestricted && "opacity-0 pointer-events-none",
              )}
              variant={"default-outline"}
              onClick={toggleMobileNav}
            >
              <div>
                <MenuIcon size={20} className={"relative"} />
              </div>
            </Button>
          </div>
          <div className={"flex gap-4 mr-auto min-w-0"}>
            <button
              onClick={() => router.push("/peers")}
              aria-label={brandingTitle}
              className={
                "cursor-pointer hover:opacity-70 transition-all mr-auto min-w-0 overflow-hidden"
              }
              data-cy={"header-brand-logo"}
            >
              <NetBirdLogo
                customLogoSrc={brandingLogoDataURL}
                customDarkLogoSrc={brandingDarkLogoDataURL}
                customIconSrc={brandingIconDataURL}
                alt={`${brandingTitle} Logo`}
              />
            </button>
            <ToggleCollapsableNavigationButton />
          </div>

          <div className="flex md:order-2 gap-5 items-center">
            <DarkModeToggle />
            <HelpAndSupportButton />
            <UserDropdown />
          </div>
        </div>
        <LicenseExpiryBanner />
      </div>
    </>
  );
}

const ToggleCollapsableNavigationButton = () => {
  const { isRestricted } = usePermissions();
  const { toggleNavigation, isNavigationCollapsed } = useApplicationContext();

  return (
    !isRestricted && (
      <button
        onClick={toggleNavigation}
        className={cn(
          "h-10 w-10 flex items-center justify-center text-neutral-500 transition-all hover:text-neutral-900 dark:text-nb-gray-300 dark:hover:text-white ml-2",
          "hidden md:block",
        )}
      >
        {isNavigationCollapsed ? (
          <PanelLeftOpenIcon size={16} />
        ) : (
          <PanelLeftCloseIcon size={16} />
        )}
      </button>
    )
  );
};
