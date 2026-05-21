"use client";

import Button from "@components/Button";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import { SmallBadge } from "@components/ui/SmallBadge";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { PlusIcon, RadioTowerIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { Relay } from "@/interfaces/Relay";
import DeployRelayModal from "@/modules/relays/DeployRelayModal";
import useFetchApi from "@/utils/api";

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function RelaysTable({ headingTarget }: Readonly<Props>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const path = usePathname();
  const [deployModal, setDeployModal] = React.useState(false);
  const { data: relays, isLoading } = useFetchApi<Relay[]>(
    "/relays",
    true,
    false,
    true,
    {
      shouldRetryOnError: false,
    },
  );

  const columns = useMemo<ColumnDef<Relay>[]>(
    () => [
      {
        id: "name",
        accessorFn: (relay) => relay.name || relay.id || relay.address,
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("relays.name")}</DataTableHeader>
        ),
        sortingFn: "text",
        cell: ({ row }) => (
          <div className={"flex items-center gap-3 min-w-[260px]"}>
            <SquareIcon
              icon={<RadioTowerIcon size={16} />}
              color={row.original.status === "online" ? "green" : "gray"}
              size={"small"}
              margin={"mt-0"}
            />
            <div className={"flex flex-col"}>
              <span className={"font-medium text-nb-gray-100"}>
                {row.original.name || row.original.id || row.original.address}
              </span>
              <span className={"text-xs text-nb-gray-400"}>
                {row.original.address}
              </span>
              {row.original.error && (
                <span className={"text-xs text-nb-gray-400 max-w-xl truncate"}>
                  {row.original.error}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("relays.id")}</DataTableHeader>
        ),
        cell: ({ row }) => row.original.id || t("common.unknown"),
      },
      {
        accessorKey: "observed_id",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.observedId")}
          </DataTableHeader>
        ),
        cell: ({ row }) => row.original.observed_id || t("common.unknown"),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("table.status")}</DataTableHeader>
        ),
        cell: ({ row }) => {
          const online = row.original.status === "online";
          return (
            <SmallBadge
              text={online ? t("relays.online") : t("relays.offline")}
              variant={online ? "green" : "yellow"}
              size={"md"}
            />
          );
        },
      },
      {
        accessorKey: "registered_clients",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.registeredClients")}
          </DataTableHeader>
        ),
        cell: ({ row }) => row.original.registered_clients,
      },
      {
        accessorKey: "last_checked",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("relays.lastChecked")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          row.original.last_checked
            ? new Date(row.original.last_checked).toLocaleString()
            : t("common.unknown"),
      },
      {
        id: "searchString",
        accessorFn: (row) =>
          `${row.name ?? ""} ${row.id ?? ""} ${row.observed_id ?? ""} ${
            row.address
          } ${row.status} ${row.error ?? ""}`,
      },
    ],
    [t],
  );

  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [{ id: "address", desc: false }],
  );

  const relayList = relays ?? [];

  return (
    <>
      <DataTable
        headingTarget={headingTarget}
        isLoading={isLoading}
        inset={false}
        keepStateInLocalStorage={false}
        text={t("relays.title")}
        sorting={sorting}
        setSorting={setSorting}
        columns={columns}
        data={relayList}
        searchPlaceholder={t("relays.searchPlaceholder")}
        columnVisibility={{ searchString: false }}
        getStartedCard={
          <GetStartedTest
            icon={
              <SquareIcon
                icon={
                  <RadioTowerIcon className={"text-nb-gray-200"} size={20} />
                }
                color={"gray"}
                size={"large"}
              />
            }
            title={t("relays.emptyTitle")}
            description={t("relays.emptyDescription")}
          />
        }
      >
        {(table) => (
          <>
            <Button
              variant={"primary"}
              size={"sm"}
              onClick={() => setDeployModal(true)}
            >
              <PlusIcon size={16} />
              {t("relays.deployButton")}
            </Button>
            <DataTableRowsPerPage
              table={table}
              disabled={relayList.length === 0}
            />
            <DataTableRefreshButton
              isDisabled={relayList.length === 0}
              onClick={() => {
                mutate("/relays").then();
              }}
            />
          </>
        )}
      </DataTable>
      <DeployRelayModal open={deployModal} onOpenChange={setDeployModal} />
    </>
  );
}
