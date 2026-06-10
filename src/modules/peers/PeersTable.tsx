import Button from "@components/Button";
import { Checkbox } from "@components/Checkbox";
import FullTooltip from "@components/FullTooltip";
import { NoPeersGettingStarted } from "@components/NoPeersGettingStarted";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  CheckboxListPicker,
  CheckboxOption,
  formatCheckboxChip,
} from "@components/table/filters/CheckboxListPicker";
import {
  formatGroupsChip,
  GroupsPicker,
} from "@components/table/filters/GroupsPicker";
import {
  formatStatusChip,
  StatusPicker,
} from "@components/table/filters/StatusPicker";
import {
  formatUsersChip,
  UserOption,
  UsersPicker,
} from "@components/table/filters/UsersPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import AddPeerButton from "@components/ui/AddPeerButton";
import { NotificationCountBadge } from "@components/ui/NotificationCountBadge";
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { removeAllSpaces } from "@utils/helpers";
import { trim, uniqBy } from "lodash";
import { MonitorDotIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import PeerProvider from "@/contexts/PeerProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getOperatingSystem } from "@/hooks/useOperatingSystem";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { Peer } from "@/interfaces/Peer";
import PeerActionCell from "@/modules/peers/PeerActionCell";
import PeerAddressCell from "@/modules/peers/PeerAddressCell";
import PeerGroupCell from "@/modules/peers/PeerGroupCell";
import PeerLastSeenCell from "@/modules/peers/PeerLastSeenCell";
import { PeerMultiSelect } from "@/modules/peers/PeerMultiSelect";
import PeerNameCell from "@/modules/peers/PeerNameCell";
import { PeerOSCell } from "@/modules/peers/PeerOSCell";
import {
  canShowPeerActions,
  filterPeersForTable,
  getPeersTableColumnVisibility,
  peerSearchIndex,
  PeersTableKind,
  shouldShowAddPeerButton,
  shouldShowPeerMultiSelect,
  shouldShowPendingApprovalFilter,
} from "@/modules/peers/PeersTable.helpers";
import PeerStatusCell from "@/modules/peers/PeerStatusCell";
import PeerVersionCell from "@/modules/peers/PeerVersionCell";
import { SmallUserAvatar } from "@/modules/users/SmallUserAvatar";

// Stable key per OS family for the filter column. Mirrors the icon
// selection in PeerOSCell so the chip label and the displayed OS icon
// always agree.
function peerOsKey(os: string | undefined): string {
  const kind = getOperatingSystem(os || "");
  switch (kind) {
    case OperatingSystem.WINDOWS:
      return "windows";
    case OperatingSystem.APPLE:
      return "mac";
    case OperatingSystem.ANDROID:
      return "android";
    case OperatingSystem.IOS:
      return "ios";
    default:
      return "linux";
  }
}

const createPeersTableColumns = (
  t: ReturnType<typeof useI18n>["t"],
): ColumnDef<Peer>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className={"min-w-[20px] max-w-[20px]"}>
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label={t("table.selectAll")}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className={"min-w-[20px] max-w-[20px]"}>
        <Checkbox
          checked={row.getIsSelected()}
          variant={"tableCell"}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("table.selectRow")}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorFn: (peer) => `${peer?.name}${peer?.dns_label}`,
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.name")}</DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => <PeerNameCell peer={row.original} />,
  },
  {
    id: "search_index",
    accessorFn: peerSearchIndex,
  },
  {
    id: "owner",
    accessorFn: (peer) =>
      [peer.user?.name, peer.user?.email, peer.user_id]
        .filter(Boolean)
        .join(" "),
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.user")}</DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => {
      const user = row.original.user;
      const fallback = row.original.user_id || t("common.unknown");
      const name = user?.name || user?.email || fallback;
      return (
        <div className={"flex max-w-[260px] items-center gap-3 px-3 py-2"}>
          <SmallUserAvatar
            name={user?.name}
            email={user?.email}
            id={user?.id || row.original.user_id}
            className={"h-8 w-8"}
          />
          <div className={"min-w-0"}>
            <div
              className={
                "truncate text-sm font-medium text-neutral-900 dark:text-neutral-100"
              }
            >
              {name}
            </div>
            {user?.email && user.email !== name && (
              <div
                className={
                  "truncate text-xs text-neutral-500 dark:text-nb-gray-400"
                }
              >
                {user.email}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "approval_required",
    accessorKey: "approval_required",
    sortingFn: "basic",
    accessorFn: (peer) => peer.approval_required,
  },
  {
    id: "connected",
    accessorKey: "connected",
    accessorFn: (peer) => peer.connected,
  },
  {
    accessorKey: "ip",
    sortingFn: "text",
  },
  {
    id: "user_name",
    accessorFn: (peer) => (peer.user ? peer.user?.name : t("common.unknown")),
  },
  {
    id: "user_email",
    accessorFn: (peer) => (peer.user ? peer.user?.email : t("common.unknown")),
    filterFn: "equalsString",
  },
  {
    id: "dns_label",
    accessorKey: "dns_label",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("peerDetails.netbirdIpAddress")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => <PeerAddressCell peer={row.original} />,
  },
  {
    accessorKey: "group_name_strings",
    accessorFn: (peer) => peer.groups?.map((g) => g?.name || "").join(", "),
    sortingFn: "text",
  },
  {
    accessorKey: "group_names",
    accessorFn: (peer) => peer.groups?.map((g) => g?.name || ""),
    sortingFn: "text",
    filterFn: "arrIncludesSome",
  },
  {
    accessorFn: (peer) => peer.groups?.length,
    id: "groups",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("groups.title")}</DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <PeerProvider peer={row.original}>
        <PeerGroupCell />
      </PeerProvider>
    ),
  },
  {
    accessorKey: "last_seen",
    header: ({ column, table }) => {
      return (
        <DataTableHeader
          column={column}
          onSort={() => {
            const desc = column.getIsSorted() === "desc";
            table.setSorting([{ id: "last_seen", desc: !desc }]);
          }}
        >
          {t("peerDetails.lastSeen")}
        </DataTableHeader>
      );
    },
    sortingFn: "datetime",
    cell: ({ row }) => <PeerLastSeenCell peer={row.original} />,
  },
  {
    id: "os",
    accessorFn: (peer) => removeAllSpaces(peer?.os),
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("peerDetails.operatingSystem")}
        </DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <PeerOSCell os={row.original.os} serial={row.original.serial_number} />
    ),
  },
  {
    id: "os_kind",
    accessorFn: (peer) => peerOsKey(peer.os),
    filterFn: "arrIncludesSome",
  },
  {
    id: "serial",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>
          {t("peerDetails.serialNumber")}
        </DataTableHeader>
      );
    },
    accessorFn: (peer) => peer.serial_number,
    sortingFn: "text",
  },
  {
    accessorKey: "version",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.version")}</DataTableHeader>
      );
    },
    cell: ({ row }) => (
      <PeerVersionCell
        version={row.original.version}
        os={row.original.os}
        serial={row.original.serial_number}
        ephemeral={row.original.ephemeral}
      />
    ),
  },
  {
    id: "status",
    accessorFn: (peer) => {
      let statusCount = 0;
      if (peer.login_expired) statusCount++;
      if (peer.approval_required) statusCount++;
      return statusCount;
    },
    header: () => {
      return "";
    },
    sortingFn: "text",
    cell: ({ row }) => (
      <PeerProvider peer={row.original}>
        <PeerStatusCell peer={row.original} />
      </PeerProvider>
    ),
  },
  {
    id: "actions",
    accessorKey: "id",
    header: "",
    cell: ({ row }) => (
      <PeerProvider peer={row.original}>
        <PeerActionCell />
      </PeerProvider>
    ),
  },
  {
    id: "ipv6",
    accessorFn: (row) => row.ipv6,
  },
];

