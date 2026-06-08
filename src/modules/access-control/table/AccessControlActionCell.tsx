import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { MoreVertical, PowerIcon, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { mutate } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { usePolicies } from "@/contexts/PoliciesProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Policy } from "@/interfaces/Policy";

type Props = {
  policy: Policy;
};

export default function AccessControlActionCell({ policy }: Readonly<Props>) {
  const { confirm } = useDialog();
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { deletePolicy, updatePolicy, serializeRules } = usePolicies();
  const [open, setOpen] = useState(false);

  const canUpdate = permission.policies.update;
  const canDelete = permission.policies.delete;

  const handleToggle = async () => {
    const nextEnabled = !policy.enabled;
    updatePolicy(
      policy,
      { enabled: nextEnabled, rules: serializeRules(policy.rules, nextEnabled) },
      () => {
        mutate("/policies");
      },
      nextEnabled
        ? "The rule was successfully enabled"
        : "The rule was successfully disabled",
    );
  };

  const handleDelete = async () => {
    const choice = await confirm({
      title: t("policies.deleteTitle", { name: policy.name }),
      description: t("policies.deleteDescription"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      type: "danger",
    });
    if (!choice) return;
    await deletePolicy(policy);
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
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
            aria-label={"Policy actions"}
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={"w-auto"} align={"end"}>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              handleToggle();
            }}
            disabled={!canUpdate}
          >
            <div className={"flex gap-3 items-center"}>
              <PowerIcon size={14} className={"shrink-0"} />
              {policy.enabled ? "Disable" : "Enable"}
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
