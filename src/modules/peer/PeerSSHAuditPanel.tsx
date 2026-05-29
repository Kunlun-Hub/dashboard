import dayjs from "dayjs";
import { HistoryIcon, ShieldAlertIcon } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { ActivityEvent } from "@/interfaces/ActivityEvent";
import { Peer } from "@/interfaces/Peer";
import useFetchApi from "@/utils/api";

type Props = {
  peer: Peer;
};

export function PeerSSHAuditPanel({ peer }: Readonly<Props>) {
  const { locale, t } = useI18n();
  const { data: events, isLoading } = useFetchApi<ActivityEvent[]>(
    "/events/audit",
    true,
    true,
    true,
    { refreshInterval: 5000 },
  );

  const sshSessions = useMemo(() => {
    const peerName = peer.name?.toLowerCase() ?? "";
    const peerIp = peer.ip?.toLowerCase() ?? "";

    const peerEvents = (events ?? [])
      .filter((event) => {
        const code = event.activity_code?.toLowerCase() ?? "";
        const metaText = Object.values(event.meta ?? {})
          .join(" ")
          .toLowerCase();
        return (
          code.includes("ssh") &&
          (event.target_id === peer.id ||
            event.meta?.destination_peer_id === peer.id ||
            event.meta?.target_peer_id === peer.id ||
            (peerName && metaText.includes(peerName)) ||
            (peerIp && metaText.includes(peerIp)))
        );
      });

    const grouped = new Map<string, ActivityEvent[]>();
    peerEvents.forEach((event) => {
      const sessionId =
        event.meta?.session_id || event.meta?.ssh_session_id || event.id;
      grouped.set(sessionId, [...(grouped.get(sessionId) ?? []), event]);
    });

    return Array.from(grouped.entries())
      .map(([sessionId, sessionEvents]) =>
        buildSessionSummary(sessionId, sessionEvents),
      )
      .sort((left, right) => dayjs(right.lastAt).diff(dayjs(left.lastAt)))
      .slice(0, 12);
  }, [events, peer]);

  return (
    <div className="px-8 pb-8">
      <div className="max-w-5xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-nb-gray-100">
            {t("saasSshAudit.title")}
          </h2>
          <p className="mt-1 text-sm text-nb-gray-400">
            {t("saasSshAudit.description")}
          </p>
        </div>

        <div className="rounded-md border border-nb-gray-900 bg-nb-gray-940">
          <div className="flex items-center gap-2 border-b border-nb-gray-900 px-5 py-4 text-sm font-medium text-nb-gray-100">
            <HistoryIcon size={16} />
            {t("saasSshAudit.recentEvents")}
          </div>
          <div className="divide-y divide-nb-gray-900">
            {isLoading && (
              <div className="px-5 py-4 text-sm text-nb-gray-400">
                {t("common.savingChanges")}
              </div>
            )}
            {!isLoading &&
              sshSessions.map((session) => (
                <div
                  key={session.id}
                  className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[180px_1fr_220px]"
                >
                  <div className="text-sm text-nb-gray-400">
                    {formatDate(session.startedAt)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-nb-gray-100">
                      <span>{formatSessionTitle(session, locale)}</span>
                      <span className={resultClassName(session.result)}>
                        {formatResult(session.result, locale)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-nb-gray-400">
                      <span>
                        {formatLabel("source", locale)}:{" "}
                        {session.sourcePeer || "-"}
                      </span>
                      <span>
                        {formatLabel("user", locale)}:{" "}
                        {session.destinationUser || "-"}
                      </span>
                      <span>
                        {formatLabel("method", locale)}: {session.method || "-"}
                      </span>
                      <span>
                        {formatLabel("duration", locale)}:{" "}
                        {formatDuration(session.startedAt, session.endedAt)}
                      </span>
                    </div>
                    {session.reason && (
                      <div className="mt-1 text-xs text-nb-gray-400">
                        {formatLabel("reason", locale)}: {session.reason}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-nb-gray-500">
                      {session.eventCodes.join(" -> ")}
                    </div>
                  </div>
                  <div className="text-sm text-nb-gray-300">
                    {session.actorEmail || t("userSelector.system")}
                  </div>
                </div>
              ))}
            {!isLoading && sshSessions.length === 0 && (
              <div className="flex items-center gap-2 px-5 py-6 text-sm text-nb-gray-400">
                <ShieldAlertIcon size={16} />
                {t("saasSshAudit.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm:ss") : "-";
}

type SSHSessionSummary = {
  id: string;
  startedAt: string;
  endedAt?: string;
  lastAt: string;
  result: "allowed" | "denied" | "failed" | "unknown";
  actorEmail?: string;
  sourcePeer?: string;
  destinationPeer?: string;
  destinationUser?: string;
  method?: string;
  reason?: string;
  eventCodes: string[];
};

function buildSessionSummary(
  sessionId: string,
  events: ActivityEvent[],
): SSHSessionSummary {
  const sorted = [...events].sort((left, right) =>
    dayjs(left.timestamp).diff(dayjs(right.timestamp)),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const mergedMeta = sorted.reduce<Record<string, string>>(
    (meta, event) => ({ ...meta, ...(event.meta ?? {}) }),
    {},
  );
  const codes = sorted.map((event) => event.activity_code).filter(Boolean);

  return {
    id: sessionId,
    startedAt: pickMeta(mergedMeta, ["started_at"]) || first?.timestamp,
    endedAt: pickMeta(mergedMeta, ["ended_at"]) || getEndTime(sorted),
    lastAt: last?.timestamp,
    result: getResult(mergedMeta, codes),
    actorEmail:
      pickMeta(mergedMeta, ["actor_user_email", "user_email"]) ||
      first?.initiator_email,
    sourcePeer: pickMeta(mergedMeta, [
      "source_peer_name",
      "source_peer_id",
      "client_peer_name",
      "client_peer_id",
    ]),
    destinationPeer: pickMeta(mergedMeta, [
      "destination_peer_name",
      "destination_peer_id",
      "target_peer_name",
      "target_peer_id",
    ]),
    destinationUser: pickMeta(mergedMeta, [
      "destination_local_user",
      "local_user",
      "username",
    ]),
    method: pickMeta(mergedMeta, ["access_method", "method"]),
    reason: pickMeta(mergedMeta, ["reason", "error"]),
    eventCodes: Array.from(new Set(codes)),
  };
}

function pickMeta(meta: Record<string, string>, keys: string[]) {
  return keys.map((key) => meta[key]).find(Boolean);
}

function getEndTime(events: ActivityEvent[]) {
  return events.find((event) => event.activity_code?.endsWith(".end"))
    ?.timestamp;
}

function getResult(meta: Record<string, string>, codes: string[]) {
  const result = meta.result?.toLowerCase();
  if (result === "allowed" || result === "denied" || result === "failed") {
    return result;
  }
  if (codes.some((code) => code.includes(".denied"))) return "denied";
  if (codes.some((code) => code.includes(".failed"))) return "failed";
  if (codes.some((code) => code.endsWith(".start") || code.endsWith(".end"))) {
    return "allowed";
  }
  return "unknown";
}

function formatSessionTitle(session: SSHSessionSummary, locale: string) {
  const target = session.destinationPeer || "SSH";
  if (locale === "zh-CN") return `${target} SSH 会话`;
  return `${target} SSH session`;
}

function formatResult(result: SSHSessionSummary["result"], locale: string) {
  const labels = {
    en: {
      allowed: "Allowed",
      denied: "Denied",
      failed: "Failed",
      unknown: "Unknown",
    },
    "zh-CN": {
      allowed: "已允许",
      denied: "已拒绝",
      failed: "失败",
      unknown: "未知",
    },
  };
  return labels[locale === "zh-CN" ? "zh-CN" : "en"][result];
}

function formatLabel(label: string, locale: string) {
  const labels = {
    en: {
      source: "Source",
      user: "Local user",
      method: "Method",
      duration: "Duration",
      reason: "Reason",
    },
    "zh-CN": {
      source: "来源",
      user: "本地用户",
      method: "方式",
      duration: "时长",
      reason: "原因",
    },
  };
  return labels[locale === "zh-CN" ? "zh-CN" : "en"][
    label as keyof (typeof labels)["en"]
  ];
}

function formatDuration(start?: string, end?: string) {
  const startedAt = dayjs(start);
  const endedAt = dayjs(end);
  if (!startedAt.isValid() || !endedAt.isValid()) return "-";

  const seconds = Math.max(0, endedAt.diff(startedAt, "second"));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function resultClassName(result: SSHSessionSummary["result"]) {
  const base = "rounded px-1.5 py-0.5 text-xs";
  if (result === "allowed") return `${base} bg-green-500/10 text-green-400`;
  if (result === "denied") return `${base} bg-yellow-500/10 text-yellow-400`;
  if (result === "failed") return `${base} bg-red-500/10 text-red-400`;
  return `${base} bg-nb-gray-900 text-nb-gray-300`;
}
