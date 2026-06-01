import Button from "@components/Button";
import Code from "@components/Code";
import Steps from "@components/Steps";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import { Policy } from "@/interfaces/Policy";

type Props = {
  firstDevice?: Peer;
  secondDevice?: Peer;
  policy?: Policy;
  onNext?: () => void;
  onTroubleshootingClick?: () => void;
};

export const OnboardingTestP2P = ({
  firstDevice,
  secondDevice,
  onNext,
  onTroubleshootingClick,
}: Props) => {
  const { t } = useI18n();
  return (
    <div className={"relative flex flex-col h-full gap-4"}>
      <div>
        <h1 className={"text-xl text-center max-w-sm mx-auto"}>
          {t("onboarding.testConnection")}
        </h1>
        <div
          className={
            "text-sm text-neutral-600 dark:text-nb-gray-300 font-light mt-2 block text-center sm:px-4"
          }
        >
          {t("onboarding.testP2PDescription")}
        </div>
      </div>

      <Steps className={"stepper-bg-variant"}>
        <Steps.Step step={1}>
          <p className={"!text-neutral-600 dark:!text-nb-gray-300"}>
            {t("onboarding.runCommandFrom")}{" "}
            <span className={"text-neutral-900 font-medium dark:text-white"}>
              {firstDevice?.name}
            </span>{" "}
            {t("onboarding.toPing")}{" "}
            <span className={"text-neutral-900 font-medium dark:text-white"}>
              {secondDevice?.name}
            </span>
            .{" "}
            {t("onboarding.testP2PResponseHint")}
          </p>
          <Code message={t("common.copiedToClipboard")}>
            ping {secondDevice?.ip}
          </Code>
        </Steps.Step>
        <Steps.Step step={2} line={false} className={"pb-0"}>
          <p className={"!text-neutral-600 dark:!text-nb-gray-300"}>
            {t("onboarding.everythingWorking")}
          </p>
          <div className={"mt-2"}>
            <Button
              variant={"secondaryLighter"}
              className={"w-full"}
              onClick={onNext}
            >
              {t("onboarding.itWorksContinue")}
            </Button>
          </div>
        </Steps.Step>
      </Steps>
    </div>
  );
};
