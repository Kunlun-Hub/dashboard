"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { Callout } from "@components/Callout";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { isNetBirdHosted } from "@utils/netbird";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ReverseProxiesProvider from "@/contexts/ReverseProxiesProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { ResourceUsageInline } from "@/modules/account/ResourceUsage";

const ReverseProxyTable = lazy(
  () => import("@/modules/reverse-proxy/table/ReverseProxyTable"),
);

export default function ReverseProxyServicesPage() {
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
            label={t("reverseProxy.title")}
            icon={<ReverseProxyIcon size={16} />}
          />
          <Breadcrumbs.Item
            href={"/reverse-proxy/services"}
            label={t("reverseProxy.servicesTitle")}
            active={true}
          />
        </Breadcrumbs>
        <div
          className={
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <h1 ref={headingRef}>{t("reverseProxy.servicesTitle")}</h1>
          <ResourceUsageInline
            limit={"custom_rules"}
            className={"sm:min-w-[18rem]"}
          />
        </div>

        {isNetBirdHosted() ? (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverseProxy.betaHosted")}
          </Callout>
        ) : (
          <Callout className={"max-w-xl mt-5"} variant={"info"}>
            {t("reverseProxy.betaSelfHosted")}
          </Callout>
        )}
      </div>

      <RestrictedAccess
        page={t("reverseProxy.servicesTitle")}
        hasAccess={permission?.services?.read}
      >
        <ReverseProxiesProvider>
          <Suspense fallback={<SkeletonTable />}>
            <ReverseProxyTable headingTarget={portalTarget} />
          </Suspense>
        </ReverseProxiesProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
