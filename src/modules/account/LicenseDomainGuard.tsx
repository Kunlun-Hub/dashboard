import { getDashboardServerURL } from "@utils/license";
import { AlertTriangleIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAccountLicense } from "@/modules/account/useAccountLicense";

export function LicenseDomainGuard() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { license } = useAccountLicense();
  const currentServerURL = getDashboardServerURL();
  const mismatch = license?.status === "url_mismatch";

  useEffect(() => {
    if (!mismatch || pathname === "/settings") return;
    router.replace("/settings?tab=license&license_url_mismatch=1");
  }, [mismatch, pathname, router]);

  if (!mismatch) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center px-5 dark:bg-nb-gray-950/95"
      }
    >
      <div
        className={
          "max-w-lg w-full border border-red-200 bg-white rounded-md p-6 shadow-2xl dark:border-red-500/30 dark:bg-nb-gray-940"
        }
      >
        <div className={"flex items-start gap-4"}>
          <div
            className={
              "h-10 w-10 rounded-md bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 dark:bg-red-950 dark:text-red-300 dark:border-red-500/30"
            }
          >
            <AlertTriangleIcon size={20} />
          </div>
          <div>
            <h2 className={"text-lg font-semibold text-neutral-900 dark:text-white"}>
              {t("licenseSettings.urlMismatchTitle")}
            </h2>
            <p className={"text-sm text-neutral-600 mt-2 leading-6 dark:text-nb-gray-300"}>
              {t("licenseSettings.urlMismatchDescription")}
            </p>
            <div className={"mt-5 space-y-3 text-sm"}>
              <MismatchFact
                label={t("licenseSettings.currentUrl")}
                value={currentServerURL || t("common.unknown")}
              />
              <MismatchFact
                label={t("licenseSettings.authorizedUrl")}
                value={license?.server_url || t("common.unknown")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MismatchFact({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className={"flex items-center justify-between gap-4"}>
      <span className={"text-neutral-500 dark:text-nb-gray-400"}>{label}</span>
      <span className={"font-mono text-xs text-neutral-900 truncate dark:text-white"}>{value}</span>
    </div>
  );
}
