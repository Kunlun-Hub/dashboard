import Button from "@components/Button";
import Code from "@components/Code";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import Paragraph from "@components/Paragraph";
import SquareIcon from "@components/SquareIcon";
import { DataTable } from "@components/table/DataTable";
import DataTableHeader from "@components/table/DataTableHeader";
import DataTableRefreshButton from "@components/table/DataTableRefreshButton";
import DataTableResetFilterButton from "@components/table/DataTableResetFilterButton";
import {
  CheckboxListPicker,
  CheckboxOption,
  formatCheckboxChip,
} from "@components/table/filters/CheckboxListPicker";
import {
  formatGroupsChip,
  GroupsPicker,
} from "@components/table/filters/GroupsPicker";
import {
  formatRadioChip,
  RadioOption,
  RadioPicker,
} from "@components/table/filters/RadioPicker";
import {
  TableFilterChips,
  TableFilterDef,
  TableFiltersButton,
} from "@components/table/TableFilters";
import GetStartedTest from "@components/ui/GetStartedTest";
import MultipleGroups from "@components/ui/MultipleGroups";
import Skeleton from "react-loading-skeleton";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import useFetchApi, { useApiCall } from "@utils/api";
import { notify } from "@components/Notification";
import { MoreVertical, RefreshCw } from "lucide-react";
import { isNetBirdHosted } from "@utils/netbird";
import dayjs from "dayjs";
import {
  Cog,
  CopyIcon,
  CreditCardIcon,
  EyeIcon,
  Link2,
  MailPlus,
  NetworkIcon,
  Trash2,
  User2,
} from "lucide-react";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import Badge from "@components/Badge";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/I18nProvider";
import { cn, generateColorFromString } from "@utils/helpers";
import { Group } from "@/interfaces/Group";
import {
  Role,
  UserInvite,
  UserInviteRegenerateResponse,
} from "@/interfaces/User";
import UserInviteModal from "@/modules/users/UserInviteModal";
import { useAccount } from "@/modules/account/useAccount";

// Name cell for invites - same styling as UserNameCell but for invites
function InviteNameCell({ invite }: { invite: UserInvite }) {
  return (
    <div
      className={cn("flex gap-4 px-2 py-1 items-center")}
      data-cy={"invite-name-cell"}
    >
      <div
        className={
          "w-10 h-10 rounded-full relative flex items-center justify-center text-white uppercase text-md font-medium bg-nb-gray-900"
        }
        style={{
          color: generateColorFromString(invite.name || invite.email),
        }}
      >
        {invite?.name?.charAt(0) || invite?.email?.charAt(0)}
      </div>
      <div className={"flex flex-col justify-center"}>
        <span className={cn("text-base font-medium flex items-center gap-3")}>
          {invite.name}
        </span>
        <span className={cn("text-sm text-nb-gray-400")}>{invite.email}</span>
      </div>
    </div>
  );
}

// Role cell for invites - same styling as UserRoleCell but for invites
function InviteRoleCell({ invite }: { invite: UserInvite }) {
  const { t } = useI18n();
  const role = invite.role as Role;

  return (
    <div className={cn("flex gap-3 items-center text-nb-gray-200")}>
      <Badge variant={role === "owner" ? "netbird" : "gray"}>
        {role === Role.User && (
          <>
            <User2 size={14} />
            {t("userRoles.user")}
          </>
        )}
        {role === Role.Admin && (
          <>
            <Cog size={14} />
            {t("userRoles.admin")}
          </>
        )}
        {role === Role.Owner && (
          <>
            <NetBirdIcon size={14} />
            {t("userRoles.owner")}
          </>
        )}
        {role === Role.BillingAdmin && (
          <>
            <CreditCardIcon size={14} />
            {t("userRoles.billingAdmin")}
          </>
        )}
        {role === Role.Auditor && (
          <>
            <EyeIcon size={14} />
            {t("userRoles.auditor")}
          </>
        )}
        {role === Role.NetworkAdmin && (
          <>
            <NetworkIcon size={14} />
            {t("userRoles.networkAdmin")}
          </>
        )}
      </Badge>
    </div>
  );
}

