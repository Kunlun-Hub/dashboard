import Button from "@components/Button";
import { Modal, ModalTrigger } from "@components/modal/Modal";
import { DownloadIcon } from "lucide-react";
import React, { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ResourceLimitTooltip,
  useResourceLimit,
} from "@/modules/account/ResourceUsage";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";

export function InstallNetBirdButton() {
  const { t } = useI18n();
  const peerLimit = useResourceLimit("peers");
  const [installModal, setInstallModal] = useState(false);

  const button = (
    <Button variant={"secondary"} size={"sm"} disabled={peerLimit.exhausted}>
      <DownloadIcon size={16} />
      {t("common.installNetBird")}
    </Button>
  );

  if (peerLimit.exhausted) {
    return (
      <ResourceLimitTooltip limitState={peerLimit}>
        {button}
      </ResourceLimitTooltip>
    );
  }

  return (
    <Modal open={installModal} onOpenChange={setInstallModal}>
      <ModalTrigger asChild>{button}</ModalTrigger>
      <SetupModal />
    </Modal>
  );
}
