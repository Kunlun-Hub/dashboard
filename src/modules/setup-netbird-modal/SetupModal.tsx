"use client";

import { ModalContent } from "@components/modal/Modal";
import Paragraph from "@components/Paragraph";
import { Tabs, TabsList, TabsTrigger } from "@components/Tabs";
import { cn } from "@utils/helpers";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import AndroidIcon from "@/assets/icons/AndroidIcon";
import AppleIcon from "@/assets/icons/AppleIcon";
import DockerIcon from "@/assets/icons/DockerIcon";
import IOSIcon from "@/assets/icons/IOSIcon";
import ShellIcon from "@/assets/icons/ShellIcon";
import WindowsIcon from "@/assets/icons/WindowsIcon";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import useOperatingSystem from "@/hooks/useOperatingSystem";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { PublicBrandingLogo } from "@/modules/account/PublicBrandingProvider";
import { VersionRelease } from "@/modules/settings/VersionReleasesTab";
import AndroidTab from "@/modules/setup-netbird-modal/AndroidTab";
import DockerTab from "@/modules/setup-netbird-modal/DockerTab";
import IOSTab from "@/modules/setup-netbird-modal/IOSTab";
import LinuxTab from "@/modules/setup-netbird-modal/LinuxTab";
import MacOSTab from "@/modules/setup-netbird-modal/MacOSTab";
import WindowsTab from "@/modules/setup-netbird-modal/WindowsTab";
import { fetchPublicVersionReleases } from "@/utils/unauthenticatedApi";

type OidcUserInfo = {
  given_name?: string;
};

type Props = {
  showClose?: boolean;
  user?: OidcUserInfo;
  setupKey?: string;
  showOnlyRoutingPeerOS?: boolean;
  className?: string;
};

export default function SetupModal({
  showClose = true,
  user,
  setupKey,
  showOnlyRoutingPeerOS = false,
  className,
}: Readonly<Props>) {
  return (
    <ModalContent showClose={showClose} className={className}>
      <SetupModalContent
        user={user}
        setupKey={setupKey}
        showOnlyRoutingPeerOS={showOnlyRoutingPeerOS}
      />
    </ModalContent>
  );
}

type SetupModalContentProps = {
  user?: OidcUserInfo;
  header?: boolean;
  tabAlignment?: "center" | "start" | "end";
  setupKey?: string;
  showOnlyRoutingPeerOS?: boolean;
  title?: string;
  hostname?: string;
  hideDocker?: boolean;
};

