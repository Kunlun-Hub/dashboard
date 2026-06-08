import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { cn } from "@utils/helpers";
import { isNetBirdHosted } from "@utils/netbird";
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
      return { text: "Pending", color: "bg-netbird" };
    }
    if (status === "blocked") {
      return { text: t("users.status.blocked"), color: "bg-red-500" };
    }
    if (status === "invited") {
      return { text: "Invited", color: "bg-yellow-400" };
    }
    if (status === "active") {
      return { text: t("users.status.active"), color: "bg-green-500" };
    }
    return { text: status || t("common.unknown"), color: "bg-gray-400" };
  };

  const isInvitedOnCloud = status === "invited" && isNetBirdHosted();

  const tooltipContent = isLocalAuthDisabled ? (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>{t("users.localAuthDisabledDescription")}</div>
    </div>
  ) : isInvitedOnCloud ? (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>
        This user was invited but has not accepted the invitation yet. Use the
        Resend button to send another invitation email.
      </div>
    </div>
  ) : (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>
        This user needs admin approval before joining your organization. To
        disable approvals, turn off{" "}
        <span className={"font-medium text-white"}>
          {"'User Approval Required'"}
        </span>{" "}
        in{" "}
        <InlineLink href={"/settings?tab=authentication"}>Settings</InlineLink>
        .
      </div>
      <div>
        <InlineLink
          href={"https://docs.netbird.io/how-to/approve-users"}
          target={"_blank"}
        >
          Learn more <ExternalLinkIcon size={12} />
        </InlineLink>
      </div>
    </div>
  );

  const showTooltip =
    isLocalAuthDisabled || isPendingApproval || isInvitedOnCloud;
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
