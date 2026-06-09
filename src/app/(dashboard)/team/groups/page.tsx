"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import { UsersRoundIcon } from "lucide-react";
import React, { lazy, Suspense } from "react";
import TeamIcon from "@/assets/icons/TeamIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";

const UserGroupsTable = lazy(
  () => import("@/modules/groups/table/UserGroupsTable"),
);

export default function TeamGroupsPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/team"}
            label={t("team.title")}
            icon={<TeamIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/team/groups"}
            label={t("userGroups.title")}
            active
            icon={<UsersRoundIcon size={16} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>{t("userGroups.title")}</h1>
      </div>
      <RestrictedAccess
        hasAccess={permission.groups.read && permission.users.read}
        page={t("userGroups.title")}
      >
        <Suspense fallback={<SkeletonTable />}>
          <UserGroupsTable headingTarget={portalTarget} />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
