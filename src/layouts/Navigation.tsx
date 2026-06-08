"use client";

import { ScrollArea } from "@components/ScrollArea";
import { SmallBadge } from "@components/ui/SmallBadge";
import { cn } from "@utils/helpers";
import { LayoutDashboardIcon, RadioTowerIcon } from "lucide-react";
import * as React from "react";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import ActivityIcon from "@/assets/icons/ActivityIcon";
import ControlCenterIcon from "@/assets/icons/ControlCenterIcon";
import DNSIcon from "@/assets/icons/DNSIcon";
import PeerIcon from "@/assets/icons/PeerIcon";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import TeamIcon from "@/assets/icons/TeamIcon";
import SidebarItem from "@/components/SidebarItem";
import { NavigationVersionInfo } from "@/components/VersionInfo";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";
import { NetworkNavigation } from "@/modules/networks/misc/NetworkNavigation";

type Props = {
  fullWidth?: boolean;
  hideOnMobile?: boolean;
};

export default function Navigation({
  fullWidth = false,
  hideOnMobile = false,
}: Readonly<Props>) {
  const { isNavigationCollapsed } = useApplicationContext();
  const { permission, isRestricted } = usePermissions();
  const { isFeatureEnabled } = useAccountEntitlements();
  const { t } = useI18n();

  const dnsEnabled = isFeatureEnabled("dns");
  const postureEnabled = isFeatureEnabled("device_posture");

  return (
    <div
      data-navigation
      className={cn(
        "light-theme-surface h-full whitespace-nowrap md:border-r border-neutral-200 bg-gray-50 dark:border-nb-gray-800/60 dark:bg-nb-gray relative group/navigation transition-all",
        hideOnMobile ? "hidden md:block" : "",
        fullWidth
          ? "w-auto max-w-[22rem]"
          : "w-[15rem] max-w-[15rem] min-w-[15rem] overflow-y-auto",
        isNavigationCollapsed &&
          "md:w-[70px] md:min-w-[70px] md:absolute md:overflow-hidden md:hover:w-[15rem] md:hover:max-w-[15rem] md:hover:min-w-[15rem] md:z-50",
      )}
    >
      <div className={cn("h-full", fullWidth ? "w-10/12" : "z-0")}>
        <ScrollArea
          style={{
            height: "100%",
          }}
        >
          <div
            className={cn(
              "flex flex-col pt-3 justify-between w-[15rem] max-w-[15rem] min-w-[15rem] transition-all",
              isNavigationCollapsed &&
                "md:w-[70px] md:min-w-[70px] md:group-hover/navigation:w-[15rem] md:group-hover/navigation:max-w-[15rem] md:group-hover/navigation:min-w-[15rem] md:overflow-x-clip",
            )}
            style={{
              height: "100%",
            }}
          >
            <div>
              <SidebarItemGroup>
                <SidebarItem
                  icon={<LayoutDashboardIcon size={16} />}
                  label={t("nav.overview")}
                  href={"/overview"}
                  exactPathMatch={true}
                  visible={!isRestricted}
                />

                <SidebarItem
                  icon={<ControlCenterIcon size={16} />}
                  label={t("nav.controlCenter")}
                  href={"/control-center"}
                  visible={permission.policies.read}
                />

                <SidebarItem
                  icon={<PeerIcon />}
                  label={t("nav.peers")}
                  href={"/peers"}
                  collapsible
                  visible={!isRestricted}
                >
                  <SidebarItem
                    label="User Devices"
                    isChild
                    href={"/peers/users"}
                    exactPathMatch={true}
                    visible={!isRestricted}
                  />
                  <SidebarItem
                    label="Servers"
                    isChild
                    href={"/peers/servers"}
                    exactPathMatch={true}
                    visible={!isRestricted}
                  />
                </SidebarItem>

                <SidebarItem
                  icon={<AccessControlIcon />}
                  label={t("nav.accessControl")}
                  collapsible
                  visible={permission.policies.read}
                >
                  <SidebarItem
                    label={t("nav.policies")}
                    href={"/access-control"}
                    isChild
                    exactPathMatch={true}
                    visible={permission.policies.read}
                  />
                  <SidebarItem
                    label={t("nav.groups")}
                    isChild
                    href={"/groups"}
                    visible={permission.policies.read}
                  />
                  <SidebarItem
                    label={t("nav.postureChecks")}
                    isChild
                    href={"/posture-checks"}
                    exactPathMatch={true}
                    visible={permission.policies.read && postureEnabled}
                  />
                </SidebarItem>

                <NetworkNavigation />

                <SidebarItem
                  icon={<RadioTowerIcon size={16} />}
                  label={t("nav.relays")}
                  href={"/relays"}
                  exactPathMatch={false}
                  visible={permission?.settings?.read}
                />

                <SidebarItem
                  icon={<ReverseProxyIcon size={16} />}
                  labelClassName={"pr-0"}
                  label={
                    <div className={"flex items-center gap-2"}>
                      {t("nav.reverseProxy")}
                      <SmallBadge
                        text={t("common.beta")}
                        variant={"sky"}
                        className={"text-[8px] leading-none py-[3px] px-[5px]"}
                        textClassName={"top-0"}
                      />
                    </div>
                  }
                  href={"/reverse-proxy"}
                  collapsible
                  exactPathMatch={false}
                  visible={permission?.services?.read}
                >
                  <SidebarItem
                    label={t("nav.services")}
                    isChild
                    href={"/reverse-proxy/services"}
                    exactPathMatch={true}
                    visible={permission?.services?.read}
                  />
                  <SidebarItem
                    label={t("nav.customDomains")}
                    isChild
                    href={"/reverse-proxy/custom-domains"}
                    exactPathMatch={true}
                    visible={permission?.services?.read}
                  />
                  <SidebarItem
                    label="Clusters"
                    isChild
                    href={"/reverse-proxy/clusters"}
                    exactPathMatch={true}
                    visible={permission?.services?.read}
                  />
                  <SidebarItem
                    label="Access Logs"
                    isChild
                    href={"/reverse-proxy/logs"}
                    exactPathMatch={true}
                    visible={permission?.services?.read}
                  />
                </SidebarItem>

                <SidebarItem
                  icon={<DNSIcon />}
                  label={t("nav.dns")}
                  collapsible
                  exactPathMatch={true}
                  visible={
                    dnsEnabled &&
                    (permission.dns.read || permission.nameservers.read)
                  }
                >
                  <SidebarItem
                    label={t("nav.nameservers")}
                    isChild
                    href={"/dns/nameservers"}
                    visible={permission.nameservers.read}
                  />
                  <SidebarItem
                    label={t("nav.zones")}
                    isChild
                    href={"/dns/zones"}
                    visible={permission?.dns?.read}
                  />
                  <SidebarItem
                    label={t("nav.dnsSettings")}
                    isChild
                    href={"/dns/settings"}
                    visible={permission.dns.read}
                  />
                </SidebarItem>
                <SidebarItem
                  icon={<TeamIcon />}
                  label={t("nav.team")}
                  collapsible
                  visible={permission.users.read}
                >
                  <SidebarItem
                    label={t("nav.users")}
                    isChild
                    href={"/team/users"}
                    visible={permission.users.read}
                  />
                  <SidebarItem
                    label={t("nav.serviceUsers")}
                    isChild
                    href={"/team/service-users"}
                    visible={permission.users.read}
                  />
                </SidebarItem>
                <ActivityNavigationItem />
              </SidebarItemGroup>

              <SidebarItemGroup>
                <SidebarItem
                  icon={<SettingsIcon />}
                  label={t("nav.settings")}
                  href={"/settings"}
                  exactPathMatch={true}
                  visible={permission.settings.read}
                />
              </SidebarItemGroup>
            </div>
            <NavigationVersionInfo />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

type SidebarItemGroupProps = {
  children: React.ReactNode;
};

export function SidebarItemGroup({ children }: SidebarItemGroupProps) {
  return (
    <div
      className={
        "mt-4 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 dark:border-nb-gray-800/60 space-y-[3px]"
      }
    >
      {children}
    </div>
  );
}

const ActivityNavigationItem = () => {
  const { permission } = usePermissions();
  const { isFeatureEnabled } = useAccountEntitlements();
  const { t } = useI18n();

  const flowLogsEnabled = isFeatureEnabled("flow_logs");
  const dnsLogsEnabled = isFeatureEnabled("dns_logs");

  return (
    <SidebarItem
      icon={<ActivityIcon />}
      label={t("nav.activity")}
      collapsible
      visible={permission.events.read}
    >
      <SidebarItem
        label={t("nav.auditEvents")}
        href={"/events/audit"}
        isChild
        exactPathMatch={true}
        visible={permission.events.read}
      />
      <SidebarItem
        label={t("nav.proxyEvents")}
        href={"/events/proxy"}
        isChild
        exactPathMatch={true}
        visible={permission.events.read}
      />
      <SidebarItem
        label={t("nav.networkLogs")}
        href={"/events/network"}
        isChild
        exactPathMatch={true}
        visible={permission.events.read && flowLogsEnabled}
      />
      <SidebarItem
        label={t("nav.dnsLogs")}
        href={"/events/dns"}
        isChild
        exactPathMatch={true}
        visible={permission.events.read && dnsLogsEnabled}
      />
    </SidebarItem>
  );
};
