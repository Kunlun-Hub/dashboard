import InlineLink from "@components/InlineLink";
import Code from "@components/Code";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import { IconBrandUbuntu } from "@tabler/icons-react";
import { GRPC_API_ORIGIN } from "@utils/netbird";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { RoutingPeerSetupKeyInfo } from "@/modules/setup-netbird-modal/SetupModal";

type Props = {
  setupKey?: string;
  setupKeyContent?: React.ReactNode;
  setupKeyPlaceholder?: string;
  showSetupKeyInfo?: boolean;
  hostname?: string;
};

export default function DockerTab({
  setupKey,
  setupKeyContent,
  setupKeyPlaceholder,
  showSetupKeyInfo = false,
  hostname,
}: Readonly<Props>) {
  const { t } = useI18n();
  const offset = setupKeyContent ? 1 : 0;
  return (
    <TabsContent value={String(OperatingSystem.DOCKER)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <IconBrandUbuntu size={16} />
          {t("setupModal.dockerInstallTitle")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p>{t("setupModal.installDocker")}</p>
          </Steps.Step>
          {setupKeyContent && (
            <Steps.Step step={2}>{setupKeyContent}</Steps.Step>
          )}
          <Steps.Step step={2 + offset}>
            <p>
              {t("setupModal.runNetBirdContainer")}
              {showSetupKeyInfo && <RoutingPeerSetupKeyInfo />}
            </p>
            <Code>
              <Code.Line>docker run --name cloink-client -d \</Code.Line>
              <Code.Line> --cap-add=NET_ADMIN \</Code.Line>
              <Code.Line>
                {" "}
                -e CL_SETUP_KEY=
                <span className={"text-netbird"}>
                  {setupKey ?? setupKeyPlaceholder ?? "SETUP_KEY"}
                </span>{" "}
                \
              </Code.Line>

              {hostname && (
                <Code.Line>
                  {" "}
                  -e CL_HOSTNAME=
                  <span className={"text-netbird"}>{`'${hostname}'`}</span> \
                </Code.Line>
              )}

              <Code.Line> -v cloink-client:/var/lib/cloink \</Code.Line>
              {GRPC_API_ORIGIN && (
                <Code.Line>
                  {" "}
                  -e CL_MANAGEMENT_URL=
                  <span className={"text-netbird"}>{GRPC_API_ORIGIN}</span> \
                </Code.Line>
              )}
              <Code.Line> ohoimager/cloink:latest</Code.Line>
            </Code>
          </Steps.Step>
          <Steps.Step step={3 + offset} line={false}>
            <p>{t("setupModal.readDocumentation")}</p>
            <InlineLink
              href={"https://docs.netbird.io/how-to/installation/docker"}
              passHref={true}
              target={"_blank"}
            >
              {t("setupModal.runningNetBirdDocker")}
            </InlineLink>
          </Steps.Step>
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
