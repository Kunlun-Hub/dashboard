"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { RadioTowerIcon, SlidersHorizontalIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";

const RelayPreferenceControl = lazy(
  () => import("@/modules/relays/RelayPreferenceControl"),
);

export default function RelayControlPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/relays"}
            label={t("relays.title")}
            icon={<RadioTowerIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/relays/control"}
            label={t("relays.controlTitle")}
            icon={<SlidersHorizontalIcon size={13} />}
            active={true}
          />
        </Breadcrumbs>
        <h1>{t("relays.controlTitle")}</h1>
        <Paragraph>{t("relays.controlDescription")}</Paragraph>
      </div>
      <RestrictedAccess
        page={t("relays.controlTitle")}
        hasAccess={permission?.settings?.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <RelayPreferenceControl />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
