import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { MoreVertical, Trash2, Undo2Icon } from "lucide-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { SetupKey } from "@/interfaces/SetupKey";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  setupKey: SetupKey;
};
export default function SetupKeyActionCell({ setupKey }: Readonly<Props>) {
  const { confirm } = useDialog();
  const request = useApiCall<SetupKey>("/setup-keys/" + setupKey.id);
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const setupKeyName = setupKey?.name || t("setupKeys.defaultName");

  const canRevoke =
    !setupKey.revoked && setupKey.valid && permission.setup_keys.update;
  const canDelete = permission.setup_keys.delete;

  const handleRevoke = async () => {
    const choice = await confirm({
      title: t("setupKeys.revokeTitle", { name: setupKeyName }),
      description: t("setupKeys.revokeDescription"),
      confirmText: t("setupKeys.revoke"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!choice) return;

    notify({
      title: setupKeyName,
      description: t("setupKeys.revokedDescription"),
      promise: request
        .put({
          name: setupKeyName,
          type: setupKey.type,
          expires_in: setupKey.expires_in,
          revoked: true,
          auto_groups: setupKey.auto_groups,
          usage_limit: setupKey.usage_limit,
          ephemeral: setupKey.ephemeral,
          allow_extra_dns_labels: setupKey.allow_extra_dns_labels,
        })
        .then(() => {
          mutate("/setup-keys");
          mutate("/groups");
        }),
      loadingMessage: t("setupKeys.revoking"),
    });
  };

  const handleDelete = async () => {
    const choice = await confirm({
      title: t("setupKeys.deleteTitle", { name: setupKeyName }),
      description: t("setupKeys.deleteDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      type: "danger",
    });
    if (!choice) return;

    notify({
      title: setupKeyName,
      description: t("setupKeys.deletedDescription"),
      promise: request.del().then(() => {
        mutate("/setup-keys");
        mutate("/groups");
      }),
      loadingMessage: t("setupKeys.deleting"),
    });
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          asChild={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Button
            variant={"secondary"}
            className={"!px-3"}
            aria-label={t("actions.openMenu")}
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={"w-auto"} align={"end"}>
          <DropdownMenuItem
            onClick={handleRevoke}
            disabled={!canRevoke}
            variant={"danger"}
          >
            <div className={"flex gap-3 items-center"}>
              <Undo2Icon size={14} className={"shrink-0"} />
              Revoke
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={!canDelete}
            variant={"danger"}
          >
            <div className={"flex gap-3 items-center"}>
              <Trash2 size={14} className={"shrink-0"} />
              Delete
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
