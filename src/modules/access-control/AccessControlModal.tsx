"use client";

import Badge from "@components/Badge";
import Button from "@components/Button";
import { Callout } from "@components/Callout";
import { Checkbox } from "@components/Checkbox";
import { DropdownInfoText } from "@components/DropdownInfoText";
import { DropdownInput } from "@components/DropdownInput";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import { HelpTooltip } from "@components/HelpTooltip";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { PortSelector } from "@components/PortSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { Textarea } from "@components/Textarea";
import { ToggleSwitch } from "@components/ToggleSwitch";
import GroupBadge from "@components/ui/GroupBadge";
import PolicyDirection from "@components/ui/PolicyDirection";
import { VirtualScrollAreaList } from "@components/VirtualScrollAreaList";
import { useSearch } from "@hooks/useSearch";
import useFetchApi from "@utils/api";
import { cn } from "@utils/helpers";
import {
  AlertCircleIcon,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FolderDown,
  FolderInput,
  PlusCircle,
  Power,
  Share2,
  SquareTerminalIcon,
  Trash2,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import { Policy, PolicyRuleResource, Protocol } from "@/interfaces/Policy";
import { PostureCheck } from "@/interfaces/PostureCheck";
import { User } from "@/interfaces/User";
import { SSHAccessType } from "@/modules/access-control/ssh/SSHAccessType";
import { SSHAuthorizedGroups } from "@/modules/access-control/ssh/SSHAuthorizedGroups";
import {
  RuleState,
  useAccessControl,
} from "@/modules/access-control/useAccessControl";
import { PostureCheckTab } from "@/modules/posture-checks/ui/PostureCheckTab";
import { PostureCheckTabTrigger } from "@/modules/posture-checks/ui/PostureCheckTabTrigger";
import { SmallUserAvatar } from "@/modules/users/SmallUserAvatar";

type Props = {
  children?: React.ReactNode;
};

type UpdateModalProps = {
  policy: Policy;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  cell?: string;
  postureCheckTemplates?: PostureCheck[];
  onSuccess?: (policy: Policy) => void;
  useSave?: boolean;
  allowEditPeers?: boolean;
};

export default function AccessControlModal({ children }: Readonly<Props>) {
  const [modal, setModal] = useState(false);

  return (
    <Modal open={modal} onOpenChange={setModal} key={modal ? 1 : 0}>
      {children && <ModalTrigger asChild>{children}</ModalTrigger>}
      {modal && <AccessControlModalContent onSuccess={() => setModal(false)} />}
    </Modal>
  );
}

export function AccessControlUpdateModal({
  policy,
  open,
  onOpenChange,
  cell,
  postureCheckTemplates,
  onSuccess,
  useSave = true,
  allowEditPeers,
}: Readonly<UpdateModalProps>) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      {open && (
        <AccessControlModalContent
          onSuccess={(p) => {
            onOpenChange && onOpenChange(false);
            onSuccess && onSuccess(p);
          }}
          policy={policy}
          cell={cell}
          postureCheckTemplates={postureCheckTemplates}
          useSave={useSave}
          allowEditPeers={allowEditPeers}
        />
      )}
    </Modal>
  );
}

type RuleEditorProps = {
  ruleIndex: number;
  rule: RuleState;
  updateRule: (index: number, updates: Partial<RuleState>) => void;
  hasPortSupport: (protocol: Protocol) => boolean;
  allowEditPeers: boolean;
  onRemoveRule: () => void;
  canRemove: boolean;
  additionalResources?: NetworkResource[];
};

const userSearchPredicate = (item: User, query: string) => {
  const lowerCaseQuery = query.toLowerCase();
  return (
    item.name?.toLowerCase().includes(lowerCaseQuery) ||
    item.email?.toLowerCase().includes(lowerCaseQuery) ||
    item.id?.toLowerCase().includes(lowerCaseQuery)
  );
};

const groupSearchPredicate = (item: Group, query: string) => {
  const lowerCaseQuery = query.toLowerCase();
  return (
    item.name?.toLowerCase().includes(lowerCaseQuery) ||
    item.id?.toLowerCase().includes(lowerCaseQuery) ||
    false
  );
};

