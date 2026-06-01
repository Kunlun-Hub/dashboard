import { cn } from "@utils/helpers";
import React from "react";
import FullTooltip from "@/components/FullTooltip";
import { useI18n } from "@/i18n/I18nProvider";
import {
  EntitlementFeature,
  EntitlementLimit,
} from "@/interfaces/AccountEntitlements";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";

type UsageMap = Partial<Record<EntitlementLimit, number>>;
type FeatureMap = Partial<Record<EntitlementFeature, boolean>>;

const defaultUsageItems: EntitlementLimit[] = [
  "users",
  "peers",
  "self_hosted_relays",
  "custom_domains",
  "custom_rules",
];

type ResourceUsagePanelProps = {
  featureItems?: EntitlementFeature[];
  features?: FeatureMap;
  limits?: UsageMap;
  usage?: UsageMap;
  items?: EntitlementLimit[];
};

export function ResourceUsagePanel({
  featureItems = [],
  features,
  limits,
  usage,
  items = defaultUsageItems,
}: Readonly<ResourceUsagePanelProps>) {
  const { t } = useI18n();

  return (
    <div className={"mt-6"}>
      <div className={"text-sm font-medium text-nb-gray-900 dark:text-white"}>
        {t("resourceUsage.title")}
      </div>
      <div className={"mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        {items.map((item) => (
          <ResourceUsageCard
            key={item}
            limit={item}
            allowed={limits?.[item]}
            used={usage?.[item]}
          />
        ))}
        {featureItems.map((feature) => (
          <ResourceFeatureStatusCard
            key={feature}
            feature={feature}
            enabled={features?.[feature]}
          />
        ))}
      </div>
    </div>
  );
}

type ResourceUsageInlineProps = {
  limit: EntitlementLimit;
  className?: string;
};

export function ResourceUsageInline({
  limit,
  className,
}: Readonly<ResourceUsageInlineProps>) {
  const { entitlements } = useAccountEntitlements();

  return (
    <ResourceUsageCard
      limit={limit}
      allowed={entitlements?.limits?.[limit]}
      used={entitlements?.usage?.[limit]}
      compact
      className={className}
    />
  );
}

export function useResourceLimit(limit: EntitlementLimit) {
  const { t } = useI18n();
  const { entitlements } = useAccountEntitlements();
  const allowed = entitlements?.limits?.[limit];
  const used = entitlements?.usage?.[limit];
  const usageText = `${used === undefined ? "-" : used}/${formatLimit(
    t,
    allowed,
  )}`;
  const exhausted =
    allowed !== undefined &&
    allowed >= 0 &&
    used !== undefined &&
    used >= allowed;

  return {
    allowed,
    exhausted,
    label: limitLabel(t, limit),
    message: t("resourceUsage.insufficient", {
      resource: limitLabel(t, limit),
      usage: usageText,
    }),
    usageText,
    used,
  } as const;
}

type ResourceLimitTooltipProps = {
  children: React.ReactNode;
  className?: string;
  limitState: ReturnType<typeof useResourceLimit>;
};

export function ResourceLimitTooltip({
  children,
  className,
  limitState,
}: Readonly<ResourceLimitTooltipProps>) {
  if (!limitState.exhausted) return <>{children}</>;

  return (
    <FullTooltip
      content={<p className={"max-w-[240px] text-xs"}>{limitState.message}</p>}
      className={className}
      side={"top"}
    >
      {children}
    </FullTooltip>
  );
}

function ResourceUsageCard({
  limit,
  allowed,
  used,
  compact = false,
  className,
}: Readonly<{
  limit: EntitlementLimit;
  allowed?: number;
  used?: number;
  compact?: boolean;
  className?: string;
}>) {
  const { t } = useI18n();
  const currentText = used === undefined ? "-" : String(used);
  const limitText = formatLimit(t, allowed);
  const remainingText = formatRemaining(t, used, allowed);

  return (
    <div
      className={cn(
        "border border-neutral-200 dark:border-nb-gray-920 rounded-md bg-white dark:bg-nb-gray-940",
        compact ? "px-3 py-2 flex items-center gap-3" : "px-4 py-3",
        className,
      )}
    >
      <div
        className={cn(
          "text-nb-gray-500 dark:text-nb-gray-300",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {limitLabel(t, limit)}
      </div>
      <div
        className={cn(
          "font-semibold text-nb-gray-900 dark:text-white",
          compact ? "text-sm" : "text-lg mt-1",
        )}
      >
        {currentText}/{limitText}
      </div>
      <div
        className={cn(
          "text-nb-gray-400",
          compact ? "text-xs ml-auto" : "text-xs mt-1",
        )}
      >
        {remainingText}
      </div>
    </div>
  );
}

function ResourceFeatureStatusCard({
  feature,
  enabled,
}: Readonly<{
  feature: EntitlementFeature;
  enabled?: boolean;
}>) {
  const { t } = useI18n();
  const statusText =
    enabled === undefined
      ? t("common.unknown")
      : enabled
      ? t("resourceUsage.authorized")
      : t("resourceUsage.unauthorized");

  return (
    <div
      className={
        "border border-neutral-200 dark:border-nb-gray-920 rounded-md bg-white dark:bg-nb-gray-940 px-4 py-3"
      }
    >
      <div className={"text-sm text-nb-gray-500 dark:text-nb-gray-300"}>
        {featureLabel(t, feature)}
      </div>
      <div
        className={cn(
          "font-semibold text-lg mt-1",
          enabled === undefined && "text-nb-gray-400",
          enabled === true && "text-green-600 dark:text-green-400",
          enabled === false && "text-yellow-600 dark:text-yellow-400",
        )}
      >
        {statusText}
      </div>
      <div className={"text-xs mt-1 text-nb-gray-400"}>
        {t("resourceUsage.featureStatus")}
      </div>
    </div>
  );
}

function featureLabel(
  t: ReturnType<typeof useI18n>["t"],
  feature: EntitlementFeature,
) {
  switch (feature) {
    case "ha_routes":
      return t("resourceUsage.routeHighAvailability");
    default:
      return feature;
  }
}

function limitLabel(
  t: ReturnType<typeof useI18n>["t"],
  limit: EntitlementLimit,
) {
  switch (limit) {
    case "users":
      return t("resourceUsage.users");
    case "peers":
      return t("resourceUsage.peers");
    case "self_hosted_relays":
      return t("resourceUsage.relays");
    case "reverse_proxy_servers":
      return t("resourceUsage.reverseProxyServers");
    case "custom_domains":
      return t("resourceUsage.customDomains");
    case "custom_rules":
      return t("resourceUsage.customRules");
    default:
      return limit;
  }
}

function formatLimit(t: ReturnType<typeof useI18n>["t"], limit?: number) {
  if (limit === undefined) return "-";
  if (limit < 0) return t("resourceUsage.unlimited");
  return String(limit);
}

function formatRemaining(
  t: ReturnType<typeof useI18n>["t"],
  used?: number,
  limit?: number,
) {
  if (used === undefined || limit === undefined)
    return t("resourceUsage.remainingUnknown");
  if (limit < 0) return t("resourceUsage.remainingUnlimited");
  return t("resourceUsage.remaining", {
    count: Math.max(limit - used, 0),
  });
}
