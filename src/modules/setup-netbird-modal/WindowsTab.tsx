import Button from "@components/Button";
import Code from "@components/Code";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import useFetchApi from "@utils/api";
import { GRPC_API_ORIGIN } from "@utils/netbird";
import { DownloadIcon, PackageOpenIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { VersionRelease } from "@/modules/settings/VersionReleasesTab";
import {
  NetBirdUpCommand,
  RoutingPeerSetupKeyInfo,
} from "@/modules/setup-netbird-modal/SetupModal";

type Props = {
  setupKey?: string;
  setupKeyContent?: React.ReactNode;
  setupKeyPlaceholder?: string;
  showSetupKeyInfo?: boolean;
  hostname?: string;
  versions?: VersionRelease[];
};

export default function WindowsTab({ versions, ...props }: Readonly<Props>) {
  if (versions) {
    return <WindowsTabContent {...props} versions={versions} />;
  }

  return <AuthenticatedWindowsTab {...props} />;
}

function AuthenticatedWindowsTab(props: Readonly<Props>) {
  const { data: versions } = useFetchApi<VersionRelease[]>("/version-releases");

  return <WindowsTabContent {...props} versions={versions || []} />;
}

function WindowsTabContent({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo,
  hostname,
  versions,
}: Readonly<Props & { versions: VersionRelease[] }>) {
  const { t } = useI18n();
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const windowsVersions = useMemo(
    () => (versions || []).filter((v) => v.platform === "windows"),
    [versions],
  );
  const versionOptions: SelectOption[] = useMemo(
    () =>
      windowsVersions.map((v) => ({
        label: v.version + (v.isLatest ? " (最新)" : ""),
        value: v.id,
      })),
    [windowsVersions],
  );

  useEffect(() => {
    setSelectedVersionId((current) => {
      if (current && windowsVersions.some((v) => v.id === current)) {
        return current;
      }
      const latestVersion =
        windowsVersions.find((v) => v.isLatest) || windowsVersions[0];
      return latestVersion?.id || "";
    });
  }, [windowsVersions]);

  const currentUrl =
    windowsVersions.find((v) => v.id === selectedVersionId)?.downloadUrl || "";

  // The CLI-run branch is required for the server flow (setupKeyContent
  // present) even before a key is generated — the placeholder keeps the
  // command shape consistent. Otherwise we fall back to the existing
  // setupKey-driven branching.
  const useCliRun = !!setupKey || !!setupKeyContent;
  const baseMgmtStep = 2;
  const keyStep = GRPC_API_ORIGIN ? 3 : 2;
  const runStep = keyStep + (setupKeyContent ? 1 : 0);
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
                value={selectedVersionId}
                className={"w-[170px]"}
                onChange={setSelectedVersionId}
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
                  disabled={!currentUrl}
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
            <Steps.Step step={baseMgmtStep}>
              <p>{t("setupModal.managementUrlInstructions")}</p>
              <Code>
                <Code.Line>{GRPC_API_ORIGIN}</Code.Line>
              </Code>
            </Steps.Step>
          )}

          {setupKeyContent && (
            <Steps.Step step={keyStep}>{setupKeyContent}</Steps.Step>
          )}

          {useCliRun ? (
            <Steps.Step step={runStep} line={false}>
              <p>
                {t("setupModal.openCommandLineRunNetBird")}{" "}
                {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
              </p>

              <Code>
                <NetBirdUpCommand
                  setupKey={setupKey}
                  setupKeyPlaceholder={setupKeyPlaceholder}
                  hostname={hostname}
                />
              </Code>
            </Steps.Step>
          ) : (
            <>
              <Steps.Step step={runStep}>
                <p>{t("setupModal.clickConnectTray")}</p>
              </Steps.Step>
              <Steps.Step step={runStep + 1} line={false}>
                <p>{t("setupModal.signUpWithEmail")}</p>
              </Steps.Step>
            </>
          )}
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