type Props = {
  peers?: Peer[];
  isLoading: boolean;
  headingTarget?: HTMLHeadingElement | null;
  kind?: PeersTableKind;
  pendingOnly?: boolean;
};

export default function PeersTable({
  peers,
  isLoading,
  headingTarget,
  kind,
  pendingOnly = false,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const path = usePathname();
  const canShowActions = canShowPeerActions(permission);
  const columns = useMemo(() => createPeersTableColumns(t), [t]);
  const columnVisibility = useMemo(
    () => getPeersTableColumnVisibility(permission, pendingOnly),
    [permission, pendingOnly],
  );

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort" + path,
    [
      {
        id: "last_seen",
        desc: true,
      },
      {
        id: "name",
        desc: false,
      },
    ],
  );

  const kindFilteredPeers = useMemo(
    () => filterPeersForTable(peers, kind, pendingOnly),
    [peers, kind, pendingOnly],
  );

  const pendingApprovalCount =
    kindFilteredPeers?.filter((p) => p.approval_required).length || 0;

  const tableGroups = useMemo(
    () =>
      (uniqBy(
        kindFilteredPeers
          ?.map((p) => p.groups?.map((g) => g))
          .flatMap((g) => g),
        "name",
      ) as Group[]) || ([] as Group[]),
    [kindFilteredPeers],
  );

  // Users derived from the current kind-filtered set, so the Users
  // filter offers only owners that actually appear in the table.
  const tableUsers = useMemo<UserOption[]>(() => {
    if (!kindFilteredPeers) return [];
    const map = new Map<string, UserOption>();
    kindFilteredPeers.forEach((p) => {
      if (!p.user || !p.user.email) return;
      map.set(p.user.id, {
        id: p.user.id,
        name: p.user.name || p.user.email,
        email: p.user.email,
      });
    });
    return Array.from(map.values());
  }, [kindFilteredPeers]);

  const { isUser } = useLoggedInUser();

  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  const resetSelectedRows = () => {
    if (Object.keys(selectedRows).length > 0) {
      setSelectedRows({});
    }
  };

  const [showBrowserPeers, setShowBrowserPeers] = useState(false);

  const withBrowserPeers = useCallback(
    (condition: boolean) => {
      const isWebClient = (peer: Peer) => {
        return trim(peer?.os) == "js" || peer.kernel_version === "wasm";
      };

      return (
        kindFilteredPeers?.filter((peer) =>
          condition ? isWebClient(peer) : !isWebClient(peer),
        ) ?? []
      );
    },
    [kindFilteredPeers],
  );

  const browserPeers = useMemo(() => {
    return withBrowserPeers(true);
  }, [withBrowserPeers]);

  const regularPeers = useMemo(() => {
    return withBrowserPeers(false);
  }, [withBrowserPeers]);

  useEffect(() => {
    if (showBrowserPeers && browserPeers?.length === 0) {
      setShowBrowserPeers(false);
    }
  }, [showBrowserPeers, browserPeers]);

  // Operating system options. Same set as the OS icons rendered in
  // PeerOSCell — we don't expose FreeBSD / Docker as separate filter
  // entries since they fold into Linux for the chosen icon.
  const osOptions = useMemo<CheckboxOption<string>[]>(
    () => [
      { value: "linux", label: "Linux" },
      { value: "windows", label: "Windows" },
      { value: "mac", label: "macOS" },
      { value: "android", label: "Android" },
      { value: "ios", label: "iOS" },
    ],
    [],
  );

  // Filter definitions powering the consolidated `Filters` button +
  // chip row. The Users filter is only meaningful for the User Devices
  // view; servers (no real owner) skip it.
  const filterDefs = useMemo<TableFilterDef[]>(() => {
    const defs: TableFilterDef[] = [
      {
        id: "connected",
        label: t("common.status"),
        renderPicker: (p) => (
          <StatusPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
          />
        ),
        formatChip: (v) => formatStatusChip(v as boolean | undefined, t),
      },
      {
        id: "os_kind",
        label: t("peerDetails.operatingSystem"),
        renderPicker: (p) => (
          <CheckboxListPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            options={osOptions}
          />
        ),
        formatChip: (v) =>
          formatCheckboxChip(v as string[] | undefined, osOptions, "platforms"),
      },
    ];
    if (!isUser) {
      defs.push({
        id: "group_names",
        label: t("groups.title"),
        renderPicker: (p) => (
          <GroupsPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            groups={tableGroups}
          />
        ),
        formatChip: (v) => formatGroupsChip(v as string[] | undefined, t),
      });
    }
    if (kind === "users" && !isUser && tableUsers.length > 0) {
      defs.push({
        id: "user_email",
        label: t("users.title"),
        renderPicker: (p) => (
          <UsersPicker
            value={p.value as string | undefined}
            onChange={p.onChange}
            close={p.close}
            options={tableUsers}
          />
        ),
        formatChip: (v) => formatUsersChip(v as string | undefined, tableUsers),
      });
    }
    return defs;
  }, [isUser, kind, osOptions, t, tableGroups, tableUsers]);

  return (
    <>
      {shouldShowPeerMultiSelect(pendingOnly) && (
        <PeerMultiSelect
          selectedPeers={selectedRows}
          onCanceled={() => setSelectedRows({})}
        />
      )}
      <DataTable
        headingTarget={headingTarget}
        rowSelection={selectedRows}
        setRowSelection={setSelectedRows}
        useRowId={true}
        text={pendingOnly ? t("peers.pendingApprovalTitle") : t("peers.title")}
        sorting={sorting}
        setSorting={setSorting}
        initialPageSize={25}
        showResetFilterButton={false}
        columns={columns}
        data={showBrowserPeers ? browserPeers : regularPeers}
        searchPlaceholder={
          pendingOnly
            ? t("peers.pendingApprovalSearchPlaceholder")
            : t("peers.searchPlaceholder")
        }
        columnVisibility={columnVisibility}
        isLoading={isLoading}
        getStartedCard={
          pendingOnly ? (
            <div
              className={
                "flex min-h-[18rem] flex-col items-center justify-center gap-2 text-center text-neutral-500 dark:text-nb-gray-300"
              }
            >
              <div
                className={
                  "text-base font-medium text-neutral-900 dark:text-neutral-100"
                }
              >
                {t("peers.noPendingApprovalsTitle")}
              </div>
              <div className={"max-w-md text-sm"}>
                {t("peers.noPendingApprovalsDescription")}
              </div>
            </div>
          ) : (
            <NoPeersGettingStarted
              showBackground={true}
              isUserDevice={kind ? kind === "users" : undefined}
            />
          )
        }
        rightSide={() => (
          <>
            {shouldShowAddPeerButton(peers, pendingOnly) && (
              <AddPeerButton isUserDevice={kind === "users"} />
            )}
          </>
        )}
        aboveTable={(table) => (
          <TableFilterChips table={table} filters={filterDefs} />
        )}
      >
        {(table) => (
          <>
            <TableFiltersButton
              table={table}
              filters={filterDefs}
              disabled={peers?.length == 0}
            />

            <DataTableResetFilterButton
              table={table}
              onClick={() => {
                table.setPageIndex(0);
                table.resetColumnFilters();
                table.resetGlobalFilter();
                resetSelectedRows();
              }}
            />

            {shouldShowPendingApprovalFilter(
              pendingApprovalCount,
              pendingOnly,
            ) && (
              <Button
                disabled={peers?.length == 0}
                onClick={() => {
                  table.setPageIndex(0);
                  let current =
                    table.getColumn("approval_required")?.getFilterValue() ===
                    undefined
                      ? true
                      : undefined;

                  table.setColumnFilters([
                    {
                      id: "connected",
                      value: undefined,
                    },
                    {
                      id: "approval_required",
                      value: current,
                    },
                  ]);

                  resetSelectedRows();
                }}
                variant={
                  table.getColumn("approval_required")?.getFilterValue() ===
                  true
                    ? "tertiary"
                    : "secondary"
                }
              >
                {t("peers.pendingApprovals")}
                <NotificationCountBadge count={pendingApprovalCount} />
              </Button>
            )}

            {browserPeers?.length > 0 && (
              <FullTooltip
                content={
                  <div className={"max-w-sm text-xs"}>
                    {t("peers.browserPeersTooltip")}
                  </div>
                }
              >
                <Button
                  className={"h-[44px]"}
                  variant={showBrowserPeers ? "tertiary" : "secondary"}
                  onClick={() => {
                    setShowBrowserPeers(!showBrowserPeers);
                  }}
                >
                  <MonitorDotIcon size={16} />
                </Button>
              </FullTooltip>
            )}

            <DataTableRefreshButton
              isDisabled={peers?.length == 0}
              onClick={() => {
                if (!isUser) mutate("/groups").then();
                mutate("/users").then();
                mutate("/peers").then();
              }}
            />
          </>
        )}
      </DataTable>
    </>
  );
}
