"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import useFetchApi from "@utils/api";
import { formatBytes } from "@utils/helpers";
import * as d3 from "d3";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { NetworkLog } from "@/interfaces/NetworkLog";
import { Pagination } from "@/interfaces/Pagination";

type RangeValue = "6h" | "12h" | "24h" | "3d" | "7d";

type TrafficPoint = {
  timestamp: Date;
  uploadRate: number;
  downloadRate: number;
};

const WIDTH = 1320;
const HEIGHT = 380;
const MARGIN = { top: 28, right: 24, bottom: 46, left: 64 };

const rangeOptions: Array<{ value: RangeValue; hours: number; labelKey: string }> = [
  { value: "6h", hours: 6, labelKey: "overview.last6Hours" },
  { value: "12h", hours: 12, labelKey: "overview.last12Hours" },
  { value: "24h", hours: 24, labelKey: "overview.last24Hours" },
  { value: "3d", hours: 72, labelKey: "overview.last3Days" },
  { value: "7d", hours: 168, labelKey: "overview.last7Days" },
];

const bucketSecondsForHours = (hours: number) => {
  if (hours <= 6) return 5 * 60;
  if (hours <= 12) return 10 * 60;
  if (hours <= 24) return 20 * 60;
  if (hours <= 72) return 60 * 60;
  return 2 * 60 * 60;
};

const eventTimestamp = (log: NetworkLog) => {
  return log.events?.[0]?.timestamp ?? "";
};

const formatRate = (bytesPerSecond: number) => {
  return `${formatBytes(bytesPerSecond, bytesPerSecond >= 1024 * 1024 ? 2 : 1)}/s`;
};

const formatTotal = (bytes: number) => formatBytes(bytes, bytes >= 1024 * 1024 ? 2 : 1);

