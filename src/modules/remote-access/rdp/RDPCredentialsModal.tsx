import Button from "@components/Button";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Separator from "@components/Separator";
import { IconLoader2 } from "@tabler/icons-react";
import {
  ChevronsLeftRightEllipsis,
  KeyRoundIcon,
  MonitorIcon,
  User2,
} from "lucide-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Peer } from "@/interfaces/Peer";
import { RDPCredentials } from "@/modules/remote-access/rdp/useRemoteDesktop";

type Props = {
  open: boolean;
  peer: Peer;
  onConnect?: (credentials: RDPCredentials) => void;
  error?: string;
  loading?: boolean;
};

export const RDPCredentialsModal = ({
  open,
  peer,
  onConnect,
  error,
  loading,
}: Props) => {
  const { t } = useI18n();
  const [username, setUsername] = useState("Administrator");
  const [password, setPassword] = useState("");

  const [port, setPort] = useState("3389");

  const userNameError = useMemo(() => {
    if (username?.length === 0) return t("remoteAccess.usernameEmpty");
  }, [username, t]);

  const portError = useMemo(() => {
    const portNumber = Number(port);
    const isValid =
      Number.isInteger(portNumber) && portNumber > 0 && portNumber <= 65535;
    if (!isValid) return t("remoteAccess.portError");
  }, [port, t]);

  const hasAnyError = useMemo(() => {
    if (userNameError !== undefined) return true;
    return portError !== undefined;
  }, [userNameError, portError]);

  const handleConnect = useCallback(() => {
    if (hasAnyError || !onConnect) return;

    let parsedUsername = username;
    let parsedDomain = "";

    // Parse DOMAIN\username format
    if (username.includes("\\")) {
      const parts = username.split("\\");
      if (parts.length === 2) {
        parsedDomain = parts[0];
        parsedUsername = parts[1];
      }
    }
    // Parse username@domain format
    else if (username.includes("@")) {
      const parts = username.split("@");
      if (parts.length === 2) {
        parsedUsername = parts[0];
        parsedDomain = parts[1];
      }
    }

    onConnect({
      username: parsedUsername,
      password,
      domain: parsedDomain,
      port: Number(port),
    });
  }, [hasAnyError, onConnect, username, password, port]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !hasAnyError && !loading) {
        handleConnect();
      }
    },
    [handleConnect, hasAnyError, loading],
  );

  return (
    <Modal open={open} onOpenChange={undefined}>
      <ModalContent maxWidthClass={"max-w-xl"} showClose={false}>
        <ModalHeader
          icon={<MonitorIcon className={"text-netbird"} size={18} />}
          title={peer.name}
          description={t("remoteAccess.connectViaRdp", { ip: peer.ip })}
          color={"netbird"}
        />
        <Separator />

        <form
          className={"px-8 py-6 flex flex-col gap-8"}
          onSubmit={(e) => {
            e.preventDefault();
            handleConnect();
          }}
        >
          {error && (
            <div className={"bg-red-50 border border-red-200 rounded-md p-4"}>
              <div
                className={
                  "flex items-center gap-2 text-red-800 font-medium mb-1"
                }
              >
                {t("remoteAccess.error")}
              </div>
              <p className={"text-sm text-red-700"}>{error}</p>
            </div>
          )}
          <div>
            <Label>{t("remoteAccess.usernamePassword")}</Label>
            <HelpText>{t("remoteAccess.rdpCredentialsHelp")}</HelpText>
            <div className={"flex flex-col gap-2 w-full"}>
              <Input
                placeholder={t("remoteAccess.rdpUsernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                name="username"
                autoComplete={"username"}
                error={userNameError}
                errorTooltip={true}
                errorTooltipPosition={"top-right"}
                customPrefix={
                  <User2
                    size={16}
                    className={"text-neutral-500 dark:text-nb-gray-300"}
                  />
                }
              />
              <Input
                value={password}
                placeholder={t("remoteAccess.passwordPlaceholder")}
                type={"password"}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                name="password"
                autoComplete={"current-password"}
                error={undefined}
                errorTooltip={true}
                errorTooltipPosition={"top-right"}
                customPrefix={
                  <KeyRoundIcon
                    size={16}
                    className={"text-neutral-500 dark:text-nb-gray-300"}
                  />
                }
              />
            </div>
          </div>
          <div>
            <Label>{t("remoteAccess.port")}</Label>
            <HelpText>{t("remoteAccess.rdpPortHelp")}</HelpText>
            <Input
              maxWidthClass={""}
              placeholder={t("remoteAccess.rdpPortPlaceholder")}
              min={1}
              max={65535}
              value={port}
              type={"number"}
              error={portError}
              errorTooltip={true}
              errorTooltipPosition={"top-right"}
              onChange={(e) => setPort(e.target.value)}
              onKeyDown={handleKeyDown}
              customPrefix={
                <ChevronsLeftRightEllipsis
                  size={16}
                  className={"text-neutral-500 dark:text-nb-gray-300"}
                />
              }
            />
          </div>
        </form>

        <ModalFooter className={"items-center"}>
          <div className={"flex gap-3 w-full justify-end"}>
            <Button
              type="submit"
              variant={"primary"}
              disabled={hasAnyError || loading}
              onClick={handleConnect}
            >
              {loading && <IconLoader2 size={16} className={"animate-spin"} />}
              {t("remoteAccess.connect")}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