export function SetupModalContent({
  user,
  header = true,
  tabAlignment = "center",
  setupKey,
  showOnlyRoutingPeerOS,
  title,
  hostname,
  hideDocker = false,
}: Readonly<SetupModalContentProps>) {
  const { t } = useI18n();
  const os = useOperatingSystem();
  const [isFirstRun] = useLocalStorage<boolean>("netbird-first-run", true);
  const pathname = usePathname();
  const isInstallPage = pathname === "/install";
  const [publicVersions, setPublicVersions] = useState<VersionRelease[]>([]);

  useEffect(() => {
    if (!isInstallPage) return;

    let active = true;
    fetchPublicVersionReleases()
      .then((versions) => {
        if (active) setPublicVersions(versions);
      })
      .catch(() => {
        if (active) setPublicVersions([]);
      });

    return () => {
      active = false;
    };
  }, [isInstallPage]);

  const installVersions = isInstallPage ? publicVersions : undefined;

  const titleMessage = useMemo(() => {
    if (title) return title;

    if (isFirstRun && !isInstallPage) {
      const name = user?.given_name || t("setupModal.there");
      return (
        <>
          {t("setupModal.welcomeTitle", { name })} <br />
          {t("setupModal.welcomeSubtitle")}
        </>
      );
    }

    return setupKey
      ? t("setupModal.installWithSetupKey")
      : t("setupModal.installNetBird");
  }, [isFirstRun, isInstallPage, setupKey, t, title, user?.given_name]);

  return (
    <div className={"light-theme-surface"}>
      {isInstallPage && (
        <div className={"flex justify-center pt-6"}>
          <PublicBrandingLogo size={"large"} mobile={false} />
        </div>
      )}
      {header && (
        <div className={"text-center pb-5 pt-4 px-8"}>
          <h2
            className={cn(
              "max-w-lg mx-auto",
              setupKey ? "text-2xl" : "text-3xl",
            )}
          >
            {titleMessage}
          </h2>
          <Paragraph
            className={cn("mx-auto mt-3", setupKey ? "max-w-sm" : "max-w-xs")}
          >
            {setupKey
              ? t("setupModal.setupKeyDescription")
              : t("setupModal.defaultDescription")}
          </Paragraph>
        </div>
      )}

      <Tabs
        defaultValue={String(
          setupKey
            ? OperatingSystem.LINUX
            : isInstallPage
            ? OperatingSystem.WINDOWS
            : os,
        )}
      >
        <TabsList justify={tabAlignment} className={"pt-2 px-3"}>
          <TabsTrigger value={String(OperatingSystem.LINUX)}>
            <ShellIcon
              className={
                "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
              }
            />
            {t("setupModal.linux")}
          </TabsTrigger>

          <TabsTrigger value={String(OperatingSystem.WINDOWS)}>
            <WindowsIcon
              className={
                "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
              }
            />
            {t("setupModal.windows")}
          </TabsTrigger>
          <TabsTrigger value={String(OperatingSystem.APPLE)}>
            <AppleIcon
              className={
                "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
              }
            />
            {t("setupModal.macos")}
          </TabsTrigger>

          {!setupKey && (
            <>
              <TabsTrigger value={String(OperatingSystem.IOS)}>
                <IOSIcon
                  className={
                    "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
                  }
                />
                {t("setupModal.ios")}
              </TabsTrigger>
              <TabsTrigger value={String(OperatingSystem.ANDROID)}>
                <AndroidIcon
                  className={
                    "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
                  }
                />
                {t("setupModal.android")}
              </TabsTrigger>
            </>
          )}

          {!hideDocker && (
            <TabsTrigger value={String(OperatingSystem.DOCKER)}>
              <DockerIcon
                className={
                  "fill-neutral-500 dark:fill-nb-gray-500 group-data-[state=active]/trigger:fill-netbird dark:group-data-[state=active]/trigger:fill-netbird transition-all"
                }
              />
              {t("setupModal.docker")}
            </TabsTrigger>
          )}
        </TabsList>

        <LinuxTab
          setupKey={setupKey}
          showSetupKeyInfo={showOnlyRoutingPeerOS}
          hostname={hostname}
          versions={installVersions}
        />
        <WindowsTab
          setupKey={setupKey}
          showSetupKeyInfo={showOnlyRoutingPeerOS}
          hostname={hostname}
          versions={installVersions}
        />
        <MacOSTab
          setupKey={setupKey}
          showSetupKeyInfo={showOnlyRoutingPeerOS}
          hostname={hostname}
          versions={installVersions}
        />

        {!setupKey && (
          <>
            <AndroidTab versions={installVersions} />
            <IOSTab />
          </>
        )}

        {!hideDocker && (
          <DockerTab
            setupKey={setupKey}
            showSetupKeyInfo={showOnlyRoutingPeerOS}
            hostname={hostname}
          />
        )}
      </Tabs>
    </div>
  );
}

type SetupKeyParameterProps = {
  setupKey?: string;
};

export const SetupKeyParameter = ({ setupKey }: SetupKeyParameterProps) => {
  return (
    setupKey && (
      <>
        {" "}
        --setup-key <span className={"text-netbird"}>{setupKey}</span>
      </>
    )
  );
};

export const HostnameParameter = ({ hostname }: { hostname?: string }) => {
  return (
    hostname && (
      <>
        {" "}
        --hostname{" "}
        <span className={"text-netbird"}>
          {"'"}
          {hostname}
          {"'"}
        </span>
      </>
    )
  );
};

export const RoutingPeerSetupKeyInfo = () => {
  const { t } = useI18n();

  return (
    <div
      className={
        "flex gap-2 mt-1 items-center text-xs text-neutral-500 font-normal mb-1 dark:text-nb-gray-300"
      }
    >
      {t("setupModal.setupKeyInfoLine1")}
      <br />
      {t("setupModal.setupKeyInfoLine2")}
    </div>
  );
};
