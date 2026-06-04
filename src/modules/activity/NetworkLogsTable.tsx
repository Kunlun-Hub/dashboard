"use client";

import ButtonGroup from "@components/ButtonGroup";
import { DatePickerWithRange } from "@components/DatePickerWithRange";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ChevronDown, ChevronRightIcon } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import { useServerPagination } from "@/contexts/ServerPaginationProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NetworkLog, NetworkLogEndpoint } from "@/interfaces/NetworkLog";
import { Pagination } from "@/interfaces/Pagination";
import useFetchApi from "@/utils/api";

type NetworkLogFlowRow = NetworkLog & {
  id: string;
  latestTimestamp: string;
};

type NetworkLogClientGroup = {
  id: string;
  client_key: string;
  client: NetworkLogEndpoint;
  user: NetworkLog["user"];
  latest_timestamp: string;
  flow_count: number;
  rx_bytes: number;
  rx_packets: number;
  tx_bytes: number;
  tx_packets: number;
  protocols: number[];
  destinations: NetworkLogEndpoint[];
};

const endpointTypePeer = "PEER";
const endpointTypeHostResource = "HOST_RESOURCE";
const dnsPorts = new Set([53, 5353, 22054]);

const protocolName = (
  protocol: number,
  t: (
    key:
      | "networkLogs.protocol.icmp"
      | "networkLogs.protocol.tcp"
      | "networkLogs.protocol.udp"
      | "networkLogs.protocol.sctp",
  ) => string,
) => {
  switch (protocol) {
    case 1:
      return t("networkLogs.protocol.icmp");
    case 6:
      return t("networkLogs.protocol.tcp");
    case 17:
      return t("networkLogs.protocol.udp");
    case 132:
      return t("networkLogs.protocol.sctp");
    default:
      return String(protocol);
  }
};

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
};

const formatEndpoint = (endpoint: NetworkLogEndpoint) => {
  if (!endpoint.address) return endpoint.name || "-";
  return endpoint.name
    ? `${endpoint.name} (${endpoint.address})`
    : endpoint.address;
};

const formatDirection = (direction?: string | null) => {
  switch (direction?.toLowerCase()) {
    case "egress":
      return "out";
    case "ingress":
      return "in";
    default:
      return direction?.toLowerCase() || "-";
  }
};

const stripPort = (address?: string | null) => {
  if (!address) return "";
  const ipv6Match = address.match(/^\[(.*)]:(\d+)$/);
  if (ipv6Match) return ipv6Match[1];

  const lastColon = address.lastIndexOf(":");
  if (lastColon === -1) return address;

  const port = Number(address.slice(lastColon + 1));
  if (!Number.isFinite(port)) return address;

  return address.slice(0, lastColon);
};

const portFromAddress = (address?: string | null) => {
  if (!address) return undefined;
  const ipv6Match = address.match(/^\[.*]:(\d+)$/);
  if (ipv6Match) return Number(ipv6Match[1]);

  const lastColon = address.lastIndexOf(":");
  if (lastColon === -1) return undefined;

  const port = Number(address.slice(lastColon + 1));
  return Number.isFinite(port) ? port : undefined;
};

const isMulticastOrBroadcastAddress = (address?: string | null) => {
  const host = stripPort(address).toLowerCase();
  return (
    host.startsWith("224.") ||
    host.startsWith("239.") ||
    host.startsWith("255.255.255.255") ||
    host.startsWith("ff")
  );
};

const hasDNSMetadata = (log: NetworkLog) => {
  return Boolean(
    log.dns ||
      log.dns_domain ||
      log.dns_query ||
      log.dns_query_name ||
      log.dns_answers ||
      log.dns_resolved_ips ||
      log.dns_result,
  );
};

const isDNSPortFlow = (log: NetworkLog) => {
  const sourcePort = log.source_port ?? portFromAddress(log.source.address);
  const destinationPort =
    log.destination_port ??
    log.dest_port ??
    portFromAddress(log.destination.address);

  return (
    log.protocol === 17 &&
    ((sourcePort !== undefined && dnsPorts.has(sourcePort)) ||
      (destinationPort !== undefined && dnsPorts.has(destinationPort)))
  );
};

