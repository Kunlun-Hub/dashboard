import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { cn } from "@utils/helpers";
import { ExternalLinkIcon, HelpCircle } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { User } from "@/interfaces/User";
import { useAccount } from "@/modules/account/useAccount";

type Props = {
  user: User;
};

export default function UserStatusCell({ user }: Readonly<Props>) {
  const account = useAccount();
  const { t } = useI18n();
  const status = user.status;
  const isPendingApproval = user.pending_approval;
  const isLocalAuthDisabled =
    account?.settings?.local_auth_disabled === true &&
    user.idp_id === "local";

  const getStatusDisplay = () => {
    if (isLocalAuthDisabled) {
      return { text: t("users.status.disabled"), color: "bg-gray-400" };
    }
    if (isPendingApproval) {
      return { text: t("users.status.pendingApproval"), color: "bg-netbird" };
    }
    if (status === "blocked") {
      return { text: t("users.status.blocked"), color: "bg-red-500" };
    }
    if (status === "invited") {
      return { text: t("users.status.pending"), color: "bg-yellow-400" };
    }
    if (status === "active") {
      return { text: t("users.status.active"), color: "bg-green-500" };
    }
    return { text: status || t("common.unknown"), color: "bg-gray-400" };
  };

  const tooltipContent = isLocalAuthDisabled ? (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>{t("users.localAuthDisabledDescription")}</div>
      <div>
        <InlineLink
          href={
            "https://docs.netbird.io/selfhosted/identity-providers/disable-local-authentication"
          }
          target={"_blank"}
        >
          {t("common.learnMore")} <ExternalLinkIcon size={12} />
        </InlineLink>
      </div>
    </div>
  ) : (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>{t("users.pendingApprovalDescription")}</div>

      <div>
        {t("users.pendingApprovalSettingsPrefix")}{" "}
        <InlineLink href={"/settings?tab=authentication"}>
          {t("settings.title")}
        </InlineLink>{" "}
        {t("users.pendingApprovalSettingsSuffix")}{" "}
        <span className={"font-medium text-neutral-900 dark:text-white"}>
          {t("users.pendingApprovalRequired")}
        </span>
        .
      </div>
      <div>
        {t("users.pendingApprovalLearnMorePrefix")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/approve-users"}
          target={"_blank"}
        >
          {t("users.pendingApprovalLearnMore")} <ExternalLinkIcon size={12} />
        </InlineLink>
      </div>
    </div>
  );

  const showTooltip = isLocalAuthDisabled || isPendingApproval;
  const { text, color } = getStatusDisplay();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <FullTooltip
        content={tooltipContent}
        interactive={true}
        side="right"
        disabled={!showTooltip}
      >
        <div
          className={cn(
            "flex gap-2.5 items-center text-neutral-600 dark:text-nb-gray-300 text-sm",
          )}
          data-cy={"user-status-cell"}
        >
          <span className={cn("h-2 w-2 rounded-full", color)}></span>
          {text}
          {showTooltip && (
            <HelpCircle size={14} className="text-netbird cursor-help" />
          )}
        </div>
      </FullTooltip>
    </div>
  );
}