// Groups cell for invites - read-only display of user_groups
function InviteGroupCell({ invite }: { invite: UserInvite }) {
  const { t } = useI18n();
  const { groups, isLoading } = useGroups();

  const foundGroups = useMemo(() => {
    if (isLoading || !groups) return [];
    return (invite.user_groups || [])
      .map((groupId) => groups.find((g) => g?.id === groupId))
      .filter((g): g is Group => g !== undefined);
  }, [invite.user_groups, groups, isLoading]);

  if (isLoading) {
    return (
      <div className={"flex gap-2"}>
        <Skeleton height={34} width={90} />
        <Skeleton height={34} width={45} />
      </div>
    );
  }

  return (
    <MultipleGroups
      groups={foundGroups}
      label={t("userGroups.label")}
      countOnly={true}
    />
  );
}

// Status cell for invites - shows Valid/Expired based on expired field
function InviteStatusCell({ invite }: { invite: UserInvite }) {
  const { t } = useI18n();
  const isExpired = invite.expired;
  const text = isExpired ? t("filters.expired") : t("filters.valid");
  const color = isExpired ? "bg-red-500" : "bg-green-500";

  return (
    <div
      className={cn("flex gap-2.5 items-center text-nb-gray-300 text-sm")}
      data-cy={"invite-status-cell"}
    >
      <span className={cn("h-2 w-2 rounded-full", color)}></span>
      {text}
    </div>
  );
}

