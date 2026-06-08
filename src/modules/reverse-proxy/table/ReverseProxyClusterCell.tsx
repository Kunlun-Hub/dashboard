"use client";

import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { cn } from "@utils/helpers";
import { AlertTriangle, Globe, Server } from "lucide-react";
import React from "react";
import { useReverseProxies } from "@/contexts/ReverseProxiesProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ReverseProxy,
  ReverseProxyDomainType,
} from "@/interfaces/ReverseProxy";
import { isNetBirdHosted } from "@/utils/netbird";

type Props = {
  reverseProxy: ReverseProxy;
  compact?: boolean;
};

export default function ReverseProxyClusterCell({
  reverseProxy,
  compact,
}: Readonly<Props>) {
  const { domains } = useReverseProxies();
  const { t } = useI18n();

  const clusterName = reverseProxy.proxy_cluster;
  const hasCluster = !!clusterName;
  const isConnected = domains?.some(
    (d) => d.type === ReverseProxyDomainType.FREE && d.domain === clusterName,
  );

  if (!hasCluster) {
    return compact ? (
      <FullTooltip
        interactive={false}
        content={
          <span className={"text-xs"}>
            <span className={"text-nb-gray-400"}>Cluster: </span>
            <span className={"text-nb-gray-100"}>All</span>
          </span>
        }
      >
        <span
          className={
            "inline-flex items-center gap-1.5 truncate cursor-help"
          }
        >
          <Globe size={11} className={"shrink-0"} />
          All
        </span>
      </FullTooltip>
    ) : (
      <div className="flex items-center gap-2" data-cluster-cell>
        <Badge variant="gray" className="font-normal">
          <Globe size={12} />
          {t("common.all")}
        </Badge>
      </div>
    );
  }

  if (isConnected) {
    return compact ? (
      <FullTooltip
        interactive={false}
        content={
          <span className={"text-xs"}>
            <span className={"text-nb-gray-400"}>Cluster: </span>
            <span className={"text-nb-gray-100"}>
              {reverseProxy.proxy_cluster}
            </span>
          </span>
        }
      >
        <span
          className={
            "inline-flex items-center gap-1.5 truncate cursor-help"
          }
        >
          <Server size={11} className={"shrink-0"} />
          {reverseProxy.proxy_cluster}
        </span>
      </FullTooltip>
    ) : (
      <div className="flex items-center gap-2" data-cluster-cell>
        <Badge variant={"gray"} className={cn("font-normal")}>
          <Server size={11} className={cn("text-green-500")} />
          {clusterName}
        </Badge>
      </div>
    );
  }

  return (
    <FullTooltip
      content={
        isNetBirdHosted() ? (
          <div className={"text-xs max-w-xs"}>
            {t("reverseProxy.clusterOfflineHostedPrefix", {
              clusterName,
            })}{" "}
            <InlineLink href={"https://status.netbird.io/"} target={"_blank"}>
              {t("reverseProxy.netbirdStatus")}
            </InlineLink>{" "}
            {t("reverseProxy.clusterOfflineHostedMiddle")}{" "}
            <InlineLink href={"mailto:support@cloink.4w.ink"}>
              support@cloink.4w.ink
            </InlineLink>
          </div>
        ) : (
          <div className={"flex flex-col gap-1 text-xs max-w-xs"}>
            {t("reverseProxy.clusterOfflineSelfHosted", {
              clusterName,
            })}
          </div>
        )
      }
      align={"center"}
      alignOffset={0}
    >
      {compact ? (
        <span
          className={
            "inline-flex items-center gap-1.5 text-red-500 cursor-help truncate"
          }
        >
          <AlertTriangle size={11} className={"shrink-0"} />
          {reverseProxy.proxy_cluster}
        </span>
      ) : (
        <div className="flex items-center gap-2" data-cluster-cell>
          <Badge variant={"red"} className={cn("font-normal")}>
            <AlertTriangle size={11} />
            {reverseProxy.proxy_cluster}
          </Badge>
        </div>
      )}
    </FullTooltip>
  );
}
