"use client";

import { ExternalLinkIcon } from "lucide-react";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
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
import { REVERSE_PROXY_DOCS_LINK } from "@/interfaces/ReverseProxy";
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
        <h1 ref={headingRef}>Services</h1>
        <Paragraph>
          Expose services securely through NetBird&apos;s reverse proxy.{" "}
          <InlineLink href={REVERSE_PROXY_DOCS_LINK} target={"_blank"}>
            Learn more
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>

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
