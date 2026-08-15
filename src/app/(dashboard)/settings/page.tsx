"use client";

import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { VerticalTabs } from "@components/VerticalTabs";
import {
  ActivityIcon,
  AlertOctagonIcon,
  ChartNoAxesCombined,
  FingerprintIcon,
  FolderGit2Icon,
  GlobeIcon,
  KeyRound,
  LockIcon,
  MailIcon,
  MonitorSmartphoneIcon,
  NetworkIcon,
  PaletteIcon,
  ShieldIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { EntitlementLockedTab } from "@/modules/account/EntitlementGate";
import { useAccount } from "@/modules/account/useAccount";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";
import { useDashboardFeatures } from "@/modules/account/useDashboardFeatures";
import AuthenticationTab from "@/modules/settings/AuthenticationTab";
import ClientSettingsTab from "@/modules/settings/ClientSettingsTab";
import DangerZoneTab from "@/modules/settings/DangerZoneTab";
import EmailSettingsTab from "@/modules/settings/EmailSettingsTab";
import FlowLogsSettingsTab from "@/modules/settings/FlowLogsSettingsTab";
import IdentityProvidersTab from "@/modules/settings/IdentityProvidersTab";
import LicenseSettingsTab from "@/modules/settings/LicenseSettingsTab";
import NetworkSettingsTab from "@/modules/settings/NetworkSettingsTab";
import PermissionsTab from "@/modules/settings/PermissionsTab";
import SetupKeysTab from "@/modules/settings/SetupKeysTab";
import GroupsSettings from "@/modules/settings/GroupsSettings";
import MetricsTab from "@/modules/settings/MetricsTab";
import BrandingSettingsTab from "@/modules/settings/BrandingSettingsTab";
import VersionReleasesTab from "@/modules/settings/VersionReleasesTab";
import {
  CloudSettingsTabContent,
  CloudSettingsTabTrigger,
} from "@/cloud/settings/CloudSettings";

export default function NetBirdSettings() {
  const queryParams = useSearchParams();
  const queryTab = queryParams.get("tab");
  const { permission } = usePermissions();
  const { billing: billingEnabled } = useDashboardFeatures();
  const { isFeatureEnabled } = useAccountEntitlements();
  const { t } = useI18n();

  const initialTab = useMemo(() => {
    if (permission?.settings?.read) return "authentication";
    if (billingEnabled && permission?.billing?.update)
      return "plans-and-billing";
    return "authentication";
  }, [billingEnabled, permission]);

  const [selectedTab, setSelectedTab] = useState(initialTab);
  const tab = queryTab ?? selectedTab;

  const account = useAccount();
  const flowLogsEnabled = isFeatureEnabled("flow_logs");
  const brandingEnabled = isFeatureEnabled("branding");

  return (
    <PageContainer>
      <VerticalTabs value={tab} onChange={setSelectedTab}>
        <VerticalTabs.List>
          {permission.settings.read && (
            <>
              <VerticalTabs.Trigger
                value="authentication"
                data-testid="settings-tab-authentication"
              >
                <ShieldIcon size={14} />
                {t("settings.authentication")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger value="license">
                <KeyRound size={14} />
                {t("settings.license")}
              </VerticalTabs.Trigger>
              {permission.setup_keys.read && (
                <VerticalTabs.Trigger value="setup-keys">
                  <KeyRound size={14} />
                  Setup Keys
                </VerticalTabs.Trigger>
              )}
              {account?.settings?.embedded_idp_enabled &&
                permission?.identity_providers?.read && (
                  <VerticalTabs.Trigger value="identity-providers">
                    <FingerprintIcon size={14} />
                    Identity Providers
                  </VerticalTabs.Trigger>
                )}
              <VerticalTabs.Trigger
                value="groups"
                data-testid="settings-tab-groups"
              >
                <FolderGit2Icon size={14} />
                Groups
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="permissions"
                data-testid="settings-tab-permissions"
              >
                <LockIcon size={14} />
                Permissions
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="networks"
                data-testid="settings-tab-networks"
              >
                <NetworkIcon size={14} />
                Networks
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="clients"
                data-testid="settings-tab-clients"
              >
                <MonitorSmartphoneIcon size={14} />
                Clients
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger value="email">
                <MailIcon size={14} />
                {t("settings.email")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="flow-logs"
                disabled={!flowLogsEnabled}
              >
                <ActivityIcon size={14} />
                {t("settings.flowLogs")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger value="metrics">
                <ChartNoAxesCombined size={14} />
                Metrics
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger
                value="branding"
                disabled={!brandingEnabled}
              >
                <PaletteIcon size={14} />
                {t("settings.branding")}
              </VerticalTabs.Trigger>
              <VerticalTabs.Trigger value="version-releases">
                <GlobeIcon size={14} />
                {t("settings.versionReleases")}
              </VerticalTabs.Trigger>
            </>
          )}
          <CloudSettingsTabTrigger />
          <DangerZoneTabTrigger />
        </VerticalTabs.List>
        <RestrictedAccess
          page={"Settings"}
          hasAccess={permission?.billing?.read || permission?.settings?.read}
        >
          <div className={"border-l border-nb-gray-930 w-full"}>
            {account && <AuthenticationTab account={account} />}
            {account && <LicenseSettingsTab account={account} />}
            {permission.setup_keys.read && <SetupKeysTab />}
            {account?.settings?.embedded_idp_enabled &&
              permission?.identity_providers?.read && <IdentityProvidersTab />}
            {account && <PermissionsTab account={account} />}
            {account && <GroupsSettings account={account} />}
            {account && <NetworkSettingsTab account={account} />}
            {account && <ClientSettingsTab account={account} />}
            {account && <EmailSettingsTab />}
            {account &&
              (flowLogsEnabled ? (
                <FlowLogsSettingsTab account={account} />
              ) : (
                <EntitlementLockedTab
                  value="flow-logs"
                  feature={t("settings.flowLogs")}
                />
              ))}
            {account && <MetricsTab account={account} />}
            {account &&
              (brandingEnabled ? (
                <BrandingSettingsTab account={account} />
              ) : (
                <EntitlementLockedTab
                  value="branding"
                  feature={t("settings.branding")}
                />
              ))}
            {account && <VersionReleasesTab />}
            {account && <DangerZoneTab account={account} />}
            <CloudSettingsTabContent />
          </div>
        </RestrictedAccess>
      </VerticalTabs>
    </PageContainer>
  );
}

const DangerZoneTabTrigger = () => {
  const { isOwner } = useLoggedInUser();

  const { isAccountWithMSPParent } = useMSP();
  if (isAccountWithMSPParent) return;

  return (
    isOwner && (
      <VerticalTabs.Trigger value="danger-zone" disabled={!isOwner}>
        <AlertOctagonIcon size={14} />
        Danger zone
      </VerticalTabs.Trigger>
    )
  );
};
