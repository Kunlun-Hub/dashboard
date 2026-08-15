import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import CopyToClipboardText from "@components/CopyToClipboardText";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import { Textarea } from "@components/Textarea";
import { SmallBadge } from "@components/ui/SmallBadge";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { getDashboardServerURL } from "@utils/license";
import {
  BadgeAlertIcon,
  BadgeCheckIcon,
  KeyRoundIcon,
  Trash2Icon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";
import {
  AccountLicense,
  LicenseStatus,
  UpdateAccountLicenseRequest,
} from "@/interfaces/AccountLicense";
import { ResourceUsagePanel } from "@/modules/account/ResourceUsage";
import { useAccountLicense } from "@/modules/account/useAccountLicense";

type Props = {
  account: Account;
};

export default function LicenseSettingsTab({ account }: Readonly<Props>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const { license, isLoading } = useAccountLicense();
  const [licenseKey, setLicenseKey] = useState("");
  const currentServerURL = getDashboardServerURL();

  const licensePath = `/accounts/${account.id}/license`;
  const entitlementsPath = `/accounts/${account.id}/entitlements`;
  const updateRequest = useApiCall<AccountLicense>(licensePath, true);

  const startsAt = useMemo(
    () => formatLicenseDate(license?.start_time, t),
    [license?.start_time, t],
  );
  const expiresAt = useMemo(
    () => formatLicenseDate(license?.end_time, t),
    [license?.end_time, t],
  );

  const refreshLicenseState = (nextLicense: AccountLicense) => {
    mutate(licensePath, nextLicense, false);
    mutate(entitlementsPath);
    setLicenseKey("");
  };

  const saveLicense = () => {
    const request: UpdateAccountLicenseRequest = {
      license_key: licenseKey.trim(),
      server_url: currentServerURL,
    };

    notify({
      title: t("licenseSettings.saveTitle"),
      description: t("licenseSettings.updatedDescription"),
      promise: updateRequest.put(request).then(refreshLicenseState),
      loadingMessage: t("licenseSettings.updating"),
    });
  };

  const clearLicense = () => {
    const request: UpdateAccountLicenseRequest = {
      license_key: "",
      server_url: currentServerURL,
    };

    notify({
      title: t("licenseSettings.clearTitle"),
      description: t("licenseSettings.clearedDescription"),
      promise: updateRequest.put(request).then(refreshLicenseState),
      loadingMessage: t("licenseSettings.clearing"),
    });
  };

  const active = license?.status === "active";

  return (
    <Tabs.Content value={"license"} className={"w-full"}>
      <div className={"p-default py-6 max-w-3xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=license"}
            label={t("settings.license")}
            icon={<KeyRoundIcon size={14} />}
            active
          />
        </Breadcrumbs>

        <div className={"flex items-start justify-between gap-6"}>
          <div>
            <h1>{t("settings.license")}</h1>
            <p className={"text-sm text-neutral-500 dark:text-nb-gray-400 mt-2"}>
              {t("licenseSettings.description")}
            </p>
          </div>
          <LicenseStatusBadge status={license?.status} loading={isLoading} />
        </div>

        <div
          className={
            "mt-8 border border-neutral-200 dark:border-nb-gray-920 rounded-md overflow-hidden"
          }
        >
          <LicenseInfoRow
            label={t("licenseSettings.plan")}
            value={planLabel(t, license?.license)}
            icon={
              active ? (
                <BadgeCheckIcon size={15} />
              ) : (
                <BadgeAlertIcon size={15} />
              )
            }
          />
          <LicenseInfoRow
            label={t("licenseSettings.status")}
            value={statusLabel(t, license?.status)}
            icon={
              active ? (
                <BadgeCheckIcon size={15} />
              ) : (
                <BadgeAlertIcon size={15} />
              )
            }
          />
          <LicenseInfoRow
            label={t("licenseSettings.machineCode")}
            value={
              license?.machine_id ? (
                <CopyToClipboardText
                  className={"max-w-full min-w-0 font-mono text-xs"}
                  alwaysShowIcon
                >
                  {license.machine_id}
                </CopyToClipboardText>
              ) : (
                t("common.unknown")
              )
            }
          />
          <LicenseInfoRow
            label={t("licenseSettings.authorizedUrl")}
            value={license?.server_url || t("licenseSettings.noKey")}
          />
          <LicenseInfoRow
            label={t("licenseSettings.authorizedUser")}
            value={license?.name || t("licenseSettings.noKey")}
          />
          <LicenseInfoRow
            label={t("licenseSettings.startTime")}
            value={startsAt}
          />
          <LicenseInfoRow
            label={t("licenseSettings.endTime")}
            value={expiresAt}
          />
          <LicenseInfoRow
            label={t("licenseSettings.installedKey")}
            value={license?.license_key_masked || t("licenseSettings.noKey")}
          />
        </div>

        {license?.message && (
          <p
            className={cn(
              "mt-4 text-sm",
              active ? "text-green-500" : "text-yellow-500",
            )}
          >
            {license.message}
          </p>
        )}

        <ResourceUsagePanel
          features={license?.features}
          featureItems={["ha_routes"]}
          limits={license?.limits}
          usage={license?.usage}
          items={[
            "users",
            "peers",
            "self_hosted_relays",
            "reverse_proxy_servers",
            "custom_domains",
            "custom_rules",
          ]}
        />

        <div className={"mt-8"}>
          <Label>{t("licenseSettings.licenseKey")}</Label>
          <Textarea
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            placeholder={t("licenseSettings.licenseKeyPlaceholder")}
            className={"min-h-[92px] font-mono text-xs"}
            resize
          />
          <div className={"mt-4 flex items-center gap-3"}>
            <Button
              variant={"primary"}
              disabled={licenseKey.trim().length === 0}
              onClick={saveLicense}
            >
              <KeyRoundIcon size={14} />
              {t("actions.saveChanges")}
            </Button>
            <Button
              variant={"danger-outline"}
              disabled={!license?.license_key_masked}
              onClick={clearLicense}
            >
              <Trash2Icon size={14} />
              {t("licenseSettings.clear")}
            </Button>
          </div>
        </div>
      </div>
    </Tabs.Content>
  );
}

function LicenseInfoRow({
  label,
  value,
  icon,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}>) {
  return (
    <div
      className={
        "grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] gap-4 border-t first:border-t-0 border-neutral-200 dark:border-nb-gray-920 px-5 py-4"
      }
    >
      <div className={"text-sm text-neutral-500 dark:text-nb-gray-400"}>
        {label}
      </div>
      <div className={"flex items-center gap-2 min-w-0 text-sm"}>
        {icon}
        <div className={"min-w-0 truncate"}>{value}</div>
      </div>
    </div>
  );
}

function LicenseStatusBadge({
  status,
  loading,
}: Readonly<{ status?: LicenseStatus; loading: boolean }>) {
  const { t } = useI18n();
  if (loading) {
    return (
      <SmallBadge
        text={t("licenseSettings.loading")}
        variant={"blue"}
        size={"md"}
        className={"mt-1"}
      />
    );
  }

  const active = status === "active";
  return (
    <SmallBadge
      text={statusLabel(t, status)}
      variant={active ? "green" : "yellow"}
      size={"md"}
      className={"mt-1"}
    />
  );
}

function statusLabel(
  t: ReturnType<typeof useI18n>["t"],
  status?: LicenseStatus,
) {
  switch (status) {
    case "active":
      return t("licenseSettings.status.active");
    case "invalid":
      return t("licenseSettings.status.invalid");
    case "url_mismatch":
      return t("licenseSettings.status.urlMismatch");
    case "not_started":
      return t("licenseSettings.status.notStarted");
    case "expired":
      return t("licenseSettings.status.expired");
    case "unlicensed":
    default:
      return t("licenseSettings.status.unlicensed");
  }
}

function planLabel(
  t: ReturnType<typeof useI18n>["t"],
  licenseTypes?: AccountLicense["license"],
) {
  if (licenseTypes?.includes("enterprise")) {
    return t("licenseSettings.plan.enterprise");
  }
  if (licenseTypes?.includes("try")) {
    return t("licenseSettings.plan.trial");
  }
  return t("licenseSettings.plan.basic");
}

function formatLicenseDate(
  value: string | undefined,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (!value) {
    return t("licenseSettings.noKey");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
