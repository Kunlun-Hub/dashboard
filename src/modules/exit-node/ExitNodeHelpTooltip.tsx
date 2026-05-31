import FullTooltip from "@components/FullTooltip";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  children: React.ReactNode;
  hoverButton?: boolean;
};
export const ExitNodeHelpTooltip = ({
  children,
  hoverButton = false,
}: Props) => {
  const { t } = useI18n();
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <FullTooltip
        hoverButton={hoverButton}
        content={
          <div className={"text-xs max-w-xs"}>
            {t("exitNodes.help")}
          </div>
        }
      >
        {children}
      </FullTooltip>
    </div>
  );
};
