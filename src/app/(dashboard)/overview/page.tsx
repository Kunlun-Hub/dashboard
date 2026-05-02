"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { LayoutDashboardIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { DeviceDistributionMap } from "@/modules/overview/DeviceDistributionMap";
import { DeviceTypeDistribution } from "@/modules/overview/DeviceTypeDistribution";

export default function OverviewPage() {
  const { t } = useI18n();

  return (
    <PageContainer>
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            href="/overview"
            label={t("overview.title")}
            icon={<LayoutDashboardIcon size={13} />}
          />
        </Breadcrumbs>
        <h1>{t("overview.title")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-2">
        <DeviceDistributionMap />
        <DeviceTypeDistribution />
      </div>
    </PageContainer>
  );
}
