"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import React, { lazy, Suspense } from "react";
import DNSIcon from "@/assets/icons/DNSIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NameserverGroup } from "@/interfaces/Nameserver";
import PageContainer from "@/layouts/PageContainer";

const NameserverGroupTable = lazy(
  () => import("@/modules/dns/nameservers/table/NameserverGroupTable"),
);

export default function NameServers() {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const { data: nameserverGroups, isLoading } =
    useFetchApi<NameserverGroup[]>("/dns/nameservers");

  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/dns/nameservers"}
            label={t("dns.title")}
            icon={<DNSIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/dns/nameservers"}
            label={t("nameservers.title")}
            active
            icon={<DNSIcon size={13} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("nameservers.title")}</h1>
      </div>

      <RestrictedAccess
        page={t("nameservers.title")}
        hasAccess={permission.nameservers.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <NameserverGroupTable
            nameserverGroups={nameserverGroups}
            isLoading={isLoading}
            headingTarget={portalTarget}
          />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
