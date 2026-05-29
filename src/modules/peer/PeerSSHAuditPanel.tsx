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
  const { t } = useI18n();
  const { data: events, isLoading } = useFetchApi<ActivityEvent[]>(
    "/events/audit",
    true,
  );

  const sshEvents = useMemo(() => {
    return (events ?? [])
      .filter((event) => {
        const code = event.activity_code?.toLowerCase() ?? "";
        const metaText = Object.values(event.meta ?? {})
          .join(" ")
          .toLowerCase();
        return (
          code.includes("ssh") &&
          (event.target_id === peer.id ||
            metaText.includes(peer.name.toLowerCase()) ||
            metaText.includes((peer.ip ?? "").toLowerCase()))
        );
      })
      .sort((left, right) => dayjs(right.timestamp).diff(dayjs(left.timestamp)))
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
              sshEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[180px_1fr_220px]"
                >
                  <div className="text-sm text-nb-gray-400">
                    {formatDate(event.timestamp)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-nb-gray-100">
                      {event.activity || event.activity_code}
                    </div>
                    <div className="mt-1 text-xs text-nb-gray-400">
                      {event.activity_code}
                    </div>
                  </div>
                  <div className="text-sm text-nb-gray-300">
                    {event.initiator_email || t("userSelector.system")}
                  </div>
                </div>
              ))}
            {!isLoading && sshEvents.length === 0 && (
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
