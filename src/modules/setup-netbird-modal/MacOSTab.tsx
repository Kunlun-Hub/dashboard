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
import React, { useEffect, useState } from "react";
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
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  // Mirrors WindowsTab: server flow (setupKeyContent present) forces
  // the CLI run branch so the netbird up command stays visible while
  // the operator generates a key.
  const useCliRun = !!setupKey || !!setupKeyContent;
  const baseMgmtStep = 2;
  const keyStep = GRPC_API_ORIGIN ? 3 : 2;
  const runStep = keyStep + (setupKeyContent ? 1 : 0);
  const usingSetupKeyParam = !!setupKey || !!setupKeyPlaceholder;
  const macosVersions = versions.filter((v) => v.platform === "macos");
  const versionOptions: SelectOption[] = macosVersions.map((v) => ({
    label: v.version + (v.isLatest ? " (最新)" : ""),
    value: v.downloadUrl,
  }));

  useEffect(() => {
    if (macosVersions.length > 0) {
      const latestVersion =
        macosVersions.find((v) => v.isLatest) || macosVersions[0];
      setSelectedVersion(latestVersion.downloadUrl);
    }
  }, [macosVersions]);

  const currentUrl = selectedVersion || "";

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
            <Steps.Step step={baseMgmtStep}>
              <p>
                {`Click on "Settings" then "Advanced Settings" from the NetBird icon in your system tray and enter the following "Management URL"`}
              </p>
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
                <p>
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Click on "Connect" from the NetBird icon in your system tray
                </p>
              </Steps.Step>
              <Steps.Step step={runStep + 1} line={false}>
                <p>Sign up using your email address</p>
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
                    curl -fsSL https://pkgs.netbird.io/install.sh | sh
                  </Code>
                </Steps.Step>
                <Steps.Step step={2} line={false}>
                  <p>
                    Run NetBird {!usingSetupKeyParam && "and log in the browser"}
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
                      `brew install netbirdio/tap/netbird`,
                      `brew install --cask netbirdio/tap/netbird-ui`,
                    ].join("\n")}
                  >
                    <Code.Comment>
                      {t("setupModal.cliOnlyComment")}
                    </Code.Comment>
                    <Code.Line>brew install netbirdio/tap/netbird</Code.Line>
                    <Code.Comment>
                      {t("setupModal.guiPackageComment")}
                    </Code.Comment>
                    <Code.Line>
                      brew install --cask netbirdio/tap/netbird-ui
                    </Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={3}>
                  <p>{t("setupModal.startNetBirdDaemon")}</p>
                  <Code>
                    <Code.Line>sudo netbird service install</Code.Line>
                    <Code.Line>sudo netbird service start</Code.Line>
                  </Code>
                </Steps.Step>
                <Steps.Step step={4} line={false}>
                  <p>
                    Run NetBird {!usingSetupKeyParam && "and log in the browser"}
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