const isNetworkAccessFlow = (log: NetworkLog) => {
  if (hasDNSMetadata(log) || isDNSPortFlow(log)) return false;
  if (log.source.address === log.destination.address) return false;
  if (
    log.source.id &&
    log.destination.id &&
    log.source.id === log.destination.id
  )
    return false;
  if (
    isMulticastOrBroadcastAddress(log.source.address) ||
    isMulticastOrBroadcastAddress(log.destination.address)
  ) {
    return false;
  }

  const isPeerSource = log.source.type === endpointTypePeer;
  const isPeerDestination = log.destination.type === endpointTypePeer;
  const isResourceSource = log.source.type === endpointTypeHostResource;
  const isResourceDestination =
    log.destination.type === endpointTypeHostResource;

  return (
    (isPeerSource && (isPeerDestination || isResourceDestination)) ||
    (isPeerDestination && (isPeerSource || isResourceSource))
  );
};

const latestEventTimestamp = (log: NetworkLog) =>
  log.events[0]?.timestamp ?? "";

const hasTraffic = (log: NetworkLog) =>
  log.tx_packets > 0 ||
  log.rx_packets > 0 ||
  log.tx_bytes > 0 ||
  log.rx_bytes > 0;

const mergeFlowEvents = (logs?: NetworkLog[]) => {
  const flows = new Map<string, NetworkLog>();

  for (const log of logs ?? []) {
    if (!isNetworkAccessFlow(log)) continue;

    const existing = flows.get(log.flow_id);
    if (!existing) {
      flows.set(log.flow_id, {
        ...log,
        events: [...log.events].sort(
          (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf(),
        ),
      });
      continue;
    }

    existing.events = [...existing.events, ...log.events].sort(
      (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf(),
    );
    existing.tx_bytes = Math.max(existing.tx_bytes, log.tx_bytes);
    existing.rx_bytes = Math.max(existing.rx_bytes, log.rx_bytes);
    existing.tx_packets = Math.max(existing.tx_packets, log.tx_packets);
    existing.rx_packets = Math.max(existing.rx_packets, log.rx_packets);
  }

  return Array.from(flows.values()).filter(hasTraffic);
};

const buildFlowRows = (logs?: NetworkLog[]): NetworkLogFlowRow[] => {
  return mergeFlowEvents(logs)
    .map((log) => ({
      ...log,
      id: log.flow_id,
      latestTimestamp: latestEventTimestamp(log),
    }))
    .sort(
      (a, b) =>
        dayjs(b.latestTimestamp).valueOf() - dayjs(a.latestTimestamp).valueOf(),
    );
};

const renderEventTimeline = (log: NetworkLog) => {
  if (!log.events.length) return "-";
  return log.events
    .map(
      (event) => `${dayjs(event.timestamp).format("HH:mm:ss")} ${event.type}`,
    )
    .join(" / ");
};

const buildGroupFlowsUrl = (
  clientKey: string,
  filters: Record<string, string | undefined>,
) => {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("page_size", "10000");
  params.set("client_key", clientKey);
  params.set("network_only", "true");
  params.set("aggregate_flows", "true");
  params.set("sort_by", "timestamp");
  params.set("sort_order", "desc");

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, value);
    }
  });

  return `/events/network-traffic/group-flows?${params.toString()}`;
};

