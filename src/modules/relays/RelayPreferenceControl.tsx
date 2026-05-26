"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import { Checkbox } from "@components/Checkbox";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import SquareIcon from "@components/SquareIcon";
import { SmallBadge } from "@components/ui/SmallBadge";
import { cn } from "@utils/helpers";
import {
  PencilIcon,
  RadioTowerIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
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
        void mutate("/relays/preferences");
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
            {t("relays.saveAndApply")}
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
          {t("relays.saveAndApply")}
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
  const [search, setSearch] = useState("");
  const [editingTarget, setEditingTarget] = useState<TargetOption | null>(null);

  const filteredTargets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return targets;
    }
    return targets.filter((target) =>
      target.name.toLowerCase().includes(query),
    );
  }, [search, targets]);

  return (
    <div>
      <div className={"p-5 border-b border-nb-gray-900"}>
        <Label>{title}</Label>
        <HelpText>{description}</HelpText>
      </div>
      <div className={"border-b border-nb-gray-900 p-4"}>
        <Input
          variant={"darker"}
          icon={<SearchIcon size={15} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("relays.controlSearchPlaceholder")}
        />
      </div>
      <div className={"divide-y divide-nb-gray-900"}>
        {targets.length === 0 && (
          <div className={"p-5 text-sm text-nb-gray-400"}>
            {t("relays.noControlTargets")}
          </div>
        )}
        {targets.length > 0 && filteredTargets.length === 0 && (
          <div className={"p-5 text-sm text-nb-gray-400"}>
            {t("relays.noControlSearchResults")}
          </div>
        )}
        {filteredTargets.map((target) => (
          <PreferenceRow
            key={target.id}
            compact={compact}
            relayOptions={relayOptions}
            selected={values[target.id] ?? []}
            target={target}
            onClear={() => onChange(target.id, [])}
            onEdit={() => setEditingTarget(target)}
          />
        ))}
      </div>
      {editingTarget && (
        <RelayPreferenceModal
          open={!!editingTarget}
          onOpenChange={(open) => !open && setEditingTarget(null)}
          target={editingTarget}
          relays={relayOptions}
          selected={values[editingTarget.id] ?? []}
          onChange={(relayIDs) => onChange(editingTarget.id, relayIDs)}
        />
      )}
    </div>
  );
}

function PreferenceRow({
  target,
  relayOptions,
  selected,
  compact,
  onEdit,
  onClear,
}: Readonly<{
  target: TargetOption;
  relayOptions: RelayOption[];
  selected: string[];
  compact?: boolean;
  onEdit: () => void;
  onClear: () => void;
}>) {
  const { t } = useI18n();
  const selectedRelays = useMemo(
    () =>
      selected
        .map((id) => relayOptions.find((relay) => relay.id === id) ?? null)
        .filter(Boolean),
    [relayOptions, selected],
  );
  const visibleRelays = selectedRelays.slice(0, 2);
  const hiddenCount = Math.max(selectedRelays.length - 2, 0);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_auto] md:items-center",
        compact && "md:grid-cols-[minmax(120px,1fr)_minmax(180px,2fr)_auto]",
      )}
    >
      <div className={"min-w-0"}>
        <div className={"truncate text-sm font-medium text-nb-gray-100"}>
          {target.name}
        </div>
        <div className={"mt-1 text-xs text-nb-gray-500"}>
          {selected.length > 0
            ? t("relays.selectedRelayCount", { count: selected.length })
            : t("relays.controlDefault")}
        </div>
      </div>
      <div className={"min-w-0"}>
        {visibleRelays.length > 0 ? (
          <div className={"flex min-w-0 flex-wrap gap-2"}>
            {visibleRelays.map(
              (relay) =>
                relay && (
                  <RelayChip
                    key={relay.id}
                    relay={relay}
                    className={"max-w-full md:max-w-[240px]"}
                  />
                ),
            )}
            {hiddenCount > 0 && (
              <span
                className={
                  "inline-flex h-8 items-center rounded-md border border-nb-gray-800 bg-nb-gray-930 px-2.5 text-xs text-nb-gray-300"
                }
              >
                +{hiddenCount}
              </span>
            )}
          </div>
        ) : (
          <span className={"text-sm text-nb-gray-500"}>
            {t("relays.noPreferredRelay")}
          </span>
        )}
      </div>
      <div className={"flex justify-end gap-2"}>
        {selected.length > 0 && (
          <Button
            variant={"secondary"}
            size={"xs"}
            className={"h-9 px-3"}
            onClick={onClear}
            aria-label={t("relays.clearPreference")}
          >
            <Trash2Icon size={14} />
          </Button>
        )}
        <Button
          variant={"secondary"}
          size={"xs"}
          className={"h-9 px-3"}
          onClick={onEdit}
        >
          <PencilIcon size={14} />
          {t("relays.editPreference")}
        </Button>
      </div>
    </div>
  );
}

