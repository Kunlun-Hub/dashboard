import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/Accordion";
import Button from "@components/Button";
import Code from "@components/Code";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import Separator from "@components/Separator";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import useFetchApi from "@utils/api";
import { GRPC_API_ORIGIN } from "@utils/netbird";
import {
  BeerIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PackageOpenIcon,
  TerminalSquareIcon,
} from "lucide-react";
import Link from "next/link";
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

export default function MacOSTab({ versions, ...props }: Readonly<Props>) {
  if (versions) {
    return <MacOSTabContent {...props} versions={versions} />;
  }

  return <AuthenticatedMacOSTab {...props} />;
}

function AuthenticatedMacOSTab(props: Readonly<Props>) {
  const { data: versions } = useFetchApi<VersionRelease[]>("/version-releases");

  return <MacOSTabContent {...props} versions={versions || []} />;
}

function MacOSTabContent({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo,
  hostname,
  versions = [],
}: Readonly<Props>) {
  const { t } = useI18n();
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  // Mirrors WindowsTab: server flow (setupKeyContent present) forces
  // the CLI run branch so the netbird up command stays visible while
  // the operator generates a key.
  const useCliRun = !!setupKey || !!setupKeyContent;
  const baseMgmtStep = 2;
  const keyStep = GRPC_API_ORIGIN ? 3 : 2;
  const runStep = keyStep + (setupKeyContent ? 1 : 0);
  const usingSetupKeyParam = !!setupKey || !!setupKeyPlaceholder;
  const macosVersions = useMemo(
    () => versions.filter((v) => v.platform === "macos"),
    [versions],
  );
  const versionOptions: SelectOption[] = useMemo(
    () =>
      macosVersions.map((v) => ({
        label: v.version + (v.isLatest ? " (最新)" : ""),
        value: v.id,
      })),
    [macosVersions],
  );

  useEffect(() => {
    setSelectedVersionId((current) => {
      if (current && macosVersions.some((v) => v.id === current)) {
        return current;
      }
      const latestVersion =
        macosVersions.find((v) => v.isLatest) || macosVersions[0];
      return latestVersion?.id || "";
    });
  }, [macosVersions]);

  const currentUrl =
    macosVersions.find((v) => v.id === selectedVersionId)?.downloadUrl || "";

  return (
    <TabsContent value={String(OperatingSystem.APPLE)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <PackageOpenIcon size={16} />
          {t("setupModal.macosInstallTitle")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <div className={"flex items-center gap-1 text-sm font-light"}>
              {t("setupModal.macosStep1")}
            </div>
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
                {t("setupModal.openTerminalRunNetBird")}{" "}
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
      <Separator />
      <TabsContentPadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <TerminalSquareIcon size={16} />
              {t("setupModal.installManuallyTerminal")}
            </AccordionTrigger>
            <AccordionContent>
              <Steps>
                <Steps.Step step={1}>
                  <Code>
                    curl -fsSL /install.sh | sh
                  </Code>
                </Steps.Step>
                <Steps.Step step={2} line={false}>
                  <p>
                    {t("setupModal.runNetBird")}
                    {!usingSetupKeyParam &&
                      ` ${t("setupModal.andLogInBrowser")}`}
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
              </Steps>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContentPadding>
      <Separator />
      <TabsContentPadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <BeerIcon size={16} /> {t("setupModal.installManuallyHomebrew")}
            </AccordionTrigger>
            <AccordionContent>
              <Steps>
                <Steps.Step step={1}>
                  <p>{t("setupModal.downloadInstallHomebrew")}</p>
                  <div className={"flex gap-4"}>
                    <Link href={"https://brew.sh/"} passHref target={"_blank"}>
                      <Button variant={"primary"}>
                        <ExternalLinkIcon size={14} />
                        {t("setupModal.homebrewGuide")}
                      </Button>
                    </Link>
                  </div>
                </Steps.Step>
                <Steps.Step step={2}>
                  <p>{t("setupModal.installNetBird")}</p>
                  <Code
                    codeToCopy={[
                      `# ${t("setupModal.homebrewUnavailable")}`,
                    ].join("\n")}
                  >
                    <Code.Comment>
                      # {t("setupModal.homebrewUnavailable")}
                    </Code.Comment>
                  </Code>
                </Steps.Step>
                <Steps.Step step={3}>
                  <p>{t("setupModal.startNetBirdDaemon")}</p>
                  <Code>
                    <Code.Line>sudo cloink service install</Code.Line>
                    <Code.Line>sudo cloink service start</Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={4} line={false}>
                  <p>
                    {t("setupModal.runNetBird")}
                    {!usingSetupKeyParam &&
                      ` ${t("setupModal.andLogInBrowser")}`}
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
              </Steps>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContentPadding>
    </TabsContent>
  );
}
