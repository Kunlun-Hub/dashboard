"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import React, { lazy, Suspense } from "react";
import DNSIcon from "@/assets/icons/DNSIcon";
import DNSZoneIcon from "@/assets/icons/DNSZoneIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { DNSZone } from "@/interfaces/DNS";
import PageContainer from "@/layouts/PageContainer";
import { DNSZonesProvider } from "@/modules/dns/zones/DNSZonesProvider";

const DNSZonesTable = lazy(
  () => import("@/modules/dns/zones/table/DNSZonesTable"),
);

export default function DNSZonePage() {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const { data: zones, isLoading } = useFetchApi<DNSZone[]>("/dns/zones");

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item label={t("dns.title")} icon={<DNSIcon size={13} />} />
          <Breadcrumbs.Item
            href={"/dns/zones"}
            label={t("zones.title")}
            active
            icon={<DNSZoneIcon size={16} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("zones.pageTitle")}</h1>
      </div>

      <RestrictedAccess
        page={t("zones.pageTitle")}
        hasAccess={permission?.dns?.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <DNSZonesProvider>
            <DNSZonesTable
              isLoading={isLoading}
              headingTarget={portalTarget}
              data={zones}
            />
          </DNSZonesProvider>
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
