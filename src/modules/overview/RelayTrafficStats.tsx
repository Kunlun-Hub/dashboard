"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { useApiCall } from "@utils/api";
import { formatBytes } from "@utils/helpers";
import * as d3 from "d3";
import dayjs from "dayjs";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useOverviewRefresh } from "@/modules/overview/OverviewRefreshContext";

type RangeValue = "6h" | "12h" | "24h" | "3d" | "7d";

type TrafficPoint = {
  bucketStart: Date;
  bucketEnd: Date;
  coveredSeconds: number;
  uploadRate: number;
  downloadRate: number;
  uploadTotal: number;
  downloadTotal: number;
};

type TrafficSummaryPoint = {
  timestamp?: string;
  bucket_start: string;
  bucket_end: string;
  covered_seconds: number;
  download_rate: number;
  rx_bytes: number;
  upload_rate: number;
  tx_bytes: number;
};

type TrafficSummaryResponse = {
  bucket_seconds: number;
  data: TrafficSummaryPoint[];
  download_peak: number;
  download_total: number;
  upload_peak: number;
  upload_total: number;
};

const WIDTH = 1320;
const HEIGHT = 380;
const MARGIN = { top: 28, right: 24, bottom: 46, left: 64 };
const CHART_GAP = 26;
const ROUTED_CONNECTION_TYPE = "ROUTED";
const TRAFFIC_SUMMARY_BUCKET_SECONDS = 60;
const emptyTrafficSummary: TrafficSummaryResponse = {
  bucket_seconds: TRAFFIC_SUMMARY_BUCKET_SECONDS,
  data: [],
  download_peak: 0,
  download_total: 0,
  upload_peak: 0,
  upload_total: 0,
};
const chartColors = {
  axis: "var(--overview-chart-axis-color)",
  download: "rgb(var(--cloink-brand-600))",
  grid: "var(--overview-chart-grid-color)",
  hoverLine: "var(--overview-chart-hover-line-color)",
  label: "var(--overview-chart-label-color)",
  tooltipBg: "var(--overview-chart-tooltip-bg)",
  tooltipBorder: "var(--overview-chart-tooltip-border)",
  tooltipText: "var(--overview-chart-tooltip-text)",
  upload: "rgb(var(--cloink-brand-300))",
};

const rangeOptions: Array<{ value: RangeValue; hours: number; labelKey: string }> = [
  { value: "6h", hours: 6, labelKey: "overview.last6Hours" },
  { value: "12h", hours: 12, labelKey: "overview.last12Hours" },
  { value: "24h", hours: 24, labelKey: "overview.last24Hours" },
  { value: "3d", hours: 72, labelKey: "overview.last3Days" },
  { value: "7d", hours: 168, labelKey: "overview.last7Days" },
];

const formatRate = (bytesPerSecond: number) => {
  return `${formatBytes(bytesPerSecond, bytesPerSecond >= 1024 * 1024 ? 2 : 1)}/s`;
};

const formatTotal = (bytes: number) => formatBytes(bytes, bytes >= 1024 * 1024 ? 2 : 1);

const formatBucketRange = (start: Date, end: Date) => {
  const startText = dayjs(start).format("YYYY-MM-DD HH:mm");
  const endText = dayjs(end).format("HH:mm");
  return `${startText} - ${endText}`;
};

const parseSummaryDate = (value?: string) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.valueOf() : null;
};

