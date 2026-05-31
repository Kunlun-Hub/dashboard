"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider from "@/contexts/ReverseProxiesProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { ResourceUsageInline } from "@/modules/account/ResourceUsage";

const CustomDomainsTable = lazy(
  () => import("@/modules/reverse-proxy/domain/CustomDomainsTable"),
);

export default function ReverseProxyCustomDomainsPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("nav.reverseProxy")}
            icon={<ReverseProxyIcon size={16} />}
          />
          <Breadcrumbs.Item
            href={"/reverse-proxy/custom-domains"}
            label={t("nav.customDomains")}
            active={true}
          />
        </Breadcrumbs>
        <div
          className={
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <h1 ref={headingRef}>{t("customDomains.title")}</h1>
          <ResourceUsageInline
            limit={"custom_domains"}
            className={"sm:min-w-[18rem]"}
          />
        </div>
      </div>
      <RestrictedAccess
        page={t("nav.customDomains")}
        hasAccess={permission?.services?.read}
      >
        <ReverseProxiesProvider>
          <Suspense fallback={<SkeletonTable />}>
            <CustomDomainsTable headingTarget={portalTarget} />
          </Suspense>
        </ReverseProxiesProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
