import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import { Callout } from "@components/Callout";
import { notify } from "@components/Notification";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import { ActivityIcon, InfoIcon, SettingsIcon as LucideSettingsIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";

type Props = {
  account: Account;
};

function readFlowEnabled(account: Account) {
  return (
    account.settings?.flow?.enabled ??
    account.settings?.flow_logs?.enabled ??
    account.settings?.extra?.network_traffic_logs_enabled ??
    account.settings?.extra?.flow_enabled ??
    false
  );
}

function readFlowCounters(account: Account) {
  return (
    account.settings?.flow?.counters ??
    account.settings?.flow_logs?.counters ??
    account.settings?.extra?.network_traffic_packet_counter_enabled ??
    account.settings?.extra?.flow_packet_counter_enabled ??
    false
  );
}

function readFlowDNS(account: Account) {
  return (
    account.settings?.flow?.dns_collection ??
    account.settings?.flow_logs?.dns_collection ??
    account.settings?.extra?.network_traffic_dns_collection_enabled ??
    account.settings?.extra?.flow_dns_collection_enabled ??
    false
  );
}

function readFlowExitNode(account: Account) {
  return (
    account.settings?.flow?.exit_node_collection ??
    account.settings?.flow_logs?.exit_node_collection ??
    account.settings?.extra?.network_traffic_exit_node_collection_enabled ??
    account.settings?.extra?.flow_exit_node_collection_enabled ??
    false
  );
}

function readFlowGroups(account: Account) {
  return (
    account.settings?.flow?.groups ??
    account.settings?.flow_logs?.groups ??
    account.settings?.extra?.network_traffic_logs_groups ??
    account.settings?.extra?.flow_groups ??
    []
  );
}

export default function FlowLogsSettingsTab({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const saveRequest = useApiCall<Account>("/accounts/" + account.id, true);

  const [flowEnabled, setFlowEnabled] = useState(() => readFlowEnabled(account));
  const [flowCountersEnabled, setFlowCountersEnabled] = useState(() =>
    readFlowCounters(account),
  );
  const [flowDNSCollectionEnabled, setFlowDNSCollectionEnabled] = useState(() =>
    readFlowDNS(account),
  );
  const [flowExitNodeCollectionEnabled, setFlowExitNodeCollectionEnabled] =
    useState(() => readFlowExitNode(account));

  const flowGroups = useMemo(() => readFlowGroups(account), [account]);

  const { hasChanges, updateRef } = useHasChanges([
    flowEnabled,
    flowCountersEnabled,
    flowDNSCollectionEnabled,
    flowExitNodeCollectionEnabled,
  ]);

  const saveChanges = async () => {
    notify({
      title: t("flowLogsSettings.notifyTitle"),
      description: t("flowLogsSettings.updatedDescription"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              network_traffic_logs_enabled: flowEnabled,
              network_traffic_logs_groups: flowGroups,
              network_traffic_packet_counter_enabled: flowCountersEnabled,
              network_traffic_dns_collection_enabled:
                flowDNSCollectionEnabled,
              network_traffic_exit_node_collection_enabled:
                flowExitNodeCollectionEnabled,
              flow_enabled: flowEnabled,
              flow_groups: flowGroups,
              flow_packet_counter_enabled: flowCountersEnabled,
              flow_dns_collection_enabled: flowDNSCollectionEnabled,
              flow_exit_node_collection_enabled:
                flowExitNodeCollectionEnabled,
            },
            flow: {
              enabled: flowEnabled,
              groups: flowGroups,
              counters: flowCountersEnabled,
              dns_collection: flowDNSCollectionEnabled,
              exit_node_collection: flowExitNodeCollectionEnabled,
            },
            flow_logs: {
              enabled: flowEnabled,
              groups: flowGroups,
              counters: flowCountersEnabled,
              dns_collection: flowDNSCollectionEnabled,
              exit_node_collection: flowExitNodeCollectionEnabled,
            },
          },
        })
        .then(() => {
          mutate("/accounts");
          updateRef([
            flowEnabled,
            flowCountersEnabled,
            flowDNSCollectionEnabled,
            flowExitNodeCollectionEnabled,
          ]);
        }),
      loadingMessage: t("flowLogsSettings.updating"),
    });
  };

  return (
    <Tabs.Content value={"flow-logs"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=flow-logs"}
            label={t("settings.flowLogs")}
            icon={<ActivityIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between"}>
          <div>
            <h1>{t("settings.flowLogs")}</h1>
            <p className={"text-sm text-nb-gray-400 mt-2"}>
              {t("flowLogsSettings.description")}
            </p>
          </div>

          <Button
            variant={"primary"}
            disabled={!hasChanges || !permission.settings.update}
            onClick={saveChanges}
            data-cy={"save-flow-logs-settings"}
          >
            {t("actions.saveChanges")}
          </Button>
        </div>

        <div className={"flex flex-col gap-6 w-full mt-8"}>
          <FancyToggleSwitch
            value={flowEnabled}
            onChange={setFlowEnabled}
            dataCy={"flow-logs-enabled"}
            label={
              <>
                <ActivityIcon size={15} />
                {t("flowLogsSettings.enable")}
              </>
            }
            helpText={t("flowLogsSettings.enableHelp")}
            disabled={!permission.settings.update}
          />

          <FancyToggleSwitch
            value={flowCountersEnabled}
            onChange={setFlowCountersEnabled}
            dataCy={"flow-logs-counters"}
            label={
              <>
                <LucideSettingsIcon size={15} />
                {t("flowLogsSettings.enableCounters")}
              </>
            }
            helpText={t("flowLogsSettings.enableCountersHelp")}
            disabled={!permission.settings.update || !flowEnabled}
          />

          <FancyToggleSwitch
            value={flowDNSCollectionEnabled}
            onChange={setFlowDNSCollectionEnabled}
            dataCy={"flow-logs-dns"}
            label={
              <>
                <LucideSettingsIcon size={15} />
                {t("flowLogsSettings.enableDnsCollection")}
              </>
            }
            helpText={t("flowLogsSettings.enableDnsCollectionHelp")}
            disabled={!permission.settings.update || !flowEnabled}
          />

          <FancyToggleSwitch
            value={flowExitNodeCollectionEnabled}
            onChange={setFlowExitNodeCollectionEnabled}
            dataCy={"flow-logs-exit-node"}
            label={
              <>
                <LucideSettingsIcon size={15} />
                {t("flowLogsSettings.enableExitNodeCollection")}
              </>
            }
            helpText={t("flowLogsSettings.enableExitNodeCollectionHelp")}
            disabled={!permission.settings.update || !flowEnabled}
          />

          <Callout
            variant={"info"}
            icon={<InfoIcon size={14} className={"shrink-0 relative top-[3px]"} />}
          >
            {t("flowLogsSettings.windowsCallout")}
          </Callout>
        </div>
      </div>
    </Tabs.Content>
  );
}
