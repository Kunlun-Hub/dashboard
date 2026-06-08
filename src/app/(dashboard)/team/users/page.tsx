"use client";

import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import { ExternalLinkIcon, User2 } from "lucide-react";
import React, { lazy, Suspense } from "react";
import TeamIcon from "@/assets/icons/TeamIcon";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { ResourceUsageInline } from "@/modules/account/ResourceUsage";

const UsersTable = lazy(() => import("@/modules/users/UsersTable"));

export default function TeamUsers() {
  const { isLoading: isGroupsLoading } = useGroups();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { data: users, isLoading } = useFetchApi<User[]>(
    "/users?service_user=false",
  );

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
            href={"/team/users"}
            label={t("users.title")}
            active
            icon={<User2 size={16} />}
          />
        </Breadcrumbs>
        <h1 ref={headingRef}>Users</h1>
        <Paragraph>
          Manage users and their permissions. Same-domain email users are added
          automatically on first sign-in.{" "}
          <InlineLink
            href={"https://docs.netbird.io/how-to/add-users-to-your-network"}
            target={"_blank"}
          >
            Learn more
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>
      </div>
      <RestrictedAccess
        page={t("users.title")}
        hasAccess={permission.users.read}
      >
        <Suspense fallback={<SkeletonTable />}>
          <UsersTable
            users={users}
            isLoading={isLoading || isGroupsLoading}
            headingTarget={portalTarget}
          />
        </Suspense>
      </RestrictedAccess>
    </PageContainer>
  );
}
