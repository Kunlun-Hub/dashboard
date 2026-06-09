"use client";

import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { removeAllSpaces } from "@utils/helpers";
import { UsersRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import TeamIcon from "@/assets/icons/TeamIcon";
import { AddGroupButton } from "@/components/ui/AddGroupButton";
import { GroupBadgeIcon } from "@/components/ui/GroupBadgeIcon";
import TextWithTooltip from "@/components/ui/TextWithTooltip";
import { GroupProvider } from "@/contexts/GroupProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { GroupType } from "@/interfaces/Group";
import GroupsActionCell from "@/modules/groups/table/GroupsActionCell";
import useGroupsUsage, { GroupUsage } from "@/modules/groups/useGroupsUsage";

function useUserGroupsTableColumns(): ColumnDef<GroupUsage>[] {
  const { t } = useI18n();

  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              {t("table.name")}
            </DataTableHeader>
          );
        },
        cell: ({ row }) => (
          <div className={"inline-flex items-center gap-3 py-2 px-3"}>
            <GroupBadgeIcon id={row.original.id} issued={row.original.issued} />
            <div className={"font-medium text-neutral-700 dark:text-neutral-300"}>
              <TextWithTooltip text={row.original.name} maxChars={60} />
            </div>
          </div>
        ),
        sortingFn: "text",
      },
      {
        accessorKey: "users_count",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              <TeamIcon size={12} />
              {t("userGroups.members")}
            </DataTableHeader>
          );
        },
        cell: ({ row }) => (
          <div
            className={
              "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm text-neutral-600 dark:text-neutral-300"
            }
          >
            <UsersRoundIcon size={14} />
            {t("userGroups.membersCount", {
              count: row.original.users_count ?? 0,
            })}
          </div>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "policies_count",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              <AccessControlIcon size={12} />
              {t("userGroups.policies")}
            </DataTableHeader>
          );
        },
        cell: ({ row }) => (
          <div
            className={
              "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm text-neutral-600 dark:text-neutral-300"
            }
          >
            <AccessControlIcon size={12} />
            {t("userGroups.policiesCount", {
              count: row.original.policies_count ?? 0,
            })}
          </div>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "id",
        header: "",
        cell: ({ row }) => (
          <GroupProvider group={row.original} isDetailPage={false}>
            <GroupsActionCell
              group={row.original}
              inUse={
                (row.original.users_count ?? 0) > 0 ||
                (row.original.policies_count ?? 0) > 0
              }
              detailsPath={`/team/group?id=${row.original.id}`}
            />
          </GroupProvider>
        ),
      },
      {
        accessorKey: "search",
        accessorFn: (row) => removeAllSpaces(row.name),
        filterFn: "fuzzy",
      },
    ],
    [t],
  );
}

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function UserGroupsTable({ headingTarget }: Readonly<Props>) {
  const { data: groups, isLoading } = useGroupsUsage();
  const { t } = useI18n();
  const router = useRouter();
  const columns = useUserGroupsTableColumns();

  const userGroups = useMemo(
    () => groups?.filter((group) => group.type === GroupType.USER),
    [groups],
  );

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort/team-groups",
    [
      {
        id: "name",
        desc: false,
      },
    ],
  );

  return (
    <DataTable
      headingTarget={headingTarget}
      text={t("userGroups.title")}
      sorting={sorting}
      isLoading={isLoading}
      setSorting={setSorting}
      columns={columns}
      data={userGroups}
      initialPageSize={25}
      searchPlaceholder={t("userGroups.searchPlaceholder")}
      rightSide={() => (
        <AddGroupButton
          type={GroupType.USER}
          title={t("userGroups.createTitle")}
          buttonText={t("userGroups.createTitle")}
          description={t("userGroups.createDescription")}
          createdDescription={(name) =>
            t("userGroups.createdDescription", { name })
          }
          redirectPath={(group) => `/team/group?id=${group.id}`}
        />
      )}
      columnVisibility={{
        search: false,
      }}
      onRowClick={(row, cell) => {
        if (cell === "id") return;
        router.push(`/team/group?id=${row.original.id}`);
      }}
    />
  );
}
