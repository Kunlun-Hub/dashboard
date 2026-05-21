"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { REVERSE_PROXY_CLUSTERS_DOCS_LINK } from "@/interfaces/ReverseProxy";
import PageContainer from "@/layouts/PageContainer";

const SelfHostedProxiesTable = lazy(
  () =>
    import(
      "@/modules/reverse-proxy/self-hosted-proxies/SelfHostedProxiesTable"
    ),
);

export default function ReverseProxyClustersPage() {
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
            href={"/reverse-proxy/self-hosted-proxies"}
            label={t("reverseProxy.selfHostedProxies")}
            active={true}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("reverseProxy.selfHostedProxies")}</h1>
        <Paragraph>{t("reverseProxy.selfHostedDescription")}</Paragraph>
        <Paragraph>
          {t("common.learnMorePrefix")}{" "}
          <InlineLink href={REVERSE_PROXY_CLUSTERS_DOCS_LINK} target={"_blank"}>
            {t("reverseProxy.selfHostedProxies")}
            <ExternalLinkIcon size={12} />
          </InlineLink>{" "}
          {t("common.inDocumentationSuffix")}
        </Paragraph>
      </div>
      <RestrictedAccess
        page={t("reverseProxy.selfHostedProxies")}
        hasAccess={permission?.services?.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <SelfHostedProxiesTable headingTarget={portalTarget} />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
