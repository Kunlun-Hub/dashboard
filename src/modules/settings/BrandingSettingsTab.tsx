"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { NetBirdLogo } from "@components/NetBirdLogo";
import { notify } from "@components/Notification";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import {
  ImageIcon,
  PaletteIcon,
  RotateCcwIcon,
  TypeIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";
import {
  defaultBrandingTitle,
  getAccountBrandingLogoDataURL,
  getAccountBrandingTitle,
} from "@/modules/account/accountBranding";

const maxLogoFileSize = 256 * 1024;
const maxTabTitleLength = 80;
const acceptedLogoTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

type Props = {
  account: Account;
};

export default function BrandingSettingsTab({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveRequest = useApiCall<Account>("/accounts/" + account.id, true);

  const initialLogoDataURL = getAccountBrandingLogoDataURL(account);
  const initialTabTitle = getAccountBrandingTitle(account);
  const [logoDataURL, setLogoDataURL] = useState(initialLogoDataURL);
  const [tabTitle, setTabTitle] = useState(initialTabTitle);
  const [logoError, setLogoError] = useState("");

  const { hasChanges, updateRef } = useHasChanges([logoDataURL, tabTitle]);

  const tabTitleError = useMemo(() => {
    if (tabTitle.length > maxTabTitleLength) {
      return t("brandingSettings.tabTitleLengthError", {
        count: maxTabTitleLength,
      });
    }
    return "";
  }, [tabTitle, t]);

  const saveChanges = () => {
    const nextLogoDataURL = logoDataURL.trim();
    const nextTabTitle = tabTitle.trim();

    notify({
      title: t("brandingSettings.notifyTitle"),
      description: t("brandingSettings.updatedDescription"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              branding_logo_data_url: nextLogoDataURL,
              branding_tab_title: nextTabTitle,
            },
          },
        })
        .then(() => {
          mutate("/accounts");
          setLogoDataURL(nextLogoDataURL);
          setTabTitle(nextTabTitle);
          updateRef([nextLogoDataURL, nextTabTitle]);
        }),
      loadingMessage: t("brandingSettings.updating"),
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAcceptedLogoFile(file)) {
      setLogoError(t("brandingSettings.logoTypeError"));
      return;
    }

    if (file.size > maxLogoFileSize) {
      setLogoError(
        t("brandingSettings.logoSizeError", {
          size: Math.round(maxLogoFileSize / 1024),
        }),
      );
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        setLogoError(t("brandingSettings.logoReadError"));
        return;
      }
      setLogoError("");
      setLogoDataURL(reader.result);
    });
    reader.addEventListener("error", () => {
      setLogoError(t("brandingSettings.logoReadError"));
    });
    reader.readAsDataURL(file);
  };

  const resetBranding = () => {
    setLogoDataURL("");
    setTabTitle("");
    setLogoError("");
  };

  return (
    <Tabs.Content value={"branding"} className={"w-full"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=branding"}
            label={t("settings.branding")}
            icon={<PaletteIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between gap-4"}>
          <h1>{t("settings.branding")}</h1>
          <div className={"flex items-center gap-2"}>
            <Button
              variant={"secondary"}
              disabled={!permission.settings.update}
              onClick={resetBranding}
            >
              <RotateCcwIcon size={16} />
              {t("brandingSettings.reset")}
            </Button>
            <Button
              variant={"primary"}
              disabled={
                !hasChanges ||
                !permission.settings.update ||
                !!logoError ||
                !!tabTitleError
              }
              onClick={saveChanges}
              data-cy={"save-branding-settings"}
            >
              {t("actions.saveChanges")}
            </Button>
          </div>
        </div>

        <div className={"flex flex-col gap-8 w-full mt-8"}>
          <div
            className={
              "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            }
          >
            <div className={"min-w-[260px]"}>
              <Label>
                <ImageIcon size={15} />
                {t("brandingSettings.logo")}
              </Label>
              <HelpText>{t("brandingSettings.logoHelp")}</HelpText>
            </div>
            <div className={"flex flex-col gap-3 w-full"}>
              <div
                className={
                  "h-20 w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 flex items-center dark:border-nb-gray-800 dark:bg-nb-gray-920"
                }
              >
                {logoDataURL ? (
                  <Image
                    src={logoDataURL}
                    width={180}
                    height={48}
                    alt={t("brandingSettings.logoPreview")}
                    className={"max-h-12 w-auto object-contain"}
                    unoptimized
                  />
                ) : (
                  <NetBirdLogo mobile={false} />
                )}
              </div>
              <div className={"flex flex-wrap gap-2"}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedLogoTypes.join(",")}
                  className={"sr-only"}
                  onChange={handleLogoUpload}
                />
                <Button
                  variant={"secondary"}
                  disabled={!permission.settings.update}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon size={16} />
                  {t("brandingSettings.uploadLogo")}
                </Button>
                <Button
                  variant={"default-outline"}
                  disabled={!permission.settings.update || !logoDataURL}
                  onClick={() => {
                    setLogoDataURL("");
                    setLogoError("");
                  }}
                >
                  <XIcon size={16} />
                  {t("brandingSettings.removeLogo")}
                </Button>
              </div>
              {logoError && (
                <p className={"text-xs text-red-500"}>{logoError}</p>
              )}
            </div>
          </div>

          <div
            className={
              "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            }
          >
            <div className={"min-w-[260px]"}>
              <Label>
                <TypeIcon size={15} />
                {t("brandingSettings.tabTitle")}
              </Label>
              <HelpText>{t("brandingSettings.tabTitleHelp")}</HelpText>
            </div>
            <div className={"w-full"}>
              <Input
                value={tabTitle}
                maxLength={maxTabTitleLength}
                placeholder={defaultBrandingTitle}
                error={tabTitleError}
                disabled={!permission.settings.update}
                onChange={(event) => setTabTitle(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </Tabs.Content>
  );
}

function isAcceptedLogoFile(file: File) {
  if (acceptedLogoTypes.includes(file.type)) return true;
  return /\.(jpe?g|png|svg|webp)$/i.test(file.name);
}
