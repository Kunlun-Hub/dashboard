import { useOidcUser } from "@axa-fr/react-oidc";
import Button from "@components/Button";
import { Modal, ModalTrigger } from "@components/modal/Modal";
import useFetchApi from "@utils/api";
import { PlusCircle } from "lucide-react";
import React, { memo, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
import { Peer } from "@/interfaces/Peer";
import {
  ResourceLimitTooltip,
  useResourceLimit,
} from "@/modules/account/ResourceUsage";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";

function AddPeerButton() {
  const { t } = useI18n();
  const { data: peers } = useFetchApi<Peer[]>("/peers");
  const { oidcUser: user } = useOidcUser();
  const peerLimit = useResourceLimit("peers");

  const [hasOnboardingFormCompleted] = useLocalStorage(
    "netbird-onboarding-modal",
    false,
  );

  const [isFirstRun, setIsFirstRun] = useLocalStorage<boolean>(
    "netbird-first-run",
    !(peers && peers.length > 0),
  );

  const [installModal, setInstallModal] = useState(
    !hasOnboardingFormCompleted
      ? process.env.APP_ENV !== "test"
        ? false
        : isFirstRun
      : isFirstRun,
  );

  const handleOpenChange = (open: boolean) => {
    setInstallModal(open);
    setIsFirstRun(false);
  };

  const button = (
    <Button
      variant={"primary"}
      size={"sm"}
      className={peerLimit.exhausted ? undefined : "ml-auto"}
      disabled={peerLimit.exhausted}
    >
      <PlusCircle size={16} />
      {t("peers.addPeer")}
    </Button>
  );

  if (peerLimit.exhausted) {
    return (
      <ResourceLimitTooltip limitState={peerLimit} className={"ml-auto"}>
        {button}
      </ResourceLimitTooltip>
    );
  }

  return (
    <Modal open={installModal} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>{button}</ModalTrigger>
      <SetupModal
        user={user}
        defaultOperatingSystem={OperatingSystem.WINDOWS}
      />
    </Modal>
  );
}

export default memo(AddPeerButton);