export function RelayTrafficStats() {
  const { t } = useI18n();
  const [range, setRange] = useState<RangeValue>("6h");
  const [now, setNow] = useState(() => dayjs());
  const [summary, setSummary] = useState<TrafficSummaryResponse>(
    emptyTrafficSummary,
  );
  const [isLoading, setIsLoading] = useState(false);
  const selectedRange = rangeOptions.find((option) => option.value === range) ?? rangeOptions[0];
  const endDate = now;
  const startDate = useMemo(
    () => endDate.subtract(selectedRange.hours, "hour"),
    [endDate, selectedRange.hours],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<any>(null);
  const chartClipId = useId().replaceAll(":", "-");
  const { refreshTrigger, refreshInterval } = useOverviewRefresh();
  const networkTrafficApi = useApiCall<TrafficSummaryResponse>("/events/network-traffic/summary", true);
  const networkTrafficApiRef = useRef(networkTrafficApi);

  useEffect(() => {
    networkTrafficApiRef.current = networkTrafficApi;
  }, [networkTrafficApi]);

  useEffect(() => {
    setNow(dayjs());
  }, [range, refreshTrigger]);

  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalID = window.setInterval(() => {
      setNow(dayjs());
    }, refreshInterval);

    return () => window.clearInterval(intervalID);
  }, [refreshInterval]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("start_date", startDate.toISOString());
    params.set("end_date", endDate.toISOString());
    params.set("connection_type", ROUTED_CONNECTION_TYPE);
    params.set("bucket_seconds", String(TRAFFIC_SUMMARY_BUCKET_SECONDS));
    return params;
  }, [endDate, startDate]);

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async () => {
      setIsLoading(true);

      try {
        const response = await networkTrafficApiRef.current.get(`?${queryParams.toString()}`);
        if (cancelled) return;

        setSummary(response ?? emptyTrafficSummary);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  const { points, totals, peaks, maxRates } = useMemo(() => {
    const chartPoints = summary.data
      .map((point) => {
        const parsedBucketStart =
          parseSummaryDate(point.bucket_start) ??
          parseSummaryDate(point.timestamp);
        const parsedBucketEnd = parseSummaryDate(point.bucket_end);
        if (parsedBucketStart === null || parsedBucketEnd === null) return null;

        return {
          bucketStart: new Date(parsedBucketStart),
          bucketEnd: new Date(parsedBucketEnd),
          coveredSeconds: point.covered_seconds,
          uploadRate: point.upload_rate,
          downloadRate: point.download_rate,
          uploadTotal: point.tx_bytes,
          downloadTotal: point.rx_bytes,
        };
      })
      .filter((point): point is TrafficPoint => point !== null)
      .sort((a, b) => a.bucketStart.getTime() - b.bucketStart.getTime());

    return {
      points: chartPoints,
      totals: {
        upload: summary.upload_total,
        download: summary.download_total,
      },
      peaks: {
        upload: summary.upload_peak,
        download: summary.download_peak,
      },
      maxRates: {
        upload: Math.max(1, summary.upload_peak),
        download: Math.max(1, summary.download_peak),
      },
    };
  }, [summary]);

  useEffect(() => {
    if (!gRef.current || points.length > 0) return;
    d3.select(gRef.current).selectAll("*").remove();
  }, [points.length]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current || points.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    g.selectAll("*").remove();

    const plotTop = MARGIN.top;
    const plotBottom = HEIGHT - MARGIN.bottom;
    const plotHeight = plotBottom - plotTop;
    const panelHeight = (plotHeight - CHART_GAP) / 2;
    const uploadBounds = {
      top: plotTop,
      bottom: plotTop + panelHeight,
    };
    const downloadBounds = {
      top: uploadBounds.bottom + CHART_GAP,
      bottom: uploadBounds.bottom + CHART_GAP + panelHeight,
    };

    const xScale = d3
      .scaleTime()
      .domain([startDate.toDate(), endDate.toDate()])
      .range([MARGIN.left, WIDTH - MARGIN.right]);

    const uploadScale = d3
      .scaleLinear()
      .domain([0, maxRates.upload * 1.12])
      .range([uploadBounds.bottom, uploadBounds.top]);

    const downloadScale = d3
      .scaleLinear()
      .domain([0, maxRates.download * 1.12])
      .range([downloadBounds.bottom, downloadBounds.top]);

    const renderChart = (currentX: d3.ScaleTime<number, number>) => {
      g.selectAll("*").remove();

      const defs = g.append("defs");
      const clipPath = defs.append("clipPath").attr("id", chartClipId);
      clipPath
        .append("rect")
        .attr("x", MARGIN.left)
        .attr("y", plotTop)
        .attr("width", WIDTH - MARGIN.left - MARGIN.right)
        .attr("height", plotBottom - plotTop);

      const chartGroup = g.append("g").attr("clip-path", `url(#${chartClipId})`);
      const xTicks = currentX.ticks(selectedRange.hours <= 12 ? 10 : 8);
      const timeFormat = selectedRange.hours <= 24 ? "MM-DD HH:mm" : "MM-DD";
      const gridGroup = g.append("g");
      const renderRateGrid = (
        scale: d3.ScaleLinear<number, number>,
        bounds: { top: number; bottom: number },
        label: string,
      ) => {
        scale.ticks(4).forEach((tick) => {
          gridGroup
            .append("line")
            .attr("x1", MARGIN.left)
            .attr("x2", WIDTH - MARGIN.right)
            .attr("y1", scale(tick))
            .attr("y2", scale(tick))
            .attr("stroke", chartColors.grid);

          gridGroup
            .append("text")
            .attr("x", MARGIN.left - 8)
            .attr("y", scale(tick) + 4)
            .attr("text-anchor", "end")
            .attr("fill", chartColors.axis)
            .attr("font-size", "11px")
            .text(tick === 0 ? "0" : formatRate(tick));
        });

        g.append("text")
          .attr("x", MARGIN.left)
          .attr("y", bounds.top - 8)
          .attr("fill", chartColors.label)
          .attr("font-size", "12px")
          .attr("font-weight", 500)
          .text(label);
      };

      renderRateGrid(uploadScale, uploadBounds, t("overview.uploadRate"));
      renderRateGrid(downloadScale, downloadBounds, t("overview.downloadRate"));

      const uploadArea = d3
        .area<TrafficPoint>()
        .x((point) => currentX(point.bucketStart))
        .y0(uploadBounds.bottom)
        .y1((point) => uploadScale(point.uploadRate))
        .curve(d3.curveLinear);

      const downloadArea = d3
        .area<TrafficPoint>()
        .x((point) => currentX(point.bucketStart))
        .y0(downloadBounds.bottom)
        .y1((point) => downloadScale(point.downloadRate))
        .curve(d3.curveLinear);

      const uploadLine = d3
        .line<TrafficPoint>()
        .x((point) => currentX(point.bucketStart))
        .y((point) => uploadScale(point.uploadRate))
        .curve(d3.curveLinear);

      const downloadLine = d3
        .line<TrafficPoint>()
        .x((point) => currentX(point.bucketStart))
        .y((point) => downloadScale(point.downloadRate))
        .curve(d3.curveLinear);

      chartGroup.append("path")
        .attr("d", uploadArea(points) ?? "")
        .attr("fill", chartColors.upload)
        .attr("opacity", 0.85);

      chartGroup.append("path")
        .attr("d", downloadArea(points) ?? "")
        .attr("fill", chartColors.download)
        .attr("opacity", 0.86);

      chartGroup.append("path")
        .attr("d", uploadLine(points) ?? "")
        .attr("fill", "none")
        .attr("stroke", chartColors.upload)
        .attr("stroke-width", 1.2);

      chartGroup.append("path")
        .attr("d", downloadLine(points) ?? "")
        .attr("fill", "none")
        .attr("stroke", chartColors.download)
        .attr("stroke-width", 1.2);

      const xAxisGroup = g.append("g");
      xTicks.forEach((tick) => {
        xAxisGroup
          .append("text")
          .attr("x", currentX(tick))
          .attr("y", HEIGHT - 16)
          .attr("text-anchor", "middle")
          .attr("fill", chartColors.axis)
          .attr("font-size", "11px")
          .text(dayjs(tick).format(timeFormat));
      });

      const tooltip = g.append("g").style("display", "none");

      const overlay = g.append("rect")
        .attr("class", "overlay")
        .attr("x", MARGIN.left)
        .attr("y", plotTop)
        .attr("width", WIDTH - MARGIN.left - MARGIN.right)
        .attr("height", plotBottom - plotTop)
        .attr("fill", "transparent")
        .style("cursor", "crosshair");

      const focus = g.append("g").style("display", "none");

      focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", uploadBounds.top)
        .attr("y2", downloadBounds.bottom)
        .attr("stroke", chartColors.hoverLine)
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-width", 1);

      const tooltipRect = tooltip.append("rect")
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", chartColors.tooltipBg)
        .attr("fill-opacity", 0.95)
        .attr("stroke", chartColors.tooltipBorder);

      const tooltipText = tooltip.append("text")
        .attr("fill", chartColors.tooltipText)
        .attr("font-size", "12px")
        .style("pointer-events", "none");

      const bisectByBucketStart = d3.bisector<TrafficPoint, Date>(
        (d) => d.bucketStart,
      ).center;

      const handleMouseMove = (event: MouseEvent) => {
        if (points.length === 0) return;

        const [mouseX] = d3.pointer(event);
        const x0 = currentX.invert(mouseX);
        const i = bisectByBucketStart(points, x0);
        const d0 = points[i - 1];
        const d1 = points[i];
        const d = d0 && d1
          ? (x0.getTime() - d0.bucketStart.getTime() >
            d1.bucketStart.getTime() - x0.getTime()
              ? d1
              : d0)
          : d0 ?? d1;

        if (!d) return;

        focus.style("display", null);
        tooltip.style("display", null);
        
        focus
          .select(".x-hover-line")
          .attr("x1", currentX(d.bucketStart))
          .attr("x2", currentX(d.bucketStart));

        const lines: string[] = [];
        lines.push(formatBucketRange(d.bucketStart, d.bucketEnd));
        lines.push(`${t("overview.uploadRate")}: ${formatRate(d.uploadRate)}`);
        lines.push(`${t("overview.downloadRate")}: ${formatRate(d.downloadRate)}`);
        if (d.uploadTotal > 0) {
          lines.push(`${t("overview.uploadTotal")}: ${formatTotal(d.uploadTotal)}`);
        }
        if (d.downloadTotal > 0) {
          lines.push(`${t("overview.downloadTotal")}: ${formatTotal(d.downloadTotal)}`);
        }

        tooltipText.selectAll("tspan").remove();
        lines.forEach((line, idx) => {
          tooltipText
            .append("tspan")
            .attr("x", 12)
            .attr("dy", idx === 0 ? 0 : "1.2em")
            .text(line);
        });

        const bbox = (tooltipText.node() as SVGTextElement)?.getBBox();
        if (bbox) {
          tooltipRect
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 4)
            .attr("width", bbox.width + 24)
            .attr("height", bbox.height + 16);
        }

        let tx = currentX(d.bucketStart) + 15;
        let ty = 20;

        if (tx > WIDTH / 2) {
          tx = currentX(d.bucketStart) - (bbox ? bbox.width + 35 : 100);
        }

        tooltip.attr("transform", `translate(${tx},${ty})`);
      };

      overlay
        .on("mouseover", () => {
          focus.style("display", null);
          tooltip.style("display", null);
        })
        .on("mouseout", () => {
          focus.style("display", "none");
          tooltip.style("display", "none");
        })
        .on("mousemove", handleMouseMove);
    };

    renderChart(xScale);

    let zoomFrame: number | null = null;

    const zoom = d3
      .zoom()
      .extent([
        [MARGIN.left, MARGIN.top],
        [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom],
      ])
      .translateExtent([
        [MARGIN.left, MARGIN.top],
        [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom],
      ])
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        if (zoomFrame !== null) {
          window.cancelAnimationFrame(zoomFrame);
        }
        zoomFrame = window.requestAnimationFrame(() => {
          const newX = event.transform.rescaleX(xScale);
          renderChart(newX);
          zoomFrame = null;
        });
      });

    (svg as any).call(zoom);
    zoomRef.current = zoom;

    return () => {
      if (zoomFrame !== null) {
        window.cancelAnimationFrame(zoomFrame);
      }
      svg.on(".zoom", null);
      g.selectAll("*").remove();
    };
  }, [points, maxRates, startDate, endDate, selectedRange.hours, chartClipId, t]);

  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      (d3.select(svgRef.current) as any).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <section className="h-[520px] rounded-md border border-neutral-200 bg-white p-5 shadow-sm dark:border-nb-gray-900 dark:bg-nb-gray-930 lg:col-span-2">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t("overview.relayTrafficStats")}
          </h2>
          <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("overview.uploadPeak")}：{formatRate(peaks.upload)}
          </span>
          <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("overview.downloadPeak")}：{formatRate(peaks.download)}
          </span>
          <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("overview.uploadTotal")}：{formatTotal(totals.upload)}
          </span>
          <span className="text-xs text-neutral-500 dark:text-nb-gray-300">
            {t("overview.downloadTotal")}：{formatTotal(totals.download)}
          </span>
          <button
            onClick={resetZoom}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-nb-gray-400 dark:hover:text-white cursor-pointer"
          >
            {t("overview.resetZoom")}
          </button>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      <div className="relative h-[430px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={isLoading ? "h-full w-full opacity-60" : "h-full w-full"}
          role="img"
          aria-label={t("overview.relayTrafficStats")}
        >
          <g ref={gRef} />
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 text-xs text-neutral-600 dark:text-nb-gray-300">
          <LegendDot color={chartColors.upload} label={t("overview.uploadRate")} />
          <LegendDot color={chartColors.download} label={t("overview.downloadRate")} />
          <div className="text-xs text-slate-400 dark:text-nb-gray-500">
            {t("overview.zoomHint")}
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 text-sm text-neutral-500 backdrop-blur-[1px] dark:bg-nb-gray/20 dark:text-nb-gray-300">
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
