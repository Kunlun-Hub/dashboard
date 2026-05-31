"use client";

import Button from "@components/Button";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import { IconSettings2 } from "@tabler/icons-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi from "@utils/api";
import { PlusCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { User } from "@/interfaces/User";
import {
  ResourceLimitTooltip,
  useResourceLimit,
} from "@/modules/account/ResourceUsage";
import ServiceUserModal from "@/modules/users/ServiceUserModal";
import ServiceUserNameCell from "@/modules/users/table-cells/ServiceUserNameCell";
import UserActionCell from "@/modules/users/table-cells/UserActionCell";
import UserRoleCell from "@/modules/users/table-cells/UserRoleCell";
import UserStatusCell from "@/modules/users/table-cells/UserStatusCell";

function useServiceUsersTableColumns(): ColumnDef<User>[] {
  const { t } = useI18n();

  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>{t("table.name")}</DataTableHeader>
          );
        },
        sortingFn: "text",
        cell: ({ row }) => <ServiceUserNameCell user={row.original} />,
      },
      {
        accessorKey: "is_current",
        sortingFn: "basic",
      },
      {
        accessorKey: "role",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>{t("table.role")}</DataTableHeader>
          );
        },
        sortingFn: "text",
        cell: ({ row }) => <UserRoleCell user={row.original} />,
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <DataTableHeader column={column}>
              {t("table.status")}
            </DataTableHeader>
          );
        },
        sortingFn: "text",
        cell: ({ row }) => <UserStatusCell user={row.original} />,
      },
      {
        accessorKey: "id",
        header: "",
        sortingFn: "text",
        cell: ({ row }) => (
          <UserActionCell user={row.original} serviceUser={true} />
        ),
      },
    ],
    [t],
  );
}

type Props = {
  users?: User[];
  isLoading?: boolean;
  headingTarget?: HTMLHeadingElement | null;
};

export default function ServiceUsersTable({
  users,
  isLoading,
  headingTarget,
}: Readonly<Props>) {
  useFetchApi("/groups");
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const path = usePathname();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const columns = useServiceUsersTableColumns();

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "is_current",
        desc: true,
      },
      {
        id: "name",
        desc: true,
      },
    ],
  );

  return (
    <DataTable
      headingTarget={headingTarget}
      isLoading={isLoading}
      text={t("serviceUsers.title")}
      sorting={sorting}
      setSorting={setSorting}
      columns={columns}
      data={users}
      onRowClick={(row) => {
        router.push(`/team/user?id=${row.original.id}&service_user=true`);
      }}
      rowClassName={"cursor-pointer"}
      columnVisibility={{
        is_current: false,
      }}
      searchPlaceholder={t("serviceUsers.searchPlaceholder")}
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={<IconSettings2 size={24} />}
              color={"gray"}
              size={"large"}
            />
          }
          title={t("serviceUsers.createTitle")}
          description={t("serviceUsers.emptyDescription")}
          button={
            <div className={"flex flex-col"}>
              <div>
                <ServiceUserCreateButton />
              </div>
            </div>
          }
        />
      }
      rightSide={() => (
        <>
          {users && users?.length > 0 && (
            <ServiceUserCreateButton className={"ml-auto"} />
          )}
        </>
      )}
    >
      {(table) => (
        <>
          <DataTableRowsPerPage table={table} disabled={users?.length == 0} />
          <DataTableRefreshButton
            isDisabled={users?.length == 0}
            onClick={() => {
              mutate("/users?service_user=true");
              mutate("/groups");
            }}
          />
        </>
      )}
    </DataTable>
  );
}

function ServiceUserCreateButton({
  className,
}: Readonly<{ className?: string }>) {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const userLimit = useResourceLimit("users");
  const disabled = !permission.users.create || userLimit.exhausted;
  const button = (
    <Button
      variant={"primary"}
      className={userLimit.exhausted ? undefined : className}
      data-cy={"open-service-user-modal"}
      disabled={disabled}
    >
      <PlusCircle size={16} />
      {t("serviceUsers.createTitle")}
    </Button>
  );

  if (userLimit.exhausted) {
    return (
      <ResourceLimitTooltip limitState={userLimit} className={className}>
        {button}
      </ResourceLimitTooltip>
    );
  }

  return <ServiceUserModal>{button}</ServiceUserModal>;
}