// Action cell for invites - regenerate + delete in a dropdown menu
function InviteActionCell({ invite }: { invite: UserInvite }) {
  const { confirm } = useDialog();
  const { permission } = usePermissions();
  const { t } = useI18n();
  const inviteRequest = useApiCall<UserInvite>("/users/invites");
  const regenerateRequest = useApiCall<UserInviteRegenerateResponse>(
    `/users/invites/${invite.id}/regenerate`,
  );
  const { mutate } = useSWRConfig();

  const [modalOpen, setModalOpen] = useState(false);
  const [regeneratedData, setRegeneratedData] =
    useState<UserInviteRegenerateResponse | null>(null);

  const getInviteFullUrl = () => {
    if (!regeneratedData) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invite?token=${regeneratedData.invite_token}`;
  };

  const [, copyToClipboard] = useCopyToClipboard(getInviteFullUrl());

  const handleRegenerate = async () => {
    notify({
      title: t("userInvites.regenerate"),
      description: t("userInvites.regeneratingDescription", {
        name: invite.name || invite.email,
      }),
      promise: regenerateRequest.post({}).then((response) => {
        setRegeneratedData(response);
        setModalOpen(true);
        mutate("/users/invites");
      }),
      loadingMessage: t("userInvites.regenerating"),
    });
  };

  const handleCopyAndClose = () => {
    copyToClipboard(t("userInvites.linkCopied")).then(() => {
      setRegeneratedData(null);
      setModalOpen(false);
    });
  };

  const deleteInvite = async () => {
    const name = invite.name || invite.email || t("userInvites.fallbackName");
    notify({
      title: t("userInvites.deletedTitle", { name }),
      description: t("userInvites.deletedDescription"),
      promise: inviteRequest.del("", `/${invite.id}`).then(() => {
        mutate("/users/invites");
      }),
      loadingMessage: t("userInvites.deleting"),
    });
  };

  const openDeleteConfirm = async () => {
    const name = invite.name || invite.email || t("userInvites.fallbackName");
    const choice = await confirm({
      title: t("userInvites.deleteTitle", { name }),
      description: t("userInvites.deleteDescription"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      maxWidthClass: "max-w-md",
      type: "danger",
    });
    if (!choice) return;
    deleteInvite().then();
  };

  return (
    <>
      <div className={"flex justify-end pr-4 items-center gap-2"}>
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
              aria-label={t("userInvites.actions")}
            >
              <MoreVertical size={16} className={"shrink-0"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={"w-auto"} align={"end"}>
            <DropdownMenuItem
              onClick={handleRegenerate}
              disabled={!permission.users.update}
              data-cy={"regenerate-invite"}
            >
              <div className={"flex gap-3 items-center"}>
                <RefreshCw size={14} className={"shrink-0"} />
                {t("userInvites.regenerate")}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={openDeleteConfirm}
              disabled={!permission.users.delete}
              variant={"danger"}
              data-cy={"delete-invite"}
            >
              <div className={"flex gap-3 items-center"}>
                <Trash2 size={14} className={"shrink-0"} />
                {t("actions.delete")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRegeneratedData(null);
          }
          setModalOpen(open);
        }}
      >
        <ModalContent
          maxWidthClass={"max-w-xl"}
          className={"mt-20"}
          showClose={true}
        >
          <div className={"pb-6 px-8"}>
            <div className={"flex flex-col items-center justify-center gap-3"}>
              <div>
                <h2 className={"text-2xl text-center mb-2"}>
                  {t("userInvites.regeneratedTitle")}
                </h2>
                <Paragraph className={"mt-0 text-sm text-center"}>
                  {t("userInvites.regeneratedDescription")}
                </Paragraph>
              </div>
            </div>
          </div>

          <div className={"px-8 pb-6"}>
            <Code
              message={t("userInvites.linkCopied")}
              codeToCopy={getInviteFullUrl()}
            >
              <span className="break-all whitespace-normal block">
                {getInviteFullUrl()}
              </span>
            </Code>
            {regeneratedData && (
              <Paragraph
                className={"mt-3 text-xs text-nb-gray-400 text-center"}
              >
                {t("userInvites.expiresOn")}{" "}
                {new Date(regeneratedData.invite_expires_at).toLocaleString()}
              </Paragraph>
            )}
          </div>
          <ModalFooter className={"items-center"}>
            <Button
              variant={"primary"}
              className={"w-full"}
              onClick={handleCopyAndClose}
            >
              <CopyIcon size={14} />
              {t("userInvites.copyAndClose")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export const createInvitesTableColumns = (
  t: ReturnType<typeof useI18n>["t"],
): ColumnDef<UserInvite>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.name")}</DataTableHeader>
      );
    },
    accessorFn: (row) => row.name + " " + row.email,
    sortingFn: "text",
    cell: ({ row }) => <InviteNameCell invite={row.original} />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.role")}</DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => <InviteRoleCell invite={row.original} />,
  },
  {
    accessorKey: "expired",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.status")}</DataTableHeader>
      );
    },
    sortingFn: "basic",
    cell: ({ row }) => <InviteStatusCell invite={row.original} />,
  },
  {
    accessorKey: "user_groups",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.groups")}</DataTableHeader>
      );
    },
    sortingFn: "text",
    cell: ({ row }) => <InviteGroupCell invite={row.original} />,
  },
  {
    accessorKey: "expires_at",
    header: ({ column }) => {
      return (
        <DataTableHeader column={column}>{t("table.expires")}</DataTableHeader>
      );
    },
    sortingFn: "datetime",
    cell: ({ row }) => (
      <span className="text-nb-gray-400">
        {dayjs(row.original.expires_at).format("D MMM, YYYY")}
      </span>
    ),
  },
  {
    id: "role_filter",
    accessorFn: (row) => [row.role],
    filterFn: "arrIncludesSome",
  },
  {
    id: "group_names_filter",
    accessorFn: (row) =>
      (row as UserInvite & { _group_names?: string[] })._group_names ?? [],
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "id",
    header: "",
    sortingFn: "text",
    cell: ({ row }) => <InviteActionCell invite={row.original} />,
  },
];

type Props = {
  headingTarget?: HTMLHeadingElement | null;
  onShowUsers?: () => void;
};

export default function UserInvitesTable({
  headingTarget,
  onShowUsers,
}: Readonly<Props>) {
  useFetchApi("/groups");
  const { groups } = useGroups();
  const { data: invites, isLoading } =
    useFetchApi<UserInvite[]>("/users/invites");
  const { mutate } = useSWRConfig();
  const path = usePathname();
  const { t } = useI18n();
  const columns = useMemo(() => createInvitesTableColumns(t), [t]);

  // Default sorting state of the table
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    "netbird-table-sort-invites" + path,
    [
      {
        id: "name",
        desc: true,
      },
    ],
  );

  const invitesWithGroupNames = useMemo(() => {
    if (!invites) return undefined;
    return invites.map((invite) => ({
      ...invite,
      _group_names: (invite.user_groups ?? [])
        .map((id) => groups?.find((g) => g.id === id)?.name)
        .filter((n): n is string => !!n),
    }));
  }, [invites, groups]);

  const tableGroups = useMemo(() => {
    const map = new Map<string, { id?: string; name: string }>();
    for (const inv of invitesWithGroupNames ?? []) {
      for (const name of inv._group_names) {
        if (name && !map.has(name)) map.set(name, { name });
      }
    }
    return Array.from(map.values());
  }, [invitesWithGroupNames]);

  const statusOptions = useMemo<RadioOption<boolean | undefined>[]>(
    () => [
      { value: undefined, label: t("common.all"), dotClass: "bg-nb-gray-500" },
      { value: false, label: t("filters.valid"), dotClass: "bg-green-500" },
      { value: true, label: t("filters.expired"), dotClass: "bg-red-500" },
    ],
    [t],
  );

  const roleOptions = useMemo<CheckboxOption<string>[]>(
    () => [
      { value: "owner", label: t("userRoles.owner") },
      { value: "admin", label: t("userRoles.admin") },
      { value: "user", label: t("userRoles.user") },
      { value: "network_admin", label: t("userRoles.networkAdmin") },
      { value: "billing_admin", label: t("userRoles.billingAdmin") },
      { value: "auditor", label: t("userRoles.auditor") },
    ],
    [t],
  );

  const filterDefs = useMemo<TableFilterDef[]>(
    () => [
      {
        id: "expired",
        label: t("common.status"),
        renderPicker: (p) => (
          <RadioPicker
            value={p.value as boolean | undefined}
            onChange={p.onChange}
            close={p.close}
            options={statusOptions}
          />
        ),
        formatChip: (v) =>
          formatRadioChip(v as boolean | undefined, statusOptions),
      },
      {
        id: "role_filter",
        label: t("table.role"),
        renderPicker: (p) => (
          <CheckboxListPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            options={roleOptions}
          />
        ),
        formatChip: (v) =>
          formatCheckboxChip(v as string[] | undefined, roleOptions, "roles"),
      },
      {
        id: "group_names_filter",
        label: t("table.groups"),
        renderPicker: (p) => (
          <GroupsPicker
            value={p.value as string[] | undefined}
            onChange={p.onChange}
            close={p.close}
            groups={tableGroups}
          />
        ),
        formatChip: (v) => formatGroupsChip(v as string[] | undefined, t),
      },
    ],
    [statusOptions, roleOptions, tableGroups, t],
  );

  return (
    <DataTable
      headingTarget={headingTarget}
      isLoading={isLoading}
      text={t("userInvites.title")}
      sorting={sorting}
      setSorting={setSorting}
      columns={columns}
      data={invitesWithGroupNames}
      initialPageSize={25}
      showResetFilterButton={false}
      searchPlaceholder={t("userInvites.searchPlaceholder")}
      aboveTable={(table) => (
        <TableFilterChips table={table} filters={filterDefs} />
      )}
      columnVisibility={{
        role_filter: false,
        group_names_filter: false,
      }}
      getStartedCard={
        <GetStartedTest
          icon={
            <SquareIcon
              icon={<Link2 className={"fill-nb-gray-200"} size={20} />}
              color={"gray"}
              size={"large"}
            />
          }
          title={t("userInvites.emptyTitle")}
          button={
            <div className={"flex flex-col items-center justify-center"}>
              <InviteUserButton show={true} />
            </div>
          }
        />
      }
      rightSide={() => (
        <InviteUserButton
          show={invites && invites?.length > 0}
          className={"ml-auto"}
        />
      )}
    >
      {(table) => {
        return (
          <>
            <TableFiltersButton
              table={table}
              filters={filterDefs}
              disabled={invites?.length == 0}
            />
            <DataTableResetFilterButton
              table={table}
              onClick={() => {
                table.setPageIndex(0);
                table.resetColumnFilters();
                table.resetGlobalFilter();
              }}
            />
            <DataTableRefreshButton
              isDisabled={invites?.length == 0}
              onClick={() => {
                mutate("/users/invites");
              }}
            />
            <Button variant={"secondary"} onClick={onShowUsers}>
              <User2 size={14} />
              {t("userInvites.showUsers")}
            </Button>
          </>
        );
      }}
    </DataTable>
  );
}

type InviteUserButtonProps = {
  show?: boolean;
  className?: string;
  groups?: Group[];
};

export const InviteUserButton = ({
  show = false,
  className,
  groups,
}: InviteUserButtonProps) => {
  const { permission } = usePermissions();
  const account = useAccount();
  const { t } = useI18n();

  if (!show) return null;

  // On cloud: always show "Invite User"
  // On self-hosted: only show when embedded_idp_enabled is true
  const isCloud = isNetBirdHosted();
  const embeddedIdpEnabled = account?.settings.embedded_idp_enabled;

  if (!isCloud && !embeddedIdpEnabled) return null;

  return (
    <UserInviteModal groups={groups}>
      <Button
        variant={"primary"}
        className={className}
        disabled={!permission.users.create}
      >
        <MailPlus size={16} />
        {isCloud ? t("users.inviteUser") : t("users.addUser")}
      </Button>
    </UserInviteModal>
  );
};
