import Button from "@components/Button";
import { SmallBadge } from "@components/ui/SmallBadge";
import dayjs from "dayjs";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  NetworkIcon,
  RadioTowerIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import { Relay } from "@/interfaces/Relay";
import useFetchApi from "@/utils/api";

type Props = {
  peer: Peer;
};

type DiagnosticItem = {
  label: string;
  value: string;
  state: "good" | "warn" | "neutral";
};

export function PeerConnectionDiagnostics({ peer }: Readonly<Props>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { data: relays } = useFetchApi<Relay[]>("/relays", true, false, true, {
    shouldRetryOnError: false,
  });

  const onlineRelays = useMemo(
    () => (relays ?? []).filter((relay) => relay.status === "online"),
    [relays],
  );

  const diagnostics = useMemo<DiagnosticItem[]>(() => {
    const flags = peer.local_flags;
    return [
      {
        label: t("saasDiagnostics.managementState"),
        value: peer.connected
          ? t("saasDiagnostics.online")
          : t("saasDiagnostics.offline"),
        state: peer.connected ? "good" : "warn",
      },
      {
        label: t("saasDiagnostics.publicIp"),
        value: peer.connection_ip || t("common.unknown"),
        state: peer.connection_ip ? "good" : "warn",
      },
      {
        label: t("saasDiagnostics.ipv6"),
        value: peer.ipv6 || t("saasDiagnostics.notAvailable"),
        state: peer.ipv6 ? "good" : "neutral",
      },
      {
        label: t("saasDiagnostics.relayPool"),
        value: t("saasDiagnostics.onlineRelayCount", {
          count: onlineRelays.length,
        }),
        state: onlineRelays.length > 0 ? "good" : "warn",
      },
      {
        label: t("saasDiagnostics.clientRoutes"),
        value: flags?.disable_client_routes
          ? t("common.disabled")
          : t("common.on"),
        state: flags?.disable_client_routes ? "warn" : "good",
      },
      {
        label: t("saasDiagnostics.firewall"),
        value: flags?.disable_firewall ? t("common.disabled") : t("common.on"),
        state: flags?.disable_firewall ? "warn" : "good",
      },
    ];
  }, [onlineRelays.length, peer, t]);

  const recommendations = useMemo(() => {
    const items: string[] = [];
    if (!peer.ipv6) items.push(t("saasDiagnostics.recommendIpv6"));
    if (!onlineRelays.length) items.push(t("saasDiagnostics.recommendRelay"));
    if (peer.local_flags?.disable_firewall) {
      items.push(t("saasDiagnostics.recommendFirewall"));
    }
    if (!peer.connected) items.push(t("saasDiagnostics.recommendReconnect"));
    if (!items.length) items.push(t("saasDiagnostics.recommendHealthy"));
    return items;
  }, [onlineRelays.length, peer, t]);

  return (
    <div className="px-8 pb-8">
      <div className="max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-nb-gray-100">
              {t("saasDiagnostics.title")}
            </h2>
            <p className="mt-1 text-sm text-nb-gray-400">
              {t("saasDiagnostics.description")}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              mutate("/relays").then();
              mutate("/peers/" + peer.id).then();
            }}
          >
            <RefreshCwIcon size={15} />
            {t("dataTable.refresh")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {diagnostics.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-nb-gray-900 bg-nb-gray-940 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-nb-gray-400">{item.label}</span>
                {item.state === "good" && (
                  <CheckCircle2Icon className="text-green-500" size={15} />
                )}
                {item.state === "warn" && (
                  <AlertTriangleIcon className="text-yellow-500" size={15} />
                )}
              </div>
              <div className="truncate text-sm font-medium text-nb-gray-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-nb-gray-900 bg-nb-gray-940 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-nb-gray-100">
              <NetworkIcon size={16} />
              {t("saasDiagnostics.connectionFacts")}
            </div>
            <Fact label={t("peerDetails.lastSeen")} value={formatDate(peer.last_seen)} />
            <Fact label={t("table.version")} value={peer.version || t("common.unknown")} />
            <Fact label={t("peerDetails.operatingSystem")} value={peer.os || t("common.unknown")} />
            <Fact label={t("saasDiagnostics.kernel")} value={peer.kernel_version || t("common.unknown")} />
          </div>

          <div className="rounded-md border border-nb-gray-900 bg-nb-gray-940 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-nb-gray-100">
              <RadioTowerIcon size={16} />
              {t("saasDiagnostics.recommendations")}
            </div>
            <div className="flex flex-col gap-2">
              {recommendations.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-nb-gray-900 bg-nb-gray-930 px-3 py-2 text-sm text-nb-gray-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-nb-gray-900 bg-nb-gray-940 p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-nb-gray-100">
              <RadioTowerIcon size={16} />
              {t("saasDiagnostics.relayCandidates")}
            </div>
            <SmallBadge
              text={t("saasDiagnostics.onlineRelayCount", {
                count: onlineRelays.length,
              })}
              variant={onlineRelays.length ? "green" : "yellow"}
              size="md"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(relays ?? []).slice(0, 8).map((relay) => (
              <div
                key={relay.id || relay.address}
                className="rounded-md border border-nb-gray-900 bg-nb-gray-930 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-nb-gray-100">
                    {relay.name || relay.id || relay.address}
                  </span>
                  <SmallBadge
                    text={
                      relay.status === "online"
                        ? t("relays.online")
                        : t("relays.offline")
                    }
                    variant={relay.status === "online" ? "green" : "yellow"}
                    size="md"
                  />
                </div>
                <div className="mt-1 truncate text-xs text-nb-gray-400">
                  {relay.address}
                </div>
              </div>
            ))}
            {(relays ?? []).length === 0 && (
              <div className="text-sm text-nb-gray-400">
                {t("relays.emptyTitle")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex justify-between gap-4 border-b border-nb-gray-900 py-2 last:border-b-0">
      <span className="text-sm text-nb-gray-400">{label}</span>
      <span className="truncate text-right text-sm text-nb-gray-100">{value}</span>
    </div>
  );
}

function formatDate(value?: Date | string) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm:ss") : "-";
}
