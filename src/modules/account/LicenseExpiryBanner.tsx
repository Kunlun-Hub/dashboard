import { AlertTriangleIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAccountLicense } from "@/modules/account/useAccountLicense";

const EXPIRY_WARNING_DAYS = 30;

export function LicenseExpiryBanner() {
  const { t, locale } = useI18n();
  const { license } = useAccountLicense();
  const expiryDate = getExpiringSoonDate(license?.end_time);

  if (!expiryDate || license?.status !== "active") {
    return null;
  }

  return (
    <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-950/40 dark:text-yellow-100">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-center gap-2 text-center">
        <AlertTriangleIcon className="h-4 w-4 shrink-0" />
        <span>
          {t("licenseExpiry.warning", {
            date: formatLicenseDate(expiryDate, locale),
          })}
        </span>
      </div>
    </div>
  );
}

function getExpiringSoonDate(value?: string) {
  if (!value) {
    return null;
  }

  const expiryDate = new Date(value);
  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const now = new Date();
  const endOfExpiryDate = new Date(expiryDate);
  endOfExpiryDate.setHours(23, 59, 59, 999);
  if (endOfExpiryDate < now) {
    return null;
  }

  const daysUntilExpiry =
    (endOfExpiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return daysUntilExpiry < EXPIRY_WARNING_DAYS ? expiryDate : null;
}

function formatLicenseDate(date: Date, locale: string) {
  if (locale === "zh-CN") {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .reduce((result, part) => {
        if (part.type === "year") return `${result}${part.value}年`;
        if (part.type === "month") return `${result}${part.value}月`;
        if (part.type === "day") return `${result}${part.value}日`;
        return result;
      }, "");
  }

  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