const resolveSelectedUsers = (
  selected: User[] | string[] | undefined,
  users?: User[],
): User[] => {
  if (!Array.isArray(selected)) return [];
  return selected
    .map((value) => {
      if (typeof value !== "string") return value;
      return users?.find((u) => u.id === value) ?? ({ id: value, name: value } as User);
    })
    .filter(Boolean) as User[];
};

const resolveSelectedGroups = (
  selected: Group[] | string[] | undefined,
  groups?: Group[],
): Group[] => {
  if (!Array.isArray(selected)) return [];
  return selected
    .map((value) => {
      if (typeof value !== "string") return value;
      return groups?.find((g) => g.id === value) ?? { id: value, name: value };
    })
    .filter(Boolean) as Group[];
};

const IdentitySourceSelector = ({
  users,
  groups,
  selectedUsers,
  selectedGroups,
  onUsersChange,
  onGroupsChange,
  disabled,
}: {
  users?: User[];
  groups?: Group[];
  selectedUsers?: User[] | string[];
  selectedGroups?: Group[] | string[];
  onUsersChange: (users: User[]) => void;
  onGroupsChange: (groups: Group[]) => void;
  disabled?: boolean;
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"users" | "groups">("users");
  const [search, setSearch] = useState("");

  const resolvedUsers = useMemo(
    () => resolveSelectedUsers(selectedUsers, users),
    [selectedUsers, users],
  );
  const resolvedGroups = useMemo(
    () => resolveSelectedGroups(selectedGroups, groups),
    [selectedGroups, groups],
  );

  const [filteredUsers, , setUserSearch] = useSearch(
    users || [],
    userSearchPredicate,
    { filter: true, debounce: 150 },
  );
  const [filteredGroups, , setGroupSearch] = useSearch(
    groups || [],
    groupSearchPredicate,
    { filter: true, debounce: 150 },
  );

  React.useEffect(() => {
    setUserSearch(search);
    setGroupSearch(search);
  }, [search, setGroupSearch, setUserSearch]);

  const toggleUser = (user: User) => {
    const exists = resolvedUsers.some((u) => u.id === user.id);
    onUsersChange(
      exists
        ? resolvedUsers.filter((u) => u.id !== user.id)
        : [...resolvedUsers, user],
    );
  };

  const toggleGroup = (group: Group) => {
    const exists = resolvedGroups.some((g) => g.id === group.id);
    onGroupsChange(
      exists
        ? resolvedGroups.filter((g) => g.id !== group.id)
        : [...resolvedGroups, group],
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(state) => {
        setOpen(state);
        if (!state) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            "min-h-[46px] w-full relative items-center group",
            "border border-neutral-200 dark:border-nb-gray-700 justify-between py-2 px-3",
            "rounded-md bg-white text-sm dark:bg-nb-gray-900/40 flex text-neutral-600 dark:text-neutral-400/70 cursor-pointer hover:bg-neutral-50 hover:dark:bg-nb-gray-900/50",
            "disabled:pointer-events-none disabled:bg-neutral-50 disabled:text-neutral-400 dark:disabled:bg-nb-gray-900/40 dark:disabled:text-neutral-500/70 transition-all",
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {resolvedUsers.length === 0 && resolvedGroups.length === 0 && (
              <span>{t("accessControl.selectUsersOrGroups")}</span>
            )}
            {resolvedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="gray-ghost"
                className="py-[3px]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleUser(user);
                }}
              >
                <SmallUserAvatar
                  id={user.id}
                  name={user.name}
                  email={user.email}
                  className="w-4 h-4 text-[8px]"
                />
                {user.name || user.email || user.id}
                <XIcon size={12} />
              </Badge>
            ))}
            {resolvedGroups.map((group) => (
              <GroupBadge
                key={group.id || group.name}
                group={group}
                showX
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleGroup(group);
                }}
              />
            ))}
          </div>
          <ChevronsUpDown size={18} className="shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        hideWhenDetached={false}
        className="w-[500px] p-0 shadow-sm shadow-neutral-200/70 dark:shadow-nb-gray-950"
        align="start"
        side="bottom"
        sideOffset={10}
      >
        <DropdownInput
          value={search}
          onChange={(value) => {
            if (typeof value === "string") setSearch(value);
          }}
          hideEnterIcon
          placeholder={t("accessControl.searchUsersOrGroups")}
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as "users" | "groups")}>
          <TabsList justify="start" className="px-3">
            <TabsTrigger value="users">
              <UserIcon size={14} />
              {t("accessControl.users")}
            </TabsTrigger>
            <TabsTrigger value="groups">
              <UsersIcon size={14} />
              {t("accessControl.userGroups")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="p-0 my-0">
            {filteredUsers.length === 0 ? (
              <DropdownInfoText className="mt-5 max-w-sm mx-auto">
                {t("userSelector.noMatchingUsers")}
              </DropdownInfoText>
            ) : (
              <VirtualScrollAreaList
                items={filteredUsers}
                estimatedItemHeight={44}
                onSelect={toggleUser}
                renderItem={(user) => {
                  const selected = resolvedUsers.some((u) => u.id === user.id);
                  return (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <SmallUserAvatar
                          id={user.id}
                          name={user.name}
                          email={user.email}
                          className="w-6 h-6 text-[10px]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm">
                            {user.name || user.id}
                          </span>
                          <span className="truncate text-xs text-neutral-500">
                            {user.email || user.id}
                          </span>
                        </div>
                      </div>
                      <Checkbox checked={selected} />
                    </div>
                  );
                }}
              />
            )}
          </TabsContent>
          <TabsContent value="groups" className="p-0 my-0">
            {filteredGroups.length === 0 ? (
              <DropdownInfoText className="mt-5 max-w-sm mx-auto">
                {t("accessControl.noMatchingUserGroups")}
              </DropdownInfoText>
            ) : (
              <VirtualScrollAreaList
                items={filteredGroups}
                estimatedItemHeight={42}
                onSelect={toggleGroup}
                renderItem={(group) => {
                  const selected = resolvedGroups.some((g) => g.id === group.id);
                  return (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <GroupBadge group={group} />
                      <Checkbox checked={selected} />
                    </div>
                  );
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

const RuleEditor = ({
  ruleIndex,
  rule,
  updateRule,
  hasPortSupport,
  allowEditPeers,
  onRemoveRule,
  canRemove,
  additionalResources,
}: RuleEditorProps) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const { data: users } = useFetchApi<User[]>("/users?service_user=false");
  const { data: groups } = useFetchApi<Group[]>("/groups");

  const portDisabled = !hasPortSupport(rule.protocol);

  const destinationHasResources = useMemo(() => {
    const isDestinationPeer = rule.destinationResource?.type === "peer";
    if (isDestinationPeer) return false;
    if (rule.destinationResource) return true;

    return rule.destinations.some((group) => {
      if (group.resources_count !== undefined) {
        return group.resources_count > 0;
      }
      if (group.resources && Array.isArray(group.resources)) {
        return group.resources.length > 0;
      }
      return false;
    });
  }, [rule.destinations, rule.destinationResource]);

  const destinationOnlyResources = useMemo(() => {
    const isDestinationPeer = rule.destinationResource?.type === "peer";
    if (isDestinationPeer) return false;
    if (rule.destinationResource) return true;

    return (
      rule.destinations.length > 0 &&
      rule.destinations.every((group) => {
        const hasPeers =
          group.peers_count !== undefined
            ? group.peers_count > 0
            : group.peers &&
              Array.isArray(group.peers) &&
              group.peers.length > 0;
        const hasResources =
          group.resources_count !== undefined
            ? group.resources_count > 0
            : group.resources &&
              Array.isArray(group.resources) &&
              group.resources.length > 0;

        return hasResources && !hasPeers;
      })
    );
  }, [rule.destinations, rule.destinationResource]);

  const { permission } = usePermissions();

  const actionLabel =
    rule.action === "accept"
      ? t("accessControl.actionAllow")
      : t("accessControl.actionDrop");
  const ruleTitle = rule.name?.trim() || t("accessControl.untitledRule");

  return (
    <div className={cn("border rounded-lg", expanded ? "p-4" : "px-4 py-3")}>
      <div
        className={cn(
          "flex justify-between items-center gap-4",
          expanded && "mb-4",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <Label className="text-base font-medium truncate">
            {ruleTitle}
            <span className="ml-2 text-sm text-neutral-500 font-normal dark:text-nb-gray-300">
              {actionLabel}
            </span>
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={rule.enabled}
            onCheckedChange={(v) => updateRule(ruleIndex, { enabled: v })}
          />
          {canRemove && (
            <button
              onClick={onRemoveRule}
              className="text-red-500 hover:text-red-700 p-1"
              title={t("accessControl.removeRule")}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="flex gap-6 items-center">
            <div className="w-full">
              <Label>{t("accessControl.action")}</Label>
              <Select
                value={rule.action}
                onValueChange={(v) =>
                  updateRule(ruleIndex, { action: v as "accept" | "drop" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">
                    {t("accessControl.actionAllow")}
                  </SelectItem>
                  <SelectItem value="drop">
                    {t("accessControl.actionDrop")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label>{t("accessControl.protocol")}</Label>
              <Select
                value={rule.protocol}
                onValueChange={(v) =>
                  updateRule(ruleIndex, { protocol: v as Protocol })
                }
              >
                <SelectTrigger>
                  <div className="flex items-center gap-3">
                    <Share2 size={15} className="text-gray-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("accessControl.allProtocol")}
                  </SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="icmp">ICMP</SelectItem>
                  <SelectItem value="netbird-ssh">
                    {t("accessControl.netbirdSsh")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-6 items-center">
            <div className="w-full self-start">
              <Label className="mb-2">
                <FolderDown size={15} />
                {t("accessControl.source")}
              </Label>
              <PeerGroupSelector
                popoverWidth={500}
                placeholder={t("accessControl.selectSources")}
                showRoutes={rule.protocol !== "netbird-ssh"}
                showResources={false}
                showPeers={rule.protocol !== "netbird-ssh"}
                showResourceCounter={false}
                showPeerCount={allowEditPeers}
                disableInlineRemoveGroup={false}
                values={rule.sources}
                onChange={(v) => {
                  const newSources =
                    typeof v === "function" ? v(rule.sources) : v;
                  updateRule(ruleIndex, { sources: newSources });
                }}
                resource={rule.sourceResource}
                onResourceChange={(v) =>
                  updateRule(ruleIndex, { sourceResource: v })
                }
                disabled={
                  !permission.policies.update || !permission.policies.create
                }
              />
              <div className="mt-3">
                <IdentitySourceSelector
                  users={users}
                  groups={groups}
                  selectedUsers={rule.sourceUsers}
                  selectedGroups={rule.sourceUserGroups}
                  onUsersChange={(v) => updateRule(ruleIndex, { sourceUsers: v })}
                  onGroupsChange={(v) =>
                    updateRule(ruleIndex, { sourceUserGroups: v })
                  }
                  disabled={
                    !permission.policies.update || !permission.policies.create
                  }
                />
              </div>
            </div>
            <PolicyDirection
              value={rule.direction}
              onChange={(v) => updateRule(ruleIndex, { direction: v })}
              disabled={destinationOnlyResources}
              protocol={rule.protocol}
              destinationResource={rule.destinationResource}
            />
            <div className="w-full self-start">
              <Label className="mb-2">
                <FolderInput size={15} />
                {t("accessControl.destination")}
              </Label>
              <PeerGroupSelector
                popoverWidth={500}
                placeholder={t("accessControl.selectDestinations")}
                showRoutes={true}
                showResources={rule.protocol !== "netbird-ssh"}
                showPeers={true}
                showResourceCounter={true}
                showPeerCount={allowEditPeers}
                disableInlineRemoveGroup={false}
                values={rule.destinations}
                onChange={(v) => {
                  const newDestinations =
                    typeof v === "function" ? v(rule.destinations) : v;
                  updateRule(ruleIndex, { destinations: newDestinations });
                }}
                resource={rule.destinationResource}
                onResourceChange={(v) =>
                  updateRule(ruleIndex, { destinationResource: v })
                }
                additionalResources={additionalResources}
              />
            </div>
          </div>

          {destinationHasResources &&
            !destinationOnlyResources &&
            rule.direction === "bi" && (
              <Callout
                variant="warning"
                icon={
                  <AlertCircleIcon
                    size={14}
                    className="shrink-0 relative top-[3px] text-netbird"
                  />
                }
              >
                {t("accessControl.resourceWarning")}
              </Callout>
            )}

          {rule.protocol === "netbird-ssh" ? (
            <div>
              {destinationHasResources && (
                <Callout
                  variant="warning"
                  icon={
                    <AlertCircleIcon
                      size={14}
                      className="shrink-0 relative top-[3px] text-netbird"
                    />
                  }
                >
                  {t("accessControl.sshResourceWarning")}
                </Callout>
              )}
              <div className="flex justify-between items-center gap-10">
                <div className="w-full">
                  <Label className="flex items-center gap-2">
                    <SquareTerminalIcon size={15} />
                    {t("accessControl.sshAccess")}
                  </Label>
                </div>
                <SSHAccessType
                  value={rule.sshAccessType}
                  onChange={(v) => {
                    const newAccessType =
                      typeof v === "function" ? v(rule.sshAccessType) : v;
                    updateRule(ruleIndex, { sshAccessType: newAccessType });
                  }}
                />
              </div>
              <SSHAuthorizedGroups
                sourceGroups={rule.sources}
                authorizedGroups={rule.sshAuthorizedGroups}
                setAuthorizedGroups={(v) =>
                  updateRule(ruleIndex, { sshAuthorizedGroups: v })
                }
                accessType={rule.sshAccessType}
              />
            </div>
          ) : (
            <div
              className={cn(
                "mb-2 mt-2",
                portDisabled && "opacity-30 pointer-events-none",
              )}
            >
              <div>
                <Label className="flex items-center gap-2">
                  {t("accessControl.ports")}
                </Label>
              </div>
              <div>
                <PortSelector
                  showAll={true}
                  ports={rule.ports}
                  onPortsChange={(v) => {
                    const newPorts =
                      typeof v === "function" ? v(rule.ports) : v;
                    updateRule(ruleIndex, { ports: newPorts });
                  }}
                  portRanges={rule.port_ranges}
                  onPortRangesChange={(v) => {
                    const newPortRanges =
                      typeof v === "function" ? v(rule.port_ranges) : v;
                    updateRule(ruleIndex, { port_ranges: newPortRanges });
                  }}
                  disabled={portDisabled}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>{t("accessControl.ruleNameRequired")}</Label>
              <Input
                value={rule.name || ""}
                onChange={(e) =>
                  updateRule(ruleIndex, { name: e.target.value })
                }
                placeholder={t("accessControl.ruleNamePlaceholder")}
                required
              />
            </div>
            <div className="flex-1">
              <Label>{t("accessControl.ruleDescription")}</Label>
              <Input
                value={rule.description || ""}
                onChange={(e) =>
                  updateRule(ruleIndex, { description: e.target.value })
                }
                placeholder={t("accessControl.ruleDescriptionPlaceholder")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type ModalProps = {
  onSuccess?: (p: Policy) => void;
  policy?: Policy;
  initialDestinationGroups?: Group[] | string[];
  initialName?: string;
  initialDescription?: string;
  cell?: string;
  postureCheckTemplates?: PostureCheck[];
  useSave?: boolean;
  allowEditPeers?: boolean;
  initialProtocol?: Protocol;
  initialPorts?: number[];
  initialDestinationResource?: PolicyRuleResource;
  initialTab?: string;
  disableDestinationSelector?: boolean;
  additionalResources?: NetworkResource[];
};

export function AccessControlModalContent({
  onSuccess,
  policy,
  cell,
  postureCheckTemplates,
  useSave = true,
  allowEditPeers = false,
  initialDestinationGroups,
  initialName,
  initialDescription,
  initialProtocol,
  initialPorts,
  initialDestinationResource,
  initialTab,
  disableDestinationSelector,
  additionalResources,
}: Readonly<ModalProps>) {
  const { permission } = usePermissions();
  const { t } = useI18n();

  const {
    rules,
    addRule,
    removeRule,
    policyName,
    setPolicyName,
    policyDescription,
    setPolicyDescription,
    policyEnabled,
    setPolicyEnabled,
    postureChecks,
    setPostureChecks,
    submit,
    getPolicyData,
    isPostureChecksLoading,
    updateRule,
    hasPortSupport,
  } = useAccessControl({
    policy,
    postureCheckTemplates,
    onSuccess,
    initialDestinationGroups,
    initialName,
    initialDescription,
    initialPorts,
    initialProtocol,
    initialDestinationResource,
  });

  const [tab, setTab] = useState(() => {
    if (initialTab && initialTab !== "") return initialTab;
    if (!cell) return "policy";
    if (cell == "posture_checks") return "posture_checks";
    return "policy";
  });

  const close = () => {
    const data = getPolicyData();
    onSuccess && onSuccess(data);
  };

  const hasInvalidRuleNames = rules.some((rule) => !rule.name?.trim());
  const isPolicyNameEmpty = policyName.trim().length === 0;

  return (
    <ModalContent maxWidthClass={"max-w-4xl"}>
      <ModalHeader
        icon={<AccessControlIcon className={"fill-netbird"} />}
        title={
          policy
            ? t("accessControl.modalUpdateTitle")
            : t("accessControl.modalCreateTitle")
        }
        description={t("accessControl.modalDescription")}
        color={"netbird"}
      />

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)} value={tab}>
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"policy"}>
            <ArrowRightLeft size={16} />
            {t("accessControl.rules")}
          </TabsTrigger>
          <PostureCheckTabTrigger disabled={false} />
          <TabsTrigger value={"general"} disabled={false}>
            {t("accessControl.tabGeneral")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"policy"} className={"pb-8"}>
          <div className="px-8 flex-col flex gap-4">
            {rules.map((rule, index) => (
              <RuleEditor
                key={index}
                ruleIndex={index}
                rule={rule}
                updateRule={updateRule}
                hasPortSupport={hasPortSupport}
                allowEditPeers={allowEditPeers}
                onRemoveRule={() => removeRule(index)}
                canRemove={rules.length > 1}
                additionalResources={additionalResources}
              />
            ))}
            <Button
              variant="secondary"
              onClick={addRule}
              className="w-full justify-center"
            >
              <PlusCircle size={16} />
              {t("accessControl.addRule")}
            </Button>
          </div>
        </TabsContent>
        <PostureCheckTab
          isLoading={isPostureChecksLoading}
          postureChecks={postureChecks}
          setPostureChecks={setPostureChecks}
        />
        <TabsContent value={"general"} className={"px-8 pb-6"}>
          <div className="flex flex-col gap-6">
            <div>
              <Label>{t("accessControl.ruleName")}</Label>
              <Input
                autoFocus={true}
                tabIndex={0}
                value={policyName}
                data-cy={"policy-name"}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder={t("accessControl.ruleNamePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("accessControl.ruleDescription")}</Label>
              <Textarea
                value={policyDescription}
                data-cy={"policy-description"}
                onChange={(e) => setPolicyDescription(e.target.value)}
                placeholder={t("accessControl.ruleDescriptionPlaceholder")}
                rows={3}
              />
            </div>
            <FancyToggleSwitch
              value={policyEnabled}
              onChange={setPolicyEnabled}
              disabled={
                !permission.policies.update || !permission.policies.create
              }
              label={
                <>
                  <Power size={15} />
                  {t("accessControl.enablePolicy")}
                </>
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      <ModalFooter className={"items-center"}>
        <div className="flex gap-3 w-full justify-end">
          {!policy ? (
            <>
              {tab === "policy" && (
                <>
                  <ModalClose asChild={true}>
                    <Button variant={"secondary"}>{t("actions.cancel")}</Button>
                  </ModalClose>
                  <Button
                    variant={"primary"}
                    disabled={hasInvalidRuleNames}
                    onClick={() => setTab("posture_checks")}
                  >
                    {t("actions.continue")}
                  </Button>
                </>
              )}

              {tab === "posture_checks" && (
                <>
                  <Button
                    variant={"secondary"}
                    onClick={() => setTab("policy")}
                  >
                    {t("actions.back")}
                  </Button>
                  <Button variant={"primary"} onClick={() => setTab("general")}>
                    {t("actions.continue")}
                  </Button>
                </>
              )}

              {tab === "general" && (
                <>
                  <Button
                    variant={"secondary"}
                    onClick={() => setTab("posture_checks")}
                  >
                    {t("actions.back")}
                  </Button>
                  <Button
                    variant={"primary"}
                    disabled={
                      isPolicyNameEmpty ||
                      hasInvalidRuleNames ||
                      !permission.policies.create
                    }
                    onClick={() => {
                      if (useSave) {
                        submit();
                      } else {
                        close();
                      }
                    }}
                    data-cy={"submit-policy"}
                  >
                    <PlusCircle size={16} />
                    {t("accessPolicies.addPolicy")}
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("actions.cancel")}</Button>
              </ModalClose>
              <Button
                variant={"primary"}
                disabled={
                  isPolicyNameEmpty ||
                  hasInvalidRuleNames ||
                  !permission.policies.update
                }
                onClick={() => {
                  if (useSave) {
                    submit();
                  } else {
                    close();
                  }
                }}
              >
                {t("actions.saveChanges")}
              </Button>
            </>
          )}
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
