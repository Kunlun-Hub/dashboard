"use client";

import ButtonGroup from "@components/ButtonGroup";
import { DatePickerWithRange } from "@components/DatePickerWithRange";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import { DataTableRowsPerPage } from "@components/table/DataTableRowsPerPage";
import GetStartedTest from "@components/ui/GetStartedTest";
import type {
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { Globe2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { useServerPagination } from "@/contexts/ServerPaginationProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NetworkLogEndpoint, NetworkLogUser } from "@/interfaces/NetworkLog";

type DNSLog = {
  id: string;
  timestamp: string;
  reporter_id: string;
  user: NetworkLogUser;
  device: NetworkLogEndpoint;
  source: NetworkLogEndpoint;
  destination: NetworkLogEndpoint;
  domain: string;
  query_type: string;
  answers?: string[] | string | null;
  rcode?: string | null;
};

type DNSLogRow = {
  id: string;
  timestamp: string;
  user: NetworkLogUser;
  device: NetworkLogEndpoint;
  domain: string;
  recordType: string;
  result: string;
};

const DNS_TYPES = ["A", "AAAA", "CNAME"];
const DNS_TYPE_SET = new Set(DNS_TYPES);

const normalizeList = (value?: string[] | string | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const endpointLabel = (endpoint: NetworkLogEndpoint) => {
  return endpoint.name || endpoint.dns_label || endpoint.address || "-";
};

const isAllowedDNSType = (type?: string | null) => {
  return DNS_TYPE_SET.has((type ?? "").trim().toUpperCase());
};

const hasDNSAnswers = (log: DNSLog) => normalizeList(log.answers).length > 0;

const shouldShowDNSLog = (log: DNSLog) => {
  if (!isAllowedDNSType(log.query_type)) return false;
  const rcode = log.rcode?.trim().toUpperCase();
  if (rcode === "NXDOMAIN") return false;
  return rcode !== "NOERROR" || hasDNSAnswers(log);
};

const dnsResult = (log: DNSLog) => {
  const answers = normalizeList(log.answers);
  if (answers.length > 0) return Array.from(new Set(answers)).join(", ");

  const rcode = log.rcode?.trim().toUpperCase();
  if (!rcode || rcode === "NOERROR") return "-";

  return rcode;
};

const toDNSRows = (logs?: DNSLog[]) => {
  return (logs ?? [])
    .filter(shouldShowDNSLog)
    .map((log) => {
      return {
        id: log.id,
        timestamp: log.timestamp,
        user: log.user,
        device: log.device || log.source,
        domain: log.domain || "-",
        recordType: log.query_type || "-",
        result: dnsResult(log),
      };
    })
    .sort(
      (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf(),
    );
};

type Props = {
  headingTarget?: HTMLHeadingElement | null;
};

export default function DNSLogsTable({ headingTarget }: Readonly<Props>) {
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
  } = useServerPagination<DNSLog[]>();

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

  const dnsTypeFilter = getFilter("dns_type") ?? "";

  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const rows = useMemo(() => toDNSRows(rawData), [rawData]);
  const columns = useMemo<ColumnDef<DNSLogRow>[]>(
    () => [
      {
        id: "timestamp",
        accessorFn: (row) => row.timestamp,
        header: ({ column }) => (
          <DataTableHeader column={column} name="timestamp">
            {t("dnsLogs.time")}
          </DataTableHeader>
        ),
        cell: ({ row }) =>
          dayjs(row.original.timestamp).format("YYYY/MM/DD HH:mm:ss"),
      },
      {
        id: "user",
        accessorFn: (row) => `${row.user.name} ${row.user.email}`.trim(),
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("dnsLogs.user")}</DataTableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.user.name || row.original.user.email}
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
        accessorFn: (row) => endpointLabel(row.device),
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("dnsLogs.device")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {endpointLabel(row.original.device)}
            </span>
            {row.original.device.address && (
              <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
                {row.original.device.address}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "domain",
        accessorFn: (row) => row.domain,
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("dnsLogs.domain")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.domain}</span>
        ),
      },
      {
        id: "recordType",
        accessorFn: (row) => row.recordType,
        header: ({ column }) => (
          <DataTableHeader column={column}>{t("dnsLogs.type")}</DataTableHeader>
        ),
        cell: ({ row }) => row.original.recordType,
      },
      {
        id: "result",
        accessorFn: (row) => row.result,
        header: ({ column }) => (
          <DataTableHeader column={column}>
            {t("dnsLogs.result")}
          </DataTableHeader>
        ),
        cell: ({ row }) => (
          <span className="break-all">{row.original.result}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      data={rows}
      headingTarget={headingTarget}
      isLoading={isLoading}
      inset={false}
      text={t("dnsLogs.title")}
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
      hasServerSideFilters={hasServerSideFilters}
      onFilterReset={onFilterReset}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      searchPlaceholder={t("dnsLogs.searchPlaceholder")}
      getStartedCard={
        <GetStartedTest
          icon={<Globe2 size={20} />}
          title={t("dnsLogs.emptyTitle")}
          description={t("dnsLogs.emptyDescription")}
        />
      }
      rightSide={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={dnsTypeFilter || "all"}
            onValueChange={(value) => {
              setFilter("dns_type", value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger
              className="h-10 w-[132px] bg-white dark:bg-nb-gray-930"
              aria-label={t("dnsLogs.typeFilter")}
            >
              <SelectValue placeholder={t("dnsLogs.typeFilter")} />
            </SelectTrigger>
            <SelectContent className="w-[132px]">
              <SelectItem value="all">{t("dnsLogs.allTypes")}</SelectItem>
              {DNS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateFilterChange}
          />
          <ButtonGroup>
            <DataTableRefreshButton
              isDisabled={isLoading}
              onClick={() => {
                mutate().then();
              }}
            />
            <DataTableRowsPerPage table={table} disabled={rows.length === 0} />
          </ButtonGroup>
        </div>
      )}
    />
  );
}
