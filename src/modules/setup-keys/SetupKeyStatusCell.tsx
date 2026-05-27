import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import { GlobeIcon, HelpCircle, PowerOffIcon } from "lucide-react";
import * as React from "react";
import { SetupKey } from "@/interfaces/SetupKey";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  setupKey: SetupKey;
};
export default function SetupKeyStatusCell({ setupKey }: Readonly<Props>) {
  return (
    <div className={"flex gap-4"}>
      {setupKey?.ephemeral && <Ephemeral />}
      {setupKey?.allow_extra_dns_labels && <AllowExtraDNSLabels />}
    </div>
  );
}

const AllowExtraDNSLabels = () => {
  const { t } = useI18n();
  return (
    <FullTooltip
      interactive={false}
      content={
        <div className="max-w-xs text-xs">
          {t("setupKeys.extraDnsLabelsDescription")}
        </div>
      }
    >
      <Badge variant="gray">
        <GlobeIcon size={12} className={"shrink-0"} />
        {t("setupKeys.extraDnsLabels")}
        <HelpCircle size={12} />
      </Badge>
    </FullTooltip>
  );
};

const Ephemeral = () => {
  const { t } = useI18n();
  return (
    <FullTooltip
      interactive={false}
      content={
        <div className={"max-w-xs text-xs"}>
          {t("setupKeys.ephemeralDescription")}
        </div>
      }
    >
      <Badge variant={"gray"}>
        <PowerOffIcon size={12} className={"shrink-0 text-yellow-400"} />
        {t("setupKeys.ephemeral")}
        <HelpCircle size={12} />
      </Badge>
    </FullTooltip>
  );
};