function NetworkLogDetails({
  group,
  filters,
}: Readonly<{
  group: NetworkLogClientGroup;
  filters: Record<string, string | undefined>;
}>) {
  const { t } = useI18n();
  const { data: response, isLoading } = useFetchApi<Pagination<NetworkLog[]>>(
    buildGroupFlowsUrl(group.client_key, filters),
    false,
    true,
    Boolean(group.client_key),
  );
  const flowData = useMemo(() => buildFlowRows(response?.data), [response]);

  return (
    <div className="border-y border-neutral-200 bg-neutral-50 px-8 py-5 dark:border-nb-gray-900 dark:bg-nb-gray-950/60">
      <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("networkLogs.client")}
          </div>
          <div className="mt-1 text-neutral-900 dark:text-white">
            {formatEndpoint(group.client)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("networkLogs.user")}
          </div>
          <div className="mt-1 text-neutral-900 dark:text-white">
            {group.user.name || group.user.email || "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("networkLogs.packets")}
          </div>
          <div className="mt-1 text-neutral-900 dark:text-white">
            {t("networkLogs.tx")} {group.tx_packets} / {t("networkLogs.rx")}{" "}
            {group.rx_packets}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("networkLogs.totalTraffic")}
          </div>
          <div className="mt-1 text-neutral-900 dark:text-white">
            {t("networkLogs.tx")} {formatBytes(group.tx_bytes)} /{" "}
            {t("networkLogs.rx")} {formatBytes(group.rx_bytes)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-nb-gray-900">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-neutral-100 text-xs text-neutral-500 dark:bg-nb-gray-930 dark:text-nb-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">{t("networkLogs.time")}</th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.protocol")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.direction")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.source")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.destination")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.packets")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.traffic")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("networkLogs.events")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-neutral-200 text-neutral-700 dark:border-nb-gray-900 dark:text-nb-gray-100">
                <td className="px-4 py-3" colSpan={8}>
                  Loading...
                </td>
              </tr>
            ) : (
              flowData.map((log) => (
                <tr
                  key={log.flow_id}
                  className="border-t border-neutral-200 text-neutral-700 dark:border-nb-gray-900 dark:text-nb-gray-100"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {dayjs(log.latestTimestamp).format("YYYY/MM/DD HH:mm:ss")}
                  </td>
                  <td className="px-4 py-3">{protocolName(log.protocol, t)}</td>
                  <td className="px-4 py-3">
                    {formatDirection(log.direction)}
                  </td>
                  <td className="px-4 py-3">{formatEndpoint(log.source)}</td>
                  <td className="px-4 py-3">
                    {formatEndpoint(log.destination)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {t("networkLogs.tx")} {log.tx_packets} /{" "}
                    {t("networkLogs.rx")} {log.rx_packets}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {t("networkLogs.tx")} {formatBytes(log.tx_bytes)} /{" "}
                    {t("networkLogs.rx")} {formatBytes(log.rx_bytes)}
                  </td>
                  <td className="px-4 py-3">{renderEventTimeline(log)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function NetworkLogsTable({ headingTarget }: Readonly<Props>) {
  const { t } = useI18n();
  const {
    data: rawData,
    isLoading,
    mutate,
    setFilter,
    getFilter,
    pagination,
    onPaginationChange,
    pageCount,
    totalRecords,
    globalFilter,
    onGlobalFilterChange,
    hasServerSideFilters,
    onFilterReset,
  } = useServerPagination<NetworkLogClientGroup[]>();

  const dateRange = useMemo<DateRange | undefined>(() => {
    const startDate = getFilter("start_date");
    const endDate = getFilter("end_date");
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate ? dayjs(startDate).toDate() : undefined,
      to: endDate ? dayjs(endDate).toDate() : undefined,
    };
  }, [getFilter]);

  const handleDateFilterChange = useCallback(
    (range?: DateRange) => {
      setFilter(
        "start_date",
        range?.from ? dayjs(range.from).toISOString() : undefined,
      );
      setFilter(
        "end_date",
        range?.to ? dayjs(range.to).toISOString() : undefined,
      );
    },
    [setFilter],
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const detailFilters = useMemo(
    () => ({
      start_date: getFilter("start_date"),
      end_date: getFilter("end_date"),
      network_only: getFilter("network_only"),
      sort_by: getFilter("sort_by"),
      sort_order: getFilter("sort_order"),
    }),
    [getFilter],
  );
  const groupData = useMemo(() => rawData ?? [], [rawData]);
  const columns = useMemo<ColumnDef<NetworkLogClientGroup>[]>(
    () => [
      {
        id: "expand",
        header: "",
        enableSorting: false,
        cell: () => (
          <div className="flex items-center text-neutral-500 dark:text-nb-gray-300">
            <ChevronRightIcon
              size={16}
              className="group-data-[accordion=opened]/accordion:hidden shrink-0"
            />
            <ChevronDown
              size={16}
              className="group-data-[accordion=closed]/accordion:hidden shrink-0"
            />
          </div>
        ),
      },
      {
        id: "timestamp",
        accessorFn: (row) => row.latest_timestamp,
        header: ({ column }) => (
          <DataTableHeader column={column} name="timestamp">
            {t("networkLogs.latestTime")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          dayjs(row.original.latest_timestamp).format("YYYY/MM/DD HH:mm:ss"),
      },
      {
        id: "user",
        accessorFn: (row) => `${row.user.name} ${row.user.email}`.trim(),
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("networkLogs.user")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.user.name || row.original.user.email || "-"}
            </span>
            {row.original.user.name && (
              <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
                {row.original.user.email}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "device",
        accessorFn: (row) => formatEndpoint(row.client),
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("networkLogs.client")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.client.name || row.original.client.address}
            </span>
            {row.original.client.name && (
              <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
                {row.original.client.address}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "protocol",
        accessorFn: (row) =>
          row.protocols.map((protocol) => protocolName(protocol, t)).join(", "),
        header: ({ column }) => (
          <DataTableHeader column={column} name="protocol">
            {t("networkLogs.protocol")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          row.original.protocols
            .map((protocol) => protocolName(protocol, t))
            .join(", "),
      },
      {
        id: "destinations",
        accessorFn: (row) =>
          row.destinations
            .map((destination) => formatEndpoint(destination))
            .join(" "),
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("networkLogs.destination")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[420px] truncate">
            {row.original.destinations
              .slice(0, 3)
              .map((destination) => formatEndpoint(destination))
              .join(", ")}
            {row.original.destinations.length > 3 &&
              t("networkLogs.moreDestinations", {
                count: row.original.destinations.length - 3,
              })}
          </div>
        ),
      },
      {
        id: "flowCount",
        accessorKey: "flow_count",
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("networkLogs.flowCount")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          t("networkLogs.flowCountValue", { count: row.original.flow_count }),
      },
      {
        id: "traffic",
        accessorFn: (row) => row.tx_bytes + row.rx_bytes,
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("networkLogs.traffic")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          `${t("networkLogs.tx")} ${formatBytes(row.original.tx_bytes)} / ${t(
            "networkLogs.rx",
          )} ${formatBytes(row.original.rx_bytes)}`,
      },
    ],
    [t],
  );

  return (
    <DataTable
      data={groupData}
      headingTarget={headingTarget}
      isLoading={isLoading}
      inset={false}
      text={t("networkLogs.title")}
      sorting={sorting}
      setSorting={setSorting}
      columns={columns}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageCount={pageCount}
      totalRecords={totalRecords}
      manualPagination={true}
      serverSidePagination={true}
      keepStateInLocalStorage={false}
      manualFiltering={true}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      hasServerSideFilters={hasServerSideFilters}
      onFilterReset={onFilterReset}
      searchPlaceholder={t("networkLogs.searchPlaceholder")}
      renderExpandedRow={(group) => (
        <NetworkLogDetails group={group} filters={detailFilters} />
      )}
      getStartedCard={
        <GetStartedTest
          icon={<ActivityIcon size={20} />}
          title={t("networkLogs.emptyTitle")}
          description={t("networkLogs.emptyDescription")}
        />
      }
      rightSide={(table) => (
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateFilterChange}
          />
          <ButtonGroup>
            <DataTableRefreshButton
              isDisabled={groupData.length === 0 || isLoading}
              onClick={() => {
                mutate().then();
              }}
            />
            <DataTableRowsPerPage
              table={table}
              disabled={groupData.length === 0}
              rowsSelection={[20, 50, 100, 200]}
            />
          </ButtonGroup>
        </div>
      )}
    />
  );
}
