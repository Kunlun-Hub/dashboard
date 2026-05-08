import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import { validator } from "@utils/helpers";
import { isNetBirdHosted } from "@utils/netbird";
import cidr from "ip-cidr";
import { ExternalLinkIcon, GlobeIcon, NetworkIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { useGroups } from "@/contexts/GroupsProvider";
import { SkeletonSettings } from "@components/skeletons/SkeletonSettings";

type Props = {
  account: Account;
};

export default function NetworkSettingsTab({ account }: Readonly<Props>) {
  const { isLoading: isGroupsLoading } = useGroups();

  return isGroupsLoading ? (
    <SkeletonSettings />
  ) : (
    <NetworkSettingsTabContent account={account} />
  );
}

function NetworkSettingsTabContent({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const { mutate } = useSWRConfig();
  const saveRequest = useApiCall<Account>("/accounts/" + account.id, true);

  const [routingPeerDNSSetting, setRoutingPeerDNSSetting] = useState(
    account.settings.routing_peer_dns_resolution_enabled,
  );
  const [customDNSDomain, setCustomDNSDomain] = useState(
    account.settings.dns_domain || "",
  );
  const [networkRange, setNetworkRange] = useState(
    account.settings.network_range || "",
  );
  const [networkRangeV6, setNetworkRangeV6] = useState(
    account.settings.network_range_v6 || "",
  );
  const [ipv6EnabledGroups, setIpv6EnabledGroups, { save: saveGroups }] =
    useGroupHelper({
      initial: account.settings?.ipv6_enabled_groups,
    });
  const ipv6GroupNames = useMemo(
    () => ipv6EnabledGroups.map((g) => g.name).sort(),
    [ipv6EnabledGroups],
  );

  const toggleNetworkDNSSetting = async (toggle: boolean) => {
    notify({
      title: t("networkSettings.dnsWildcardTitle"),
      description: toggle
        ? t("networkSettings.dnsWildcardEnabled")
        : t("networkSettings.dnsWildcardDisabled"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            routing_peer_dns_resolution_enabled: toggle,
          },
        })
        .then(() => {
          setRoutingPeerDNSSetting(toggle);
          mutate("/accounts");
        }),
      loadingMessage: t("networkSettings.dnsWildcardUpdating"),
    });
  };

  const { hasChanges, updateRef } = useHasChanges([
    customDNSDomain,
    networkRange,
    networkRangeV6,
    ipv6GroupNames,
  ]);

  const saveChanges = async () => {
    const groups = await saveGroups();
    const ipv6EnabledGroupIds = groups
      .map((group) => group.id)
      .filter(Boolean) as string[];

    const updatedSettings = {
      ...account.settings,
      ipv6_enabled_groups: ipv6EnabledGroupIds,
    };

    if (customDNSDomain !== "" || account.settings.dns_domain) {
      updatedSettings.dns_domain = customDNSDomain;
    }

    // Only send network ranges when the user actually changed them, to avoid
    // triggering a reallocation when the server hasn't stored an explicit override.
    if (networkRange !== (account.settings.network_range || "")) {
      updatedSettings.network_range = networkRange;
    } else {
      delete updatedSettings.network_range;
    }

    if (networkRangeV6 !== (account.settings.network_range_v6 || "")) {
      updatedSettings.network_range_v6 = networkRangeV6;
    } else {
      delete updatedSettings.network_range_v6;
    }

    notify({
      title: t("networkSettings.notifyTitle"),
      description: t("networkSettings.updatedDescription"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: updatedSettings,
        })
        .then(() => {
          mutate("/accounts");
          updateRef([
            customDNSDomain,
            networkRange,
            networkRangeV6,
            ipv6GroupNames,
          ]);
        }),
      loadingMessage: t("networkSettings.updating"),
    });
  };

  const domainError = useMemo(() => {
    if (customDNSDomain == "") return "";
    const valid = validator.isValidDomain(customDNSDomain, {
      allowWildcard: false,
      allowOnlyTld: false,
    });
    if (!valid) {
      return t("networkSettings.domainError");
    }
  }, [customDNSDomain, t]);

  const networkRangeError = useMemo(() => {
    if (networkRange == "") {
      if (account.settings.network_range) {
        return t("networkSettings.networkRangeEmptyError");
      }
      return "";
    }

    try {
      const validCIDR = cidr.isValidCIDR(networkRange);
      if (!validCIDR) {
        return t("networkSettings.networkRangeError");
      }
    } catch (error) {
      return t("networkSettings.networkRangeError");
    }
  }, [networkRange, account.settings.network_range, t]);

  const networkRangeV6Error = useMemo(() => {
    if (networkRangeV6 == "") return "";
    if (!networkRangeV6.includes(":") || !cidr.isValidCIDR(networkRangeV6)) {
      return "Please enter a valid IPv6 CIDR range, e.g. fd00:1234::/64";
    }
    const prefixLen = parseInt(networkRangeV6.split("/")[1], 10);
    if (prefixLen < 48 || prefixLen > 112) {
      return "Prefix length must be between /48 and /112";
    }
  }, [networkRangeV6]);

  return (
    <Tabs.Content value={"networks"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=networks"}
            label={t("settings.networks")}
            icon={<NetworkIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between"}>
          <div>
            <h1>{t("settings.networks")}</h1>
          </div>
          <Button
            variant={"primary"}
            disabled={
              !hasChanges ||
              !permission.settings.update ||
              !!domainError ||
              !!networkRangeError ||
              !!networkRangeV6Error
            }
            onClick={saveChanges}
          >
            {t("actions.saveChanges")}
          </Button>
        </div>

        <div className={"flex flex-col gap-6 w-full mt-8"}>
          <div>
            <div
              className={
                "flex flex-col gap-1 sm:flex-row w-full sm:gap-4 items-center"
              }
            >
              <div className={"min-w-[330px]"}>
                <Label>{t("networkSettings.dnsDomain")}</Label>
                <HelpText>
                  {t("networkSettings.dnsDomainHelp")}
                </HelpText>
              </div>
              <div className={"w-full"}>
                <Input
                  placeholder={
                    isNetBirdHosted() ? "netbird.cloud" : "netbird.selfhosted"
                  }
                  errorTooltip={true}
                  errorTooltipPosition={"top"}
                  error={domainError}
                  value={customDNSDomain}
                  disabled={!permission.settings.update}
                  onChange={(e) => setCustomDNSDomain(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div
              className={
                "flex flex-col gap-1 sm:flex-row w-full sm:gap-4 items-center"
              }
            >
              <div className={"min-w-[330px]"}>
                <Label>{t("networkSettings.networkRange")}</Label>
                <HelpText>
                  {t("networkSettings.networkRangeHelp")}
                </HelpText>
              </div>
              <div className={"w-full"}>
                <Input
                  placeholder={t("networkSettings.networkRangePlaceholder")}
                  errorTooltip={true}
                  errorTooltipPosition={"top"}
                  error={networkRangeError}
                  value={networkRange}
                  disabled={!permission.settings.update}
                  onChange={(e) => setNetworkRange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div
              className={
                "flex flex-col gap-1 sm:flex-row w-full sm:gap-4 items-center"
              }
            >
              <div className={"min-w-[330px]"}>
                <Label>IPv6 Network Range</Label>
                <HelpText>
                  Specify a custom IPv6 range for your network in CIDR format.
                  All peer IPv6 addresses will be re-allocated when changed.
                </HelpText>
              </div>
              <div className={"w-full"}>
                <Input
                  placeholder={"e.g. fd00:1234:5678::/64"}
                  errorTooltip={true}
                  errorTooltipPosition={"top"}
                  error={networkRangeV6Error}
                  value={networkRangeV6}
                  disabled={!permission.settings.update}
                  onChange={(e) => setNetworkRangeV6(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>IPv6 Enabled Groups</Label>
            <HelpText>
              Peers in the selected groups will receive IPv6 overlay addresses
              (dual-stack). Remove all groups to disable IPv6. Changes apply on
              save and will restart affected clients.
            </HelpText>
            <PeerGroupSelector
              values={ipv6EnabledGroups}
              onChange={setIpv6EnabledGroups}
              placeholder="Select groups to enable IPv6..."
              showResourceCounter={false}
              disabled={!permission.settings.update}
            />
          </div>

          <div className={"mt-4"} />

          <FancyToggleSwitch
            value={routingPeerDNSSetting}
            onChange={toggleNetworkDNSSetting}
            label={
              <>
                <GlobeIcon size={15} />
                {t("networkSettings.enableDnsWildcardRouting")}
              </>
            }
            helpText={
              <>
                {t("networkSettings.enableDnsWildcardRoutingHelp")}{" "}
                <InlineLink
                  href={
                    "https://docs.netbird.io/how-to/accessing-entire-domains-within-networks#enabling-dns-wildcard-routing"
                  }
                  target={"_blank"}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("clientSettings.learnMore")}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
              </>
            }
            disabled={!permission.settings.update}
          />
        </div>
      </div>
    </Tabs.Content>
  );
}
