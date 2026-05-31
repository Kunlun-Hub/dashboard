import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import { getOperatingSystem } from "@hooks/useOperatingSystem";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import * as React from "react";
import { usePeer } from "@/contexts/PeerProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";
import { RDPButton } from "@/modules/remote-access/rdp/RDPButton";
import { SSHButton } from "@/modules/remote-access/ssh/SSHButton";
import { SSHCredentialsModal } from "@/modules/remote-access/ssh/SSHCredentialsModal";

export const PeerConnectButton = () => {
  const { peer } = usePeer();
  const { t } = useI18n();
  const { isFeatureEnabled } = useAccountEntitlements();
  const [sshModalOpen, setSshModalOpen] = React.useState(false);
  const isConnected = peer.connected;
  const os = getOperatingSystem(peer?.os);
  const isMobile = os === OperatingSystem.ANDROID || os === OperatingSystem.IOS;
  const remoteAccessEnabled =
    isFeatureEnabled("web_ssh") || isFeatureEnabled("web_rdp");

  if (isMobile || !remoteAccessEnabled) return;

  return isConnected ? (
    <>
      {sshModalOpen && (
        <SSHCredentialsModal
          open={sshModalOpen}
          onOpenChange={setSshModalOpen}
          peer={peer}
        />
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          asChild={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className={"group"}>
            <ConnectButton label={t("remoteAccess.connect")} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-auto"
          align="start"
          side={"bottom"}
          sideOffset={8}
        >
          <SSHButton
            peer={peer}
            isDropdown={true}
            onOpenCredentials={() => setSshModalOpen(true)}
          />
          <RDPButton peer={peer} isDropdown={true} />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  ) : (
    <FullTooltip
      content={
        <div className={"max-w-[200px] text-xs"}>
          {t("peerConnect.offlineHelp")}
        </div>
      }
    >
      <ConnectButton disabled={true} label={t("remoteAccess.connect")} />
    </FullTooltip>
  );
};

const ConnectButton = ({
  disabled,
  label,
}: {
  disabled?: boolean;
  label: string;
}) => {
  return (
    <button
      className={cn(
        "flex gap-2 items-center rounded-md py-2 px-3 text-sm text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300 enabled:cursor-pointer enabled:hover:bg-neutral-100 dark:text-nb-gray-300 dark:hover:text-white dark:disabled:text-nb-gray-700 dark:enabled:hover:bg-nb-gray-800/60",
        // group data state open
        "group-data-[state=open]:bg-neutral-100 dark:group-data-[state=open]:bg-nb-gray-800/30",
      )}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {label}
      <IconChevronDown size={14} />
    </button>
  );
};
