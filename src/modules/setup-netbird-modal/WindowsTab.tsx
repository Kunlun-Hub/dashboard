import Button from "@components/Button";
import Code from "@components/Code";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import useFetchApi from "@utils/api";
import { getNetBirdUpCommand, GRPC_API_ORIGIN } from "@utils/netbird";
import { DownloadIcon, PackageOpenIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import {
  PlatformType,
  VersionRelease,
} from "@/modules/settings/VersionReleasesTab";
import {
  HostnameParameter,
  RoutingPeerSetupKeyInfo,
  SetupKeyParameter,
} from "@/modules/setup-netbird-modal/SetupModal";

type Props = {
  setupKey?: string;
  showSetupKeyInfo?: boolean;
  hostname?: string;
};

export default function WindowsTab(props: Readonly<Props>) {
  const pathname = usePathname();

  if (pathname === "/install") {
    return <WindowsTabContent {...props} versions={[]} />;
  }

  return <AuthenticatedWindowsTab {...props} />;
}

function AuthenticatedWindowsTab(props: Readonly<Props>) {
  const { data: versions } = useFetchApi<VersionRelease[]>("/version-releases");

  return <WindowsTabContent {...props} versions={versions || []} />;
}

function WindowsTabContent({
  setupKey,
  showSetupKeyInfo,
  hostname,
  versions,
}: Readonly<Props & { versions: VersionRelease[] }>) {
  const { t } = useI18n();
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  const windowsVersions = (versions || []).filter(
    (v) => v.platform === "windows",
  );

  // Only show published versions
  const versionOptions: SelectOption[] = windowsVersions.map((v) => ({
    label: v.version + (v.isLatest ? " (最新)" : ""),
    value: v.downloadUrl,
  }));

  useEffect(() => {
    if (windowsVersions.length > 0) {
      const latestVersion =
        windowsVersions.find((v) => v.isLatest) || windowsVersions[0];
      setSelectedVersion(latestVersion.downloadUrl);
    }
  }, [windowsVersions]);

  const currentUrl = selectedVersion || "";

  return (
    <TabsContent value={String(OperatingSystem.WINDOWS)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <PackageOpenIcon size={16} />
          {t("setupModal.windowsInstallTitle")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p>{t("setupModal.windowsStep1")}</p>
            <div className={"flex gap-4 mt-1 flex-wrap items-center"}>
              <SelectDropdown
                value={currentUrl}
                className={"w-[170px]"}
                onChange={setSelectedVersion}
                placeholder={
                  versionOptions.length === 0
                    ? "请先发布版本"
                    : t("setupModal.selectArchitecture")
                }
                options={versionOptions}
              />
              {versionOptions.length > 0 ? (
                <Button
                  variant={"primary"}
                  onClick={() =>
                    window.open(currentUrl, "_blank", "noopener noreferrer")
                  }
                >
                  <DownloadIcon size={14} />
                  {t("setupModal.downloadNetBird")}
                </Button>
              ) : (
                <Button variant={"primary"} disabled>
                  <DownloadIcon size={14} />
                  请先在设置中发布版本
                </Button>
              )}
            </div>
          </Steps.Step>

          {GRPC_API_ORIGIN && (
            <Steps.Step step={2}>
              <p>{t("setupModal.managementUrlInstructions")}</p>
              <Code>
                <Code.Line>{GRPC_API_ORIGIN}</Code.Line>
              </Code>
            </Steps.Step>
          )}

          {setupKey ? (
            <Steps.Step step={GRPC_API_ORIGIN ? 3 : 2} line={false}>
              <p>
                {t("setupModal.openCommandLineRunNetBird")}{" "}
                {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
              </p>

              <Code>
                <Code.Line>
                  {getNetBirdUpCommand()}
                  <SetupKeyParameter setupKey={setupKey} />
                  <HostnameParameter hostname={hostname} />
                </Code.Line>
              </Code>
            </Steps.Step>
          ) : (
            <>
              <Steps.Step step={GRPC_API_ORIGIN ? 3 : 2}>
                <p>{t("setupModal.clickConnectTray")}</p>
              </Steps.Step>
              <Steps.Step step={GRPC_API_ORIGIN ? 4 : 3} line={false}>
                <p>{t("setupModal.signUpWithEmail")}</p>
              </Steps.Step>
            </>
          )}
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
