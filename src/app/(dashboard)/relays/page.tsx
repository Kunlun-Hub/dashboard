"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { RadioTowerIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { ResourceUsageInline } from "@/modules/account/ResourceUsage";

const RelaysTable = lazy(() => import("@/modules/relays/RelaysTable"));

export default function RelaysPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/relays"}
            label={t("relays.title")}
            icon={<RadioTowerIcon size={13} />}
            active={true}
          />
        </Breadcrumbs>
        <div
          className={
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <h1 ref={headingRef}>{t("relays.title")}</h1>
          <ResourceUsageInline
            limit={"self_hosted_relays"}
            className={"sm:min-w-[18rem]"}
          />
        </div>
      </div>
      <RestrictedAccess
        page={t("relays.title")}
        hasAccess={permission?.settings?.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <RelaysTable headingTarget={portalTarget} />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
