"use client";

import { GaugeCircleIcon, RadioTowerIcon, WalletCardsIcon } from "lucide-react";
import { useSaaS } from "@/contexts/SaaSProvider";

export function SaaSUsageSummary() {
  const { usage } = useSaaS();
  if (!usage) return null;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 pb-2 lg:grid-cols-3">
      <SummaryCard
        icon={<WalletCardsIcon size={16} />}
        label="高速流量"
        value={`${formatBytes(usage.high_speed_remaining_bytes)} / ${formatBytes(usage.high_speed_traffic_bytes)}`}
        detail={`${formatBytes(usage.high_speed_used_bytes)} 已用`}
      />
      <SummaryCard
        icon={<GaugeCircleIcon size={16} />}
        label="当前档位"
        value={usage.traffic_tier === "high_speed" ? "高速" : "标准"}
        detail={`${usage.effective_rate_limit_mbps} Mbps 当前有效限速`}
      />
      <SummaryCard
        icon={<RadioTowerIcon size={16} />}
        label="中继策略"
        value={`${usage.total_rate_limit_mbps} Mbps 总限速`}
        detail={usage.relay_only_accounting ? "仅统计 relay 流量" : "混合流量统计"}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}>) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-nb-gray-920 dark:bg-nb-gray-940">
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-nb-gray-300">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-nb-gray-400">
        {detail}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${bytes} B`;
}
