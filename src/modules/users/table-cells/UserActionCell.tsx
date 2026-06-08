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
import { isNetBirdHosted } from "@utils/netbird";
import {
  Ban,
  MoreVertical,
  Trash2,
  UndoIcon,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { User } from "@/interfaces/User";
import { UserResendInviteButton } from "@/modules/users/UserResendInviteButton";

type Props = {
  user: User;
  serviceUser?: boolean;
};
export default function UserActionCell({
  user,
  serviceUser = false,
}: Readonly<Props>) {
  const { t } = useI18n();
  const { confirm } = useDialog();
  const { permission } = usePermissions();
  const userRequest = useApiCall<User>("/users");
  const { mutate } = useSWRConfig();

  const deleteUser = async () => {
    const name = user.name || "User";
    notify({
      title: t("userActions.deletedTitle", { name }),
      description: t("userActions.deletedDescription"),
      promise: userRequest.del("", `/${user.id}`).then(() => {
        mutate(`/users?service_user=${serviceUser}`);
      }),
      loadingMessage: t("userActions.deleting"),
    });
  };

  const approveUser = async () => {
    const name = user.name || t("userActions.userFallback");
    notify({
      title: t("userActions.approvedTitle", { name }),
      description: t("userActions.approvedDescription"),
      promise: userRequest.post({}, `/${user.id}/approve`).then(() => {
        mutate(`/users?service_user=${serviceUser}`);
      }),
      loadingMessage: t("userActions.approving"),
    });
  };

  const rejectUser = async () => {
    const name = user.name || t("userActions.userFallback");
    const choice = await confirm({
      title: t("userActions.rejectConfirmTitle", { name }),
      description: t("userActions.rejectConfirmDescription"),
      confirmText: t("userActions.reject"),
      cancelText: t("actions.cancel"),
      type: "danger",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return;

    notify({
      title: t("userActions.rejectedTitle", { name }),
      description: t("userActions.rejectedDescription"),
      promise: userRequest.del("", `/${user.id}/reject`).then(() => {
        mutate(`/users?service_user=${serviceUser}`);
      }),

      loadingMessage: t("userActions.rejecting"),
    });
  };

  const openDeleteConfirm = async () => {
    const name = user.name || "User";
    const choice = await confirm({
      title: t("userActions.deleteConfirmTitle", { name }),
      description: t("userActions.deleteConfirmDescription"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      maxWidthClass: "max-w-md",
      type: "danger",
    });
    if (!choice) return;
    deleteUser().then();
  };

  const toggleBlocked = async () => {
    const name = user.name || "User";
    const blocked = !user.is_blocked;

    if (blocked) {
      const choice = await confirm({
        title: `Block '${name}'?`,
        description:
          "This action will immediately revoke the user's access and disconnect all of their active peers.",
        confirmText: "Block",
        cancelText: "Cancel",
        type: "danger",
      });
      if (!choice) return;
    }

    notify({
      title: blocked ? "User blocked" : "User unblocked",
      description:
        name + " was successfully " + (blocked ? "blocked." : "unblocked."),
      promise: userRequest
        .put(
          {
            role: user.role,
            auto_groups: user.auto_groups,
            is_blocked: blocked,
          },
          `/${user.id}`,
        )
        .then(() => {
          mutate(`/users?service_user=${serviceUser}`);
        }),
      loadingMessage: blocked
        ? "Blocking the user..."
        : "Unblocking the user...",
    });
  };

  const deleteDisabled = useMemo(() => {
    if (!permission.users.delete) return true;
    return user.is_current;
  }, [permission.users.delete, user.is_current]);

  const isPendingApproval = user.pending_approval;
  const canManageUsers = permission.users.update;
  const canShowBlock =
    !serviceUser && !user.is_current && user.role !== "owner";
  const blockDisabled = !canManageUsers;

  if (isPendingApproval) {
    return (
      <div className={"flex justify-end pr-4 items-center gap-2"}>
        {canManageUsers && (
          <>
            <Button
              variant={"secondary"}
              size={"xs"}
              onClick={(e) => {
                e.stopPropagation();
                approveUser();
              }}
              data-cy={"approve-user"}
            >
              Approve
            </Button>
            <Button
              variant={"danger-outline"}
              size={"xs"}
              className={"!px-3"}
              onClick={(e) => {
                e.stopPropagation();
                rejectUser();
              }}
              data-cy={"reject-user"}
            >
              <XCircle size={14} />
              Reject
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={"flex justify-end pr-4 items-center gap-2"}>
      {!serviceUser && isNetBirdHosted() && (
        <UserResendInviteButton user={user} />
      )}
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
            aria-label={t("actions.userActions")}
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={"w-auto"} align={"end"}>
          {canShowBlock && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBlocked();
                }}
                disabled={blockDisabled}
                variant={user.is_blocked ? undefined : "danger"}
                data-cy={user.is_blocked ? "unblock-user" : "block-user"}
              >
                <div className={"flex gap-3 items-center"}>
                  {user.is_blocked ? (
                    <UndoIcon size={14} className={"shrink-0"} />
                  ) : (
                    <Ban size={14} className={"shrink-0"} />
                  )}
                  {user.is_blocked ? "Unblock" : "Block"}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              openDeleteConfirm();
            }}
            disabled={deleteDisabled}
            variant={"danger"}
            data-cy={"delete-user"}
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
