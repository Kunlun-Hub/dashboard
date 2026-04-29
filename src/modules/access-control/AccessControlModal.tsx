"use client";

import Button from "@components/Button";
import { Callout } from "@components/Callout";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
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
import Paragraph from "@components/Paragraph";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
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
import PolicyDirection from "@components/ui/PolicyDirection";
import { cn } from "@utils/helpers";
import {
  AlertCircleIcon,
  ArrowRightLeft,
  ExternalLinkIcon,
  FolderDown,
  FolderInput,
  PlusCircle,
  Power,
  Share2,
  SquareTerminalIcon,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import AccessControlIcon from "@/assets/icons/AccessControlIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import { Policy, PolicyRuleResource, Protocol } from "@/interfaces/Policy";
import { PostureCheck } from "@/interfaces/PostureCheck";
import { useAccessControl } from "@/modules/access-control/useAccessControl";
import { PostureCheckTab } from "@/modules/posture-checks/ui/PostureCheckTab";
import { PostureCheckTabTrigger } from "@/modules/posture-checks/ui/PostureCheckTabTrigger";
import { SSHAccessType } from "@/modules/access-control/ssh/SSHAccessType";
import { SSHAuthorizedGroups } from "@/modules/access-control/ssh/SSHAuthorizedGroups";
import { HelpTooltip } from "@components/HelpTooltip";

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
  allowEditPeers: boolean;
  onRemoveRule: () => void;
  canRemove: boolean;
  additionalResources?: NetworkResource[];
};

const RuleEditor = ({
  ruleIndex,
  allowEditPeers,
  onRemoveRule,
  canRemove,
  additionalResources,
}: RuleEditorProps) => {
  const {
    rules,
    updateRule,
    hasPortSupport,
  } = useAccessControl();
  
  const rule = rules[ruleIndex];
  const [expanded, setExpanded] = useState(true);

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

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          <Label className="text-lg font-medium">
            Rule {ruleIndex + 1} - {rule.action === "accept" ? "Allow" : "Deny"}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <FancyToggleSwitch
            value={rule.enabled}
            onChange={(v) => updateRule(ruleIndex, { enabled: v })}
            label=""
          />
          {canRemove && (
            <button
              onClick={onRemoveRule}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove Rule"
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
              <Label>Action</Label>
              <Select
                value={rule.action}
                onValueChange={(v) => updateRule(ruleIndex, { action: v as "accept" | "drop" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Allow (Accept)</SelectItem>
                  <SelectItem value="drop">Deny (Drop)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label>Protocol</Label>
              <Select
                value={rule.protocol}
                onValueChange={(v) => updateRule(ruleIndex, { protocol: v as Protocol })}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-3">
                    <Share2 size={15} className="text-gray-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Protocols</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="icmp">ICMP</SelectItem>
                  <SelectItem value="netbird-ssh">
                    NetBird SSH
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-6 items-center">
            <div className="w-full self-start">
              <Label className="mb-2">
                <FolderDown size={15} />
                Source
              </Label>
              <PeerGroupSelector
                popoverWidth={500}
                placeholder="Select Sources"
                showRoutes={rule.protocol !== "netbird-ssh"}
                showResources={false}
                showPeers={rule.protocol !== "netbird-ssh"}
                showResourceCounter={false}
                showPeerCount={allowEditPeers}
                disableInlineRemoveGroup={false}
                values={rule.sources}
                onChange={(v) => updateRule(ruleIndex, { sources: v })}
                resource={rule.sourceResource}
                onResourceChange={(v) => updateRule(ruleIndex, { sourceResource: v })}
                disabled={
                  !permission.policies.update || !permission.policies.create
                }
              />
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
                Destination
              </Label>
              <PeerGroupSelector
                popoverWidth={500}
                placeholder="Select Destinations"
                showRoutes={true}
                showResources={rule.protocol !== "netbird-ssh"}
                showPeers={true}
                showResourceCounter={true}
                showPeerCount={allowEditPeers}
                disableInlineRemoveGroup={false}
                values={rule.destinations}
                onChange={(v) => updateRule(ruleIndex, { destinations: v })}
                resource={rule.destinationResource}
                onResourceChange={(v) => updateRule(ruleIndex, { destinationResource: v })}
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
                Resource Warning
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
                  SSH Resource Warning
                </Callout>
              )}
              <div className="flex justify-between items-center gap-10">
                <div className="w-full">
                  <Label className="flex items-center gap-2">
                    <SquareTerminalIcon size={15} />
                    SSH Access
                  </Label>
                </div>
                <SSHAccessType
                  value={rule.sshAccessType}
                  onChange={(v) => updateRule(ruleIndex, { sshAccessType: v })}
                />
              </div>
              <SSHAuthorizedGroups
                sourceGroups={rule.sources}
                authorizedGroups={rule.sshAuthorizedGroups}
                setAuthorizedGroups={(v) => updateRule(ruleIndex, { sshAuthorizedGroups: v })}
                accessType={rule.sshAccessType}
              />
            </div>
          ) : (
            <div className={cn("mb-2 mt-2", portDisabled && "opacity-30 pointer-events-none")}>
              <div>
                <Label className="flex items-center gap-2">Ports</Label>
              </div>
              <div>
                <PortSelector
                  showAll={true}
                  ports={rule.ports}
                  onPortsChange={(v) => updateRule(ruleIndex, { ports: v })}
                  portRanges={rule.port_ranges}
                  onPortRangesChange={(v) => updateRule(ruleIndex, { port_ranges: v })}
                  disabled={portDisabled}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Rule Name (Optional)</Label>
              <Input
                value={rule.name || ""}
                onChange={(e) => updateRule(ruleIndex, { name: e.target.value })}
                placeholder="Rule name"
              />
            </div>
            <div className="flex-1">
              <Label>Rule Description (Optional)</Label>
              <Input
                value={rule.description || ""}
                onChange={(e) => updateRule(ruleIndex, { description: e.target.value })}
                placeholder="Rule description"
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
            Policy Rules
          </TabsTrigger>
          <PostureCheckTabTrigger disabled={false} />
          <TabsTrigger value={"general"} disabled={false}>
            Policy Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"policy"} className={"pb-8"}>
          <div className="px-8 flex-col flex gap-4">
            {rules.map((rule, index) => (
              <RuleEditor
                key={index}
                ruleIndex={index}
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
              Add Rule
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
        <div className="w-full">
          <Paragraph className={"text-sm mt-auto"}>
            {t("common.learnMorePrefix")}{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/manage-network-access"}
              target={"_blank"}
            >
              {t("accessControl.learnMoreLink")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
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
                  <Button
                    variant={"primary"}
                    onClick={() => setTab("general")}
                  >
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
                    disabled={policyName.length === 0 || !permission.policies.create}
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
                disabled={policyName.length === 0 || !permission.policies.update}
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
