"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import { Checkbox } from "@components/Checkbox";
import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import SquareIcon from "@components/SquareIcon";
import { SmallBadge } from "@components/ui/SmallBadge";
import { RadioTowerIcon, SaveIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import type { Group } from "@/interfaces/Group";
import type { Peer } from "@/interfaces/Peer";
import type { Relay } from "@/interfaces/Relay";
import type { RelayPreferences } from "@/interfaces/RelayPreferences";
import useFetchApi, { useApiCall } from "@/utils/api";

type Props = {
  peerId?: string;
  compact?: boolean;
};

export default function RelayPreferenceControl({
  peerId,
  compact = false,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const request = useApiCall<RelayPreferences>("/relays/preferences", true);
  const { data: relays } = useFetchApi<Relay[]>("/relays", true, false, true, {
    shouldRetryOnError: false,
  });
  const { data: peers } = useFetchApi<Peer[]>("/peers", true);
  const { data: groups } = useFetchApi<Group[]>("/groups", true);
  const { data: preferences } = useFetchApi<RelayPreferences>(
    "/relays/preferences",
    true,
  );

  const [draft, setDraft] = useState<RelayPreferences | null>(null);
  const value = draft ?? preferences ?? emptyPreferences;

  const relayOptions = useMemo(() => {
    return (relays ?? []).map((relay) => ({
      id: relay.id || relay.address,
      label: relay.name || relay.id || relay.address,
      description: relay.address,
      online: relay.status === "online",
    }));
  }, [relays]);

  const updatePreference = (
    scope: "peer_preferences" | "group_preferences",
    targetID: string,
    relayIDs: string[],
  ) => {
    setDraft((current) => {
      const next = clonePreferences(current ?? value);
      if (relayIDs.length === 0) {
        delete next[scope][targetID];
      } else {
        next[scope][targetID] = relayIDs;
      }
      return next;
    });
  };

  const save = () => {
    const payload = draft ?? value;
    notify({
      title: t("relays.controlTitle"),
      description: t("relays.controlSaved"),
      promise: request.put(payload).then(() => {
        setDraft(null);
        mutate("/relays/preferences").then();
      }),
      loadingMessage: t("relays.controlSaving"),
    });
  };

  if (relayOptions.length === 0) {
    return (
      <Card className={"w-full"}>
        <div className={"p-5"}>
          <Label>{t("relays.controlTitle")}</Label>
          <HelpText>{t("relays.noRelayForControl")}</HelpText>
        </div>
      </Card>
    );
  }

  if (peerId) {
    const peer = peers?.find((item) => item.id === peerId);
    return (
      <Card className={"w-full"}>
        <PreferenceSection
          title={t("relays.peerPreferenceTitle")}
          description={t("relays.peerPreferenceHelp")}
          targets={
            peer
              ? [
                  {
                    id: peer.id ?? "",
                    name: peer.name || peer.hostname || peer.ip,
                  },
                ]
              : []
          }
          relayOptions={relayOptions}
          values={value.peer_preferences}
          onChange={(targetID, relayIDs) =>
            updatePreference("peer_preferences", targetID, relayIDs)
          }
          compact={true}
        />
        <div className={"border-t border-nb-gray-900 p-4 flex justify-end"}>
          <Button variant={"primary"} size={"sm"} onClick={save}>
            <SaveIcon size={15} />
            {t("actions.saveChanges")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={"px-8 pb-8"}>
      <div className={"grid grid-cols-1 xl:grid-cols-2 gap-5"}>
        <Card className={"w-full"}>
          <PreferenceSection
            title={t("relays.groupPreferenceTitle")}
            description={t("relays.groupPreferenceHelp")}
            targets={(groups ?? [])
              .filter((group) => group.id && group.name !== "All")
              .map((group) => ({ id: group.id ?? "", name: group.name }))}
            relayOptions={relayOptions}
            values={value.group_preferences}
            onChange={(targetID, relayIDs) =>
              updatePreference("group_preferences", targetID, relayIDs)
            }
            compact={compact}
          />
        </Card>
        <Card className={"w-full"}>
          <PreferenceSection
            title={t("relays.peerPreferenceTitle")}
            description={t("relays.peerPreferenceHelp")}
            targets={(peers ?? [])
              .filter((peer) => peer.id)
              .map((peer) => ({
                id: peer.id ?? "",
                name: peer.name || peer.hostname || peer.ip,
              }))}
            relayOptions={relayOptions}
            values={value.peer_preferences}
            onChange={(targetID, relayIDs) =>
              updatePreference("peer_preferences", targetID, relayIDs)
            }
            compact={compact}
          />
        </Card>
      </div>
      <div className={"flex justify-end mt-5"}>
        <Button variant={"primary"} onClick={save}>
          <SaveIcon size={16} />
          {t("actions.saveChanges")}
        </Button>
      </div>
    </div>
  );
}

type RelayOption = {
  id: string;
  label: string;
  description: string;
  online: boolean;
};

type TargetOption = {
  id: string;
  name: string;
};

function PreferenceSection({
  title,
  description,
  targets,
  relayOptions,
  values,
  onChange,
  compact,
}: Readonly<{
  title: string;
  description: string;
  targets: TargetOption[];
  relayOptions: RelayOption[];
  values: Record<string, string[]>;
  onChange: (targetID: string, relayIDs: string[]) => void;
  compact?: boolean;
}>) {
  const { t } = useI18n();
  return (
    <div>
      <div className={"p-5 border-b border-nb-gray-900"}>
        <Label>{title}</Label>
        <HelpText>{description}</HelpText>
      </div>
      <div className={"divide-y divide-nb-gray-900"}>
        {targets.length === 0 && (
          <div className={"p-5 text-sm text-nb-gray-400"}>
            {t("relays.noControlTargets")}
          </div>
        )}
        {targets.map((target) => (
          <div
            key={target.id}
            className={
              compact
                ? "p-4"
                : "p-4 grid grid-cols-1 2xl:grid-cols-[220px_1fr] gap-4"
            }
          >
            <div className={"font-medium text-nb-gray-100 text-sm"}>
              {target.name}
            </div>
            <RelayCheckboxes
              relays={relayOptions}
              selected={values[target.id] ?? []}
              onChange={(relayIDs) => onChange(target.id, relayIDs)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RelayCheckboxes({
  relays,
  selected,
  onChange,
}: Readonly<{
  relays: RelayOption[];
  selected: string[];
  onChange: (relayIDs: string[]) => void;
}>) {
  const { t } = useI18n();
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (relayID: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) {
      next.add(relayID);
    } else {
      next.delete(relayID);
    }
    onChange(Array.from(next));
  };

  return (
    <div className={"flex flex-wrap gap-2"}>
      {relays.map((relay) => (
        <label
          key={relay.id}
          className={
            "flex min-w-[220px] items-center gap-3 rounded-md border border-nb-gray-800 bg-nb-gray-930 px-3 py-2"
          }
        >
          <Checkbox
            checked={selectedSet.has(relay.id)}
            onCheckedChange={(checked) => toggle(relay.id, checked === true)}
          />
          <SquareIcon
            icon={<RadioTowerIcon size={14} />}
            color={relay.online ? "green" : "gray"}
            size={"small"}
            margin={"mt-0"}
          />
          <span className={"min-w-0 flex-1"}>
            <span className={"block truncate text-sm text-nb-gray-100"}>
              {relay.label}
            </span>
            <span className={"block truncate text-xs text-nb-gray-400"}>
              {relay.description}
            </span>
          </span>
          <SmallBadge
            text={relay.online ? t("relays.online") : t("relays.offline")}
            variant={relay.online ? "green" : "yellow"}
            size={"default"}
          />
        </label>
      ))}
    </div>
  );
}

const emptyPreferences: RelayPreferences = {
  peer_preferences: {},
  group_preferences: {},
};

function clonePreferences(source: RelayPreferences): RelayPreferences {
  return {
    peer_preferences: cloneMap(source.peer_preferences),
    group_preferences: cloneMap(source.group_preferences),
  };
}

function cloneMap(source: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(source ?? {}).map(([key, value]) => [key, [...value]]),
  );
}
