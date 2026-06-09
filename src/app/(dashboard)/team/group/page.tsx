"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { PageNotFound } from "@components/ui/PageNotFound";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import useRedirect from "@hooks/useRedirect";
import useFetchApi from "@utils/api";
import { ShieldIcon, UsersRoundIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import TeamIcon from "@/assets/icons/TeamIcon";
import { GroupProvider } from "@/contexts/GroupProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group, GroupType } from "@/interfaces/Group";
import { Policy } from "@/interfaces/Policy";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { GroupDetailsName } from "@/modules/groups/details/GroupDetailsName";
import { GroupPoliciesSection } from "@/modules/groups/details/GroupPoliciesSection";
import { GroupUsersSection } from "@/modules/groups/details/GroupUsersSection";

export default function TeamGroupPage() {
  const { t } = useI18n();
  const queryParameter = useSearchParams();
  const { isRestricted, permission } = usePermissions();
  const groupId = queryParameter.get("id");
  const {
    data: group,
    isLoading,
    error,
  } = useFetchApi<Group>(`/groups/${groupId}`, true);

  useRedirect("/team/groups", false, !groupId || isRestricted);

  if (isRestricted || !permission.groups.read || !permission.users.read) {
    return (
      <PageContainer>
        <RestrictedAccess page={t("userGroups.detailsTitle")} />
      </PageContainer>
    );
  }

  if (error)
    return (
      <PageNotFound
        title={error?.message}
        description={t("userGroups.notFound")}
      />
    );

  if (group && group.type !== GroupType.USER) {
    return (
      <PageNotFound
        title={t("userGroups.notFoundTitle")}
        description={t("userGroups.notFound")}
      />
    );
  }

  return group && !isLoading ? (
    <PageContainer>
      <GroupProvider group={group} isDetailPage={true}>
        <div className={"p-default py-6 pb-0 w-full mb-[6px]"}>
          <Breadcrumbs>
            <Breadcrumbs.Item
              href={"/team"}
              label={t("team.title")}
              icon={<TeamIcon size={13} />}
            />
            <Breadcrumbs.Item
              href={"/team/groups"}
              label={t("userGroups.title")}
              icon={<UsersRoundIcon size={16} />}
            />
            <Breadcrumbs.Item label={group.name} active />
          </Breadcrumbs>
          <GroupDetailsName />
        </div>
        <UserGroupReferences groupId={group.id ?? ""} />
      </GroupProvider>
    </PageContainer>
  ) : (
    <FullScreenLoading />
  );
}

const UserGroupReferences = ({ groupId }: { groupId: string }) => {
  const { t } = useI18n();
  const { data: users, isLoading } = useFetchApi<User[]>(
    "/users?service_user=false",
  );
  const { data: policies, isLoading: isPoliciesLoading } =
    useFetchApi<Policy[]>("/policies");
  const groupUsers = useMemo(
    () => users?.filter((user) => user.user_groups?.includes(groupId)),
    [groupId, users],
  );
  const groupPolicies = useMemo(
    () =>
      policies?.filter((policy) =>
        policy.rules?.some((rule) =>
          (rule.source_user_groups ?? []).some((group) =>
            typeof group === "string" ? group === groupId : group.id === groupId,
          ),
        ),
      ),
    [groupId, policies],
  );

  return (
    <Tabs defaultValue={"users"} className={"pt-2 pb-0 mb-0"}>
      <TabsList justify={"start"} className={"px-8"}>
        <TabsTrigger value={"users"}>
          <UsersRoundIcon size={14} />
          {t("userGroups.referencedUsers", { count: groupUsers?.length ?? 0 })}
        </TabsTrigger>
        <TabsTrigger value={"policies"}>
          <ShieldIcon size={14} />
          {t("userGroups.referencedPolicies", {
            count: groupPolicies?.length ?? 0,
          })}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={"users"} className={"pt-6"}>
        <GroupUsersSection users={groupUsers} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value={"policies"} className={"pt-6"}>
        <GroupPoliciesSection
          policies={groupPolicies}
          isLoading={isPoliciesLoading}
        />
      </TabsContent>
    </Tabs>
  );
};