function RelayPreferenceModal({
  open,
  onOpenChange,
  target,
  relays,
  selected,
  onChange,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: TargetOption;
  relays: RelayOption[];
  selected: string[];
  onChange: (relayIDs: string[]) => void;
}>) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const filteredRelays = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return relays;
    }
    return relays.filter(
      (relay) =>
        relay.label.toLowerCase().includes(query) ||
        relay.description.toLowerCase().includes(query),
    );
  }, [relays, search]);

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
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-2xl"} className={"py-0"}>
        <ModalHeader
          icon={<RadioTowerIcon size={18} />}
          title={t("relays.editPreferenceFor", { name: target.name })}
          description={t("relays.editPreferenceHelp")}
          className={"px-6 pb-5 pt-6"}
        />
        <div className={"border-y border-nb-gray-900 px-6 py-4"}>
          <Input
            variant={"darker"}
            icon={<SearchIcon size={15} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("relays.relaySearchPlaceholder")}
          />
        </div>
        <div className={"max-h-[52vh] overflow-y-auto px-6 py-3"}>
          <div className={"divide-y divide-nb-gray-900"}>
            {filteredRelays.length === 0 && (
              <div className={"py-8 text-center text-sm text-nb-gray-400"}>
                {t("relays.noRelaySearchResults")}
              </div>
            )}
            {filteredRelays.map((relay) => (
              <label
                key={relay.id}
                className={
                  "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 py-3"
                }
              >
                <Checkbox
                  checked={selectedSet.has(relay.id)}
                  onCheckedChange={(checked) =>
                    toggle(relay.id, checked === true)
                  }
                />
                <RelayChip relay={relay} />
                <SmallBadge
                  text={relay.online ? t("relays.online") : t("relays.offline")}
                  variant={relay.online ? "green" : "yellow"}
                  size={"default"}
                />
              </label>
            ))}
          </div>
        </div>
        <ModalFooter className={"items-center"}>
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            <Trash2Icon size={15} />
            {t("relays.clearPreference")}
          </Button>
          <ModalClose asChild={true}>
            <Button variant={"primary"} size={"sm"}>
              {t("common.close")}
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RelayChip({
  relay,
  className,
}: Readonly<{
  relay: RelayOption;
  className?: string;
}>) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-md border border-nb-gray-800 bg-nb-gray-930 px-2.5 py-1.5",
        className,
      )}
    >
      <SquareIcon
        icon={<RadioTowerIcon size={13} />}
        color={relay.online ? "green" : "gray"}
        size={"small"}
        margin={"mt-0"}
      />
      <span className={"min-w-0"}>
        <span className={"block truncate text-sm text-nb-gray-100"}>
          {relay.label}
        </span>
        <span className={"block truncate text-xs text-nb-gray-400"}>
          {relay.description}
        </span>
      </span>
    </span>
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
