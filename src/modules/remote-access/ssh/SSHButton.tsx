import Button from "@components/Button";
import { DropdownMenuItem } from "@components/DropdownMenu";
import { getOperatingSystem } from "@hooks/useOperatingSystem";
import { CircleHelpIcon, TerminalIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { Peer } from "@/interfaces/Peer";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";
import { SSHCredentialsModal } from "@/modules/remote-access/ssh/SSHCredentialsModal";
import { SSHTooltip } from "@/modules/remote-access/ssh/SSHTooltip";

type Props = {
  peer: Peer;
  isDropdown?: boolean;
  onOpenCredentials?: () => void;
};

export const SSHButton = ({
  peer,
  isDropdown = false,
  onOpenCredentials,
}: Props) => {
  const [modal, setModal] = useState(false);
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { isFeatureEnabled } = useAccountEntitlements();
  const webSSHEnabled = isFeatureEnabled("web_ssh");

  const isSSHEnabled =
    peer?.local_flags?.server_ssh_allowed || peer?.ssh_enabled;
  const disabled = !peer.connected || !permission.peers.update || !isSSHEnabled;

  const hasPermission = permission.peers.update;

  const os = getOperatingSystem(peer?.os);
  const isSSHSupported = os !== OperatingSystem.IOS;

  const openCredentials = () => {
    if (onOpenCredentials) {
      onOpenCredentials();
      return;
    }
    setModal(true);
  };

  return (
    webSSHEnabled &&
    isSSHSupported && (
      <>
        {!onOpenCredentials && modal && (
          <SSHCredentialsModal
            open={modal}
            onOpenChange={setModal}
            peer={peer}
          />
        )}
        <div>
          <SSHTooltip
            isOnline={peer.connected}
            isSSHEnabled={isSSHEnabled}
            hasPermission={hasPermission}
            side={isDropdown ? "left" : "top"}
          >
            {isDropdown ? (
              <DropdownMenuItem
                onClick={openCredentials}
                disabled={disabled}
                className={"w-full"}
              >
                <div className={"flex gap-3 items-center w-full"}>
                  <TerminalIcon size={14} className={"shrink-0"} />
                  {t("remoteAccess.ssh")}
                </div>
              </DropdownMenuItem>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={openCredentials}
                disabled={disabled}
              >
                <TerminalIcon size={16} />
                {t("remoteAccess.ssh")}
                {disabled && <CircleHelpIcon size={12} />}
              </Button>
            )}
          </SSHTooltip>
        </div>
      </>
    )
  );
};