export function RelayTrafficStats() {
  const { t } = useI18n();
  const [range, setRange] = React.useState<RangeValue>("6h");
  const selectedRange = rangeOptions.find((option) => option.value === range) ?? rangeOptions[0];
  const endDate = useMemo(() => dayjs(), [range]);
  const startDate = useMemo(
    () => endDate.subtract(selectedRange.hours, "hour"),
    [endDate, selectedRange.hours],
  );

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page_size", "1000");
    params.set("start_date", startDate.toISOString());
    params.set("end_date", endDate.toISOString());
    params.set("sort_by", "timestamp");
    params.set("sort_order", "asc");
    return `/events/network-traffic?${params.toString()}`;
  }, [endDate, startDate]);

  const { data: response, isLoading } = useFetchApi<Pagination<NetworkLog[]>>(apiUrl, false, true, true, {
    refreshInterval: 30_000,
  });

  const { points, totals, peaks } = useMemo(() => {
    const bucketSeconds = bucketSecondsForHours(selectedRange.hours);
    const bucketMs = bucketSeconds * 1000;
    const buckets = new Map<number, { upload: number; download: number }>();
    const startMs = startDate.valueOf();
    const endMs = endDate.valueOf();

    for (let ts = Math.floor(startMs / bucketMs) * bucketMs; ts <= endMs; ts += bucketMs) {
      buckets.set(ts, { upload: 0, download: 0 });
    }

    for (const log of response?.data ?? []) {
      const timestamp = dayjs(eventTimestamp(log));
      if (!timestamp.isValid()) continue;
      const bucket = Math.floor(timestamp.valueOf() / bucketMs) * bucketMs;
      const current = buckets.get(bucket) ?? { upload: 0, download: 0 };
      current.upload += log.tx_bytes ?? 0;
      current.download += log.rx_bytes ?? 0;
      buckets.set(bucket, current);
    }

    const chartPoints = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, value]) => ({
        timestamp: new Date(timestamp),
        uploadRate: value.upload / bucketSeconds,
        downloadRate: value.download / bucketSeconds,
      }));

    const totalUpload = Array.from(buckets.values()).reduce(
      (sum, value) => sum + value.upload,
      0,
    );
    const totalDownload = Array.from(buckets.values()).reduce(
      (sum, value) => sum + value.download,
      0,
    );

    return {
      points: chartPoints,
      totals: { upload: totalUpload, download: totalDownload },
      peaks: {
        upload: Math.max(0, ...chartPoints.map((point) => point.uploadRate)),
        download: Math.max(0, ...chartPoints.map((point) => point.downloadRate)),
      },
    };
  }, [endDate, response?.data, selectedRange.hours, startDate]);

  const xScale = useMemo(
    () =>
      d3
        .scaleTime()
        .domain([startDate.toDate(), endDate.toDate()])
        .range([MARGIN.left, WIDTH - MARGIN.right]),
    [endDate, startDate],
  );

  const maxRate = Math.max(1, peaks.upload, peaks.download);
  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([-maxRate * 1.12, maxRate * 1.12])
        .range([HEIGHT - MARGIN.bottom, MARGIN.top]),
    [maxRate],
  );

  const uploadArea = d3
    .area<TrafficPoint>()
    .x((point) => xScale(point.timestamp))
    .y0(yScale(0))
    .y1((point) => yScale(point.uploadRate))
    .curve(d3.curveMonotoneX);

  const downloadArea = d3
    .area<TrafficPoint>()
    .x((point) => xScale(point.timestamp))
    .y0(yScale(0))
    .y1((point) => yScale(-point.downloadRate))
    .curve(d3.curveMonotoneX);

  const uploadLine = d3
    .line<TrafficPoint>()
    .x((point) => xScale(point.timestamp))
    .y((point) => yScale(point.uploadRate))
    .curve(d3.curveMonotoneX);

  const downloadLine = d3
    .line<TrafficPoint>()
    .x((point) => xScale(point.timestamp))
    .y((point) => yScale(-point.downloadRate))
    .curve(d3.curveMonotoneX);

  const yTicks = yScale.ticks(8);
  const xTicks = xScale.ticks(selectedRange.hours <= 12 ? 10 : 8);
  const timeFormat = selectedRange.hours <= 24 ? "MM-DD HH:mm" : "MM-DD";

  return (
    <section className="h-[520px] rounded-md border border-neutral-200 bg-white p-5 shadow-sm dark:border-nb-gray-900 dark:bg-nb-gray-930 lg:col-span-2">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t("overview.relayTrafficStats")}
          </h2>
          <span className="text-xs text-nb-gray-300">
            {t("overview.uploadPeak")}：{formatRate(peaks.upload)}
          </span>
          <span className="text-xs text-nb-gray-300">
            {t("overview.downloadPeak")}：{formatRate(peaks.download)}
          </span>
          <span className="text-xs text-nb-gray-300">
            {t("overview.uploadTotal")}：{formatTotal(totals.upload)}
          </span>
          <span className="text-xs text-nb-gray-300">
            {t("overview.downloadTotal")}：{formatTotal(totals.download)}
          </span>
        </div>

        <Select value={range} onValueChange={(value) => setRange(value as RangeValue)}>
          <SelectTrigger className="h-9 w-[124px] bg-neutral-50 dark:bg-nb-gray-900/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[124px]">
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey as never)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative h-[430px]">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={isLoading ? "h-full w-full opacity-60" : "h-full w-full"}
          role="img"
          aria-label={t("overview.relayTrafficStats")}
        >
          <g>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  className="stroke-slate-200 dark:stroke-nb-gray-800"
                />
                <text
                  x={MARGIN.left - 8}
                  y={yScale(tick) + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] dark:fill-nb-gray-300"
                >
                  {tick === 0 ? "0" : formatRate(Math.abs(tick))}
                </text>
              </g>
            ))}
          </g>

          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={yScale(0)}
            y2={yScale(0)}
            className="stroke-slate-600 dark:stroke-nb-gray-300"
          />

          <path d={uploadArea(points) ?? undefined} fill="#9aa5b1" opacity={0.85} />
          <path d={downloadArea(points) ?? undefined} fill="#242a34" opacity={0.86} />
          <path
            d={uploadLine(points) ?? undefined}
            className="fill-none stroke-slate-500 dark:stroke-slate-300"
            strokeWidth={1.2}
          />
          <path
            d={downloadLine(points) ?? undefined}
            className="fill-none stroke-slate-900 dark:stroke-white"
            strokeWidth={1.2}
          />

          <g>
            {xTicks.map((tick) => (
              <text
                key={tick.toISOString()}
                x={xScale(tick)}
                y={HEIGHT - 16}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] dark:fill-nb-gray-300"
              >
                {dayjs(tick).format(timeFormat)}
              </text>
            ))}
          </g>
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 text-xs text-neutral-600 dark:text-nb-gray-300">
          <LegendDot color="#9aa5b1" label={t("overview.uploadRate")} />
          <LegendDot color="#242a34" label={t("overview.downloadRate")} />
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 text-sm text-nb-gray-300 backdrop-blur-[1px] dark:bg-nb-gray/20">
            {t("overview.loadingDistribution")}
          </div>
        )}
      </div>
    </section>
  );
}

function LegendDot({ color, label }: Readonly<{ color: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
