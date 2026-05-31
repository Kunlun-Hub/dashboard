"use client";

import Button from "@components/Button";
import { Input } from "@components/Input";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import Separator from "@components/Separator";
import { IconSettings2 } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { PlusCircle, User2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { Role, User } from "@/interfaces/User";
import {
  ResourceLimitTooltip,
  useResourceLimit,
} from "@/modules/account/ResourceUsage";
import { UserRoleSelector } from "@/modules/users/UserRoleSelector";

type Props = {
  children: React.ReactNode;
};

export default function ServiceUserModal({ children }: Readonly<Props>) {
  const [modal, setModal] = useState(false);

  return (
    <Modal open={modal} onOpenChange={setModal} key={modal ? 1 : 0}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ServiceUserModalContent onSuccess={() => setModal(false)} />
    </Modal>
  );
}

type ModalProps = {
  onSuccess?: () => void;
};

export function ServiceUserModalContent({ onSuccess }: Readonly<ModalProps>) {
  const userRequest = useApiCall<User>("/users");
  const { mutate } = useSWRConfig();
  const { t } = useI18n();
  const userLimit = useResourceLimit("users");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");

  const create = async () => {
    if (userLimit.exhausted) return;
    notify({
      title: t("serviceUser.created"),
      description: t("serviceUser.createdDescription", { name }),
      promise: userRequest
        .post({
          name,
          role,
          auto_groups: [],
          is_service_user: true,
        })
        .then(() => {
          onSuccess && onSuccess();
          mutate("/users?service_user=true");
        }),
      loadingMessage: t("serviceUser.creating"),
    });
  };

  const isDisabled = useMemo(() => {
    return name.length === 0 || userLimit.exhausted;
  }, [name, userLimit.exhausted]);

  return (
    <ModalContent maxWidthClass={"max-w-lg"}>
      <ModalHeader
        icon={<IconSettings2 />}
        title={t("serviceUsers.createTitle")}
        description={t("serviceUser.description")}
        color={"netbird"}
      />

      <Separator />

      <div className={"px-8 py-6 flex flex-col gap-8"}>
        <div className={"flex gap-4"}>
          <div className={"w-full"}>
            <Input
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <User2 size={16} className={"text-nb-gray-300"} />
                </div>
              }
              placeholder={t("invite.namePlaceholder")}
              value={name}
              data-cy={"service-user-name"}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={"w-[330px]"}>
            <UserRoleSelector
              value={role as Role}
              onChange={setRole}
              hideOwner={true}
            />
          </div>
        </div>
      </div>

      <ModalFooter className={"items-center"}>
        <div className={"flex gap-3 w-full justify-end"}>
          <ModalClose asChild={true}>
            <Button variant={"secondary"}>{t("actions.cancel")}</Button>
          </ModalClose>

          <ResourceLimitTooltip
            limitState={userLimit}
            className={userLimit.exhausted ? "inline-flex" : undefined}
          >
            <Button
              variant={"primary"}
              disabled={isDisabled}
              onClick={create}
              data-cy={"create-service-user"}
            >
              <PlusCircle size={16} />
              {t("serviceUsers.createTitle")}
            </Button>
          </ResourceLimitTooltip>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
