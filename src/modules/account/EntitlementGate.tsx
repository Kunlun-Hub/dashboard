import { Callout } from "@components/Callout";
import * as Tabs from "@radix-ui/react-tabs";
import { LockIcon } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type PlanUpgradeCalloutProps = {
  feature: string;
  className?: string;
};

export function PlanUpgradeCallout({
  feature,
  className,
}: Readonly<PlanUpgradeCalloutProps>) {
  const { t } = useI18n();

  return (
    <Callout
      variant="warning"
      className={className}
      icon={<LockIcon size={14} className="shrink-0 relative top-[3px]" />}
    >
      <div className="font-medium">{t("entitlements.upgradeTitle")}</div>
      <div className="mt-1 text-xs leading-5">
        {t("entitlements.upgradeDescription", { feature })}
      </div>
    </Callout>
  );
}

type EntitlementLockedTabProps = {
  value: string;
  feature: string;
};

export function EntitlementLockedTab({
  value,
  feature,
}: Readonly<EntitlementLockedTabProps>) {
  return (
    <Tabs.Content value={value} className="w-full">
      <div className="p-default py-6 max-w-2xl">
        <PlanUpgradeCallout feature={feature} />
      </div>
    </Tabs.Content>
  );
}
