import SquareIcon from "@components/SquareIcon";
import AddPeerButton from "@components/ui/AddPeerButton";
import GetStartedTest from "@components/ui/GetStartedTest";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import PeerIcon from "@/assets/icons/PeerIcon";

type Props = {
  showBackground?: boolean;
  // When set, tailors the empty-state copy and threads isUserDevice
  // through AddPeerButton so the right Install NetBird flow opens:
  //   true  → User Devices empty state (browser/SSO flow, mobile tabs).
  //   false → Servers empty state (setup-key flow, no mobile tabs).
  //   undefined → legacy/global empty state (no kind preference).
  isUserDevice?: boolean;
};

export const NoPeersGettingStarted = ({
  showBackground = true,
  isUserDevice,
}: Readonly<Props>) => {
  const { t } = useI18n();
  const title =
    isUserDevice === false
      ? t("peers.serversBlockedTitle")
      : isUserDevice
        ? t("peers.userDevicesBlockedTitle")
        : t("peers.blockedTitle");
  const description =
    isUserDevice === false
      ? t("peers.serversBlockedDescription")
      : isUserDevice
        ? t("peers.userDevicesBlockedDescription")
        : t("peers.blockedDescription");

  return (
    <GetStartedTest
      showBackground={showBackground}
      icon={
        <SquareIcon
          icon={
            <PeerIcon
              className={"fill-neutral-400 dark:fill-nb-gray-200"}
              size={20}
            />
          }
          color={"gray"}
          size={"large"}
        />
      }
      title={title}
      description={description}
      button={<AddPeerButton isUserDevice={isUserDevice} />}
    />
  );
};
