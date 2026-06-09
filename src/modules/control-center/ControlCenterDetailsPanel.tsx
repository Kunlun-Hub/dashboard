"use client";

import Badge from "@components/Badge";
import Button from "@components/Button";
import { DeviceCard } from "@components/DeviceCard";
import { SmallBadge } from "@components/ui/SmallBadge";
import { cn } from "@utils/helpers";
import { Edge, Node } from "@xyflow/react";
import dayjs from "dayjs";
import {
  ChevronsLeft,
  ChevronsRight,
  FolderGit2,
  Link2Icon,
  MonitorSmartphoneIcon,
  NetworkIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  User2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { Network, NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { Policy } from "@/interfaces/Policy";
import { Role, User } from "@/interfaces/User";
import { FlowView } from "@/modules/control-center/FlowSelector";
import {
  getDestinationGroupsFromPolicy,
  getNetworksFromPolicy,
  getPolicyProtocolAndPortText,
  getSourceGroupsFromPolicy,
} from "@/modules/control-center/utils/helpers";

type Translate = ReturnType<typeof useI18n>["t"];

export type ControlCenterInspectTarget =
  | { kind: "summary"; view: FlowView }
  | { kind: "connection"; edgeId: string }
  | { kind: "peer"; peerId: string }
  | { kind: "group"; groupId: string; role?: "source" | "destination" }
  | { kind: "user"; userId: string }
  | { kind: "network"; networkId: string }
  | { kind: "resource"; resourceId: string }
  | { kind: "policy"; policyId: string };

type Props = {
  className?: string;
  currentView: FlowView;
  target: ControlCenterInspectTarget;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  peers: Peer[];
  groups: Group[];
  users: User[];
  networks: Network[];
  policies: Policy[];
  resources: NetworkResource[];
  nodes: Node[];
  edges: Edge[];
  nodeCount: number;
  edgeCount: number;
  onOpenPolicy: (policyId: string) => void;
};

export function ControlCenterDetailsPanel({
  className,
  currentView,
  target,
  collapsed,
  onToggleCollapsed,
  peers,
  groups,
  users,
  networks,
  policies,
  resources,
  nodes,
  edges,
  nodeCount,
  edgeCount,
  onOpenPolicy,
}: Readonly<Props>) {
  const { t } = useI18n();
  const router = useRouter();

  const resourceNetworkMap = useMemo(() => {
    const map = new Map<string, Network[]>();
    networks.forEach((network) => {
      (network.resources || []).forEach((resourceId) => {
        const current = map.get(resourceId) || [];
        current.push(network);
        map.set(resourceId, current);
      });
    });
    return map;
  }, [networks]);

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node] as const)),
    [nodes],
  );

  const renderSummary = () => (
    <>
      <PanelHeader
        icon={<ScanSearchIcon size={16} />}
        title={t("controlCenter.details")}
        description={t("controlCenter.emptySelection")}
        badge={
          <SmallBadge
            text={getViewLabel(currentView, t)}
            variant="sky"
            size="md"
          />
        }
      />
      <Section title={t("controlCenter.topology")}>
        <FactRow
          label={t("controlCenter.visibleNodes")}
          value={String(nodeCount)}
        />
        <FactRow
          label={t("controlCenter.visibleLinks")}
          value={String(edgeCount)}
        />
      </Section>
    </>
  );

  const renderConnection = (edge: Edge) => {
    const sourceMeta = getNodeMeta(edge.source, nodeMap, t);
    const targetMeta = getNodeMeta(edge.target, nodeMap, t);
    const edgeRelation = getEdgeRelation(edge, t);
    const edgeStatus = getEdgeStatus(edge, t);
    const connectedPolicy = getPolicyFromEdge(edge, nodeMap, policies);
    const edgeLabel =
      getEdgeLabel(edge, connectedPolicy) ||
      (connectedPolicy
        ? t("controlCenter.allTraffic")
        : t("controlCenter.notSpecified"));

    return (
      <>
        <PanelHeader
          icon={<Link2Icon size={16} />}
          title={edgeRelation}
          description={`${sourceMeta.title} -> ${targetMeta.title}`}
          badge={
            <Badge variant={edgeStatus.active ? "green" : "gray"} size="xs">
              {edgeStatus.text}
            </Badge>
          }
        />
        <Section title={t("controlCenter.connection")}>
          <FactRow
            label={t("controlCenter.sourceNode")}
            value={sourceMeta.title}
          />
          <FactRow
            label={t("controlCenter.targetNode")}
            value={targetMeta.title}
          />
          <FactRow
            label={t("controlCenter.edgeStyle")}
            value={edge.type || "-"}
          />
          <FactRow
            label={t("controlCenter.protocolOrScope")}
            value={edgeLabel}
          />
        </Section>
        <Section title={t("controlCenter.endpoints")}>
          <div className="flex flex-col gap-2">
            <EndpointCard
              title={sourceMeta.title}
              subtitle={sourceMeta.subtitle}
              badge={sourceMeta.kind}
            />
            <EndpointCard
              title={targetMeta.title}
              subtitle={targetMeta.subtitle}
              badge={targetMeta.kind}
            />
          </div>
        </Section>
        <ActionRow>
          {connectedPolicy?.id && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onOpenPolicy(connectedPolicy.id || "")}
            >
              {t("networks.editPolicy")}
            </Button>
          )}
        </ActionRow>
      </>
    );
  };

  const renderPeer = (peer: Peer) => {
    const peerGroupIds = peer.groups?.map((group) => group.id) || [];
    const peerGroups = groups.filter((group) =>
      peerGroupIds.includes(group.id),
    );
    const relatedPolicies = policies.filter((policy) =>
      getSourceGroupsFromPolicy(policy).some((group) =>
        peerGroupIds.includes(group.id),
      ),
    );

    return (
      <>
        <PanelHeader
          icon={<MonitorSmartphoneIcon size={16} />}
          title={peer.name}
          description={peer.ip}
          badge={
            <StateBadge
              active={peer.connected}
              activeText={t("saasDiagnostics.online")}
              inactiveText={t("saasDiagnostics.offline")}
            />
          }
        />
        <EntityCard>
          <DeviceCard device={peer} className="w-full !pl-0 !pr-0" />
        </EntityCard>
        <Section title={t("peerDetails.overview")}>
          <FactRow
            label={t("peerDetails.hostname")}
            value={peer.hostname || "-"}
          />
          <FactRow
            label={t("peerDetails.publicIpAddress")}
            value={peer.connection_ip || "-"}
          />
          <FactRow
            label={t("peerDetails.operatingSystem")}
            value={peer.os || "-"}
          />
          <FactRow label={t("table.version")} value={peer.version || "-"} />
          <FactRow
            label={t("peerDetails.lastSeen")}
            value={formatDate(peer.last_seen)}
          />
          <FactRow
            label={t("controlCenter.owner")}
            value={peer.user?.name || peer.user?.email || t("common.unknown")}
          />
        </Section>
        <Section title={t("peerDetails.assignedGroups")}>
          <ChipList items={peerGroups.map((group) => group.name)} />
        </Section>
        <Section title={t("groups.count.policies")}>
          <FactRow
            label={t("groups.count.policies")}
            value={String(relatedPolicies.length)}
          />
        </Section>
        <ActionRow>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => router.push(`/peer?id=${peer.id}`)}
          >
            {t("actions.viewDetails")}
          </Button>
          {peer.user_id && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => router.push(`/team/user?id=${peer.user_id}`)}
            >
              {t("users.title")}
            </Button>
          )}
        </ActionRow>
      </>
    );
  };

  const renderGroup = (group: Group, role?: "source" | "destination") => {
    const memberPeers = peers.filter((peer) =>
      (peer.groups?.map((item) => item.id) || []).includes(group.id),
    );
    const memberResources = resources.filter((resource) =>
      getGroupIdsFromResource(resource).includes(group.id),
    );
    const sourcePolicies = policies.filter((policy) =>
      getSourceGroupsFromPolicy(policy).some((item) => item.id === group.id),
    );
    const destinationPolicies = policies.filter((policy) =>
      getDestinationGroupsFromPolicy(policy).some(
        (item) => item.id === group.id,
      ),
    );

    return (
      <>
        <PanelHeader
          icon={<FolderGit2 size={16} />}
          title={group.name}
          description={
            role === "destination"
              ? t("controlCenter.destinationGroups")
              : t("controlCenter.sourceGroups")
          }
          badge={
            <SmallBadge
              text={
                role === "destination"
                  ? t("controlCenter.destination")
                  : t("controlCenter.source")
              }
              variant="yellow"
              size="md"
            />
          }
        />
        <Section title={t("groups.title")}>
          <FactRow
            label={t("groups.count.peers")}
            value={String(memberPeers.length)}
          />
          <FactRow
            label={t("groups.count.resources")}
            value={String(memberResources.length)}
          />
          <FactRow
            label={t("controlCenter.sourceGroups")}
            value={String(sourcePolicies.length)}
          />
          <FactRow
            label={t("controlCenter.destinationGroups")}
            value={String(destinationPolicies.length)}
          />
        </Section>
        <Section title={t("peers.title")}>
          <ChipList items={memberPeers.map((peer) => peer.name)} />
        </Section>
        <Section title={t("networkDetails.resources")}>
          <ChipList items={memberResources.map((resource) => resource.name)} />
        </Section>
        <ActionRow>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => router.push(`/group?id=${group.id}`)}
          >
            {t("actions.viewDetails")}
          </Button>
        </ActionRow>
      </>
    );
  };

  const renderUser = (user: User) => {
    const userPeers = peers.filter((peer) => peer.user_id === user.id);
    const userGroups = groups.filter((group) =>
      user.user_groups.includes(group.id || ""),
    );

    return (
      <>
        <PanelHeader
          icon={<User2Icon size={16} />}
          title={user.name || user.email || user.id}
          description={user.email || user.id}
          badge={
            <Badge variant="gray" size="xs">
              {getRoleLabel(user.role, t)}
            </Badge>
          }
        />
        <Section title={t("userDetails.title")}>
          <FactRow label={t("users.title")} value={user.name || "-"} />
          <FactRow
            label={t("controlCenter.status")}
            value={getUserStatusText(user, t)}
          />
          <FactRow label={t("peers.title")} value={String(userPeers.length)} />
          <FactRow
            label={t("groups.title")}
            value={String(userGroups.length)}
          />
        </Section>
        <Section title={t("peers.title")}>
          <ChipList items={userPeers.map((peer) => peer.name)} />
        </Section>
        <Section title={t("groups.title")}>
          <ChipList items={userGroups.map((group) => group.name)} />
        </Section>
        <ActionRow>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => router.push(`/team/user?id=${user.id}`)}
          >
            {t("actions.viewDetails")}
          </Button>
        </ActionRow>
      </>
    );
  };

  const renderNetwork = (network: Network) => {
    const networkResources = resources.filter((resource) =>
      (network.resources || []).includes(resource.id),
    );
    const networkPolicies = policies.filter((policy) =>
      (network.policies || []).includes(policy.id || ""),
    );

    return (
      <>
        <PanelHeader
          icon={<NetworkIcon size={16} />}
          title={network.name}
          description={network.description || t("networkDetails.network")}
          badge={
            <SmallBadge
              text={t("common.resourceCount", {
                count: networkResources.length,
              })}
              variant="blue"
              size="md"
            />
          }
        />
        <Section title={t("networkDetails.network")}>
          <FactRow
            label={t("networkDetails.resources")}
            value={String(networkResources.length)}
          />
          <FactRow
            label={t("networkDetails.routingPeers")}
            value={String(network.routing_peers_count ?? 0)}
          />
          <FactRow
            label={t("groups.count.policies")}
            value={String(networkPolicies.length)}
          />
        </Section>
        <Section title={t("networkDetails.resources")}>
          <ChipList items={networkResources.map((resource) => resource.name)} />
        </Section>
        <ActionRow>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => router.push(`/network?id=${network.id}`)}
          >
            {t("actions.viewDetails")}
          </Button>
        </ActionRow>
      </>
    );
  };

  const renderResource = (resource: NetworkResource) => {
    const resourceGroups = groups.filter((group) =>
      getGroupIdsFromResource(resource).includes(group.id),
    );
    const resourceNetworks = resourceNetworkMap.get(resource.id) || [];
    const matchedPolicies = policies.filter((policy) =>
      getDestinationGroupsFromPolicy(policy).some((group) =>
        resourceGroups.some((resourceGroup) => resourceGroup.id === group.id),
      ),
    );

    return (
      <>
        <PanelHeader
          icon={<NetworkIcon size={16} />}
          title={resource.name}
          description={resource.address}
          badge={
            <Badge variant="gray" size="xs">
              {resource.type || t("common.unknown")}
            </Badge>
          }
        />
        <EntityCard>
          <DeviceCard resource={resource} className="w-full !pl-0 !pr-0" />
        </EntityCard>
        <Section title={t("networkDetails.resources")}>
          <FactRow
            label={t("networkDetails.type")}
            value={resource.type || "-"}
          />
          <FactRow
            label={t("groups.title")}
            value={String(resourceGroups.length)}
          />
          <FactRow
            label={t("networks.title")}
            value={String(resourceNetworks.length)}
          />
          <FactRow
            label={t("groups.count.policies")}
            value={String(matchedPolicies.length)}
          />
        </Section>
        <Section title={t("groups.title")}>
          <ChipList items={resourceGroups.map((group) => group.name)} />
        </Section>
        <Section title={t("networks.title")}>
          <ChipList items={resourceNetworks.map((network) => network.name)} />
        </Section>
        <ActionRow>
          {resourceNetworks.slice(0, 2).map((network) => (
            <Button
              key={network.id}
              variant="secondary"
              size="xs"
              onClick={() => router.push(`/network?id=${network.id}`)}
            >
              {network.name}
            </Button>
          ))}
        </ActionRow>
      </>
    );
  };

  const renderPolicy = (policy: Policy) => {
    const rule = policy.rules?.[0];
    const sourceGroups = getSourceGroupsFromPolicy(policy);
    const destinationGroups = getDestinationGroupsFromPolicy(policy);
    const attachedNetworks = getNetworksFromPolicy(networks, policy);
    const policyLabel =
      getPolicyProtocolAndPortText(policy) || t("controlCenter.allTraffic");

    return (
      <>
        <PanelHeader
          icon={<ShieldCheckIcon size={16} />}
          title={rule?.name || policy.name}
          description={policyLabel}
          badge={
            <StateBadge
              active={policy.enabled && (rule?.enabled ?? true)}
              activeText={t("common.on")}
              inactiveText={t("common.disabled")}
            />
          }
        />
        <Section title={t("groups.count.policy")}>
          <FactRow
            label={t("controlCenter.sourceGroups")}
            value={String(sourceGroups.length)}
          />
          <FactRow
            label={t("controlCenter.destinationGroups")}
            value={String(destinationGroups.length)}
          />
          <FactRow
            label={t("networks.title")}
            value={String(attachedNetworks.length)}
          />
          <FactRow label={t("networkDetails.type")} value={policyLabel} />
        </Section>
        <Section title={t("controlCenter.sourceGroups")}>
          <ChipList items={sourceGroups.map((group) => group.name)} />
        </Section>
        <Section title={t("controlCenter.destinationGroups")}>
          <ChipList items={destinationGroups.map((group) => group.name)} />
        </Section>
        <Section title={t("networks.title")}>
          <ChipList items={attachedNetworks.map((network) => network.name)} />
        </Section>
        <ActionRow>
          {policy.id && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onOpenPolicy(policy.id || "")}
            >
              {t("networks.editPolicy")}
            </Button>
          )}
        </ActionRow>
      </>
    );
  };

  const content = (() => {
    switch (target.kind) {
      case "connection": {
        const edge = edges.find((item) => item.id === target.edgeId);
        return edge ? renderConnection(edge) : renderSummary();
      }
      case "peer": {
        const peer = peers.find((item) => item.id === target.peerId);
        return peer ? renderPeer(peer) : renderSummary();
      }
      case "group": {
        const group = groups.find((item) => item.id === target.groupId);
        return group ? renderGroup(group, target.role) : renderSummary();
      }
      case "user": {
        const user = users.find((item) => item.id === target.userId);
        return user ? renderUser(user) : renderSummary();
      }
      case "network": {
        const network = networks.find((item) => item.id === target.networkId);
        return network ? renderNetwork(network) : renderSummary();
      }
      case "resource": {
        const resource = resources.find(
          (item) => item.id === target.resourceId,
        );
        return resource ? renderResource(resource) : renderSummary();
      }
      case "policy": {
        const policy = policies.find((item) => item.id === target.policyId);
        return policy ? renderPolicy(policy) : renderSummary();
      }
      case "summary":
      default:
        return renderSummary();
    }
  })();

  return (
    <div
      className={cn(
        "absolute bottom-20 right-6 top-16 z-10 hidden lg:block",
        collapsed ? "w-0" : "w-[22rem]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className={cn(
          "absolute right-full top-4 flex h-11 w-11 items-center justify-center rounded-l-md border border-r-0 border-neutral-200 bg-white/95 text-neutral-500 shadow-lg transition-all hover:text-neutral-900 dark:border-nb-gray-800 dark:bg-nb-gray-940/95 dark:text-nb-gray-300 dark:hover:text-white",
        )}
        aria-label={
          collapsed
            ? t("controlCenter.expandDetails")
            : t("controlCenter.collapseDetails")
        }
        title={
          collapsed
            ? t("controlCenter.expandDetails")
            : t("controlCenter.collapseDetails")
        }
      >
        {collapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
      </button>

      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[22rem] flex-col overflow-hidden rounded-r-lg border border-neutral-200 bg-white/95 shadow-xl backdrop-blur-sm transition-all duration-200 dark:border-nb-gray-800 dark:bg-nb-gray-940/95",
          collapsed
            ? "pointer-events-none translate-x-[calc(100%+0.5rem)] opacity-0"
            : "translate-x-0 opacity-100",
        )}
      >
        <div className="flex-1 overflow-y-auto p-4">{content}</div>
      </div>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  description,
  badge,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}>) {
  return (
    <div className="mb-4 border-b border-neutral-200 pb-4 dark:border-nb-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-nb-gray-200">
            <span className="text-neutral-500 dark:text-nb-gray-400">
              {icon}
            </span>
            <span className="truncate">{title}</span>
          </div>
          {description && (
            <div className="text-xs leading-5 text-neutral-500 dark:text-nb-gray-400">
              {description}
            </div>
          )}
        </div>
        {badge}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-neutral-400 dark:text-nb-gray-500">
        {title}
      </div>
      <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-nb-gray-800 dark:bg-nb-gray-930/70">
        {children}
      </div>
    </div>
  );
}

function EntityCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-nb-gray-800 dark:bg-nb-gray-930/70">
      {children}
    </div>
  );
}

function FactRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 py-2 text-sm last:border-b-0 first:pt-0 last:pb-0 dark:border-nb-gray-800/70">
      <span className="text-neutral-500 dark:text-nb-gray-400">{label}</span>
      <span className="max-w-[11rem] text-right text-neutral-900 dark:text-nb-gray-100">
        {value}
      </span>
    </div>
  );
}

function ChipList({ items }: Readonly<{ items: string[] }>) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-neutral-400 dark:text-nb-gray-500">-</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 8).map((item) => (
        <Badge key={item} variant="gray" size="xs">
          {item}
        </Badge>
      ))}
      {items.length > 8 && (
        <SmallBadge
          text={`+${items.length - 8}`}
          variant="blue"
          size="md"
          className="self-center"
        />
      )}
    </div>
  );
}

function ActionRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="mt-2 flex flex-wrap gap-2">{children}</div>;
}

function EndpointCard({
  title,
  subtitle,
  badge,
}: Readonly<{
  title: string;
  subtitle?: string;
  badge: string;
}>) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-nb-gray-800 dark:bg-nb-gray-930/70">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="truncate text-sm font-medium text-neutral-900 dark:text-nb-gray-100">
          {title}
        </div>
        <Badge variant="gray" size="xs">
          {badge}
        </Badge>
      </div>
      {subtitle && (
        <div className="text-xs text-neutral-500 dark:text-nb-gray-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function StateBadge({
  active,
  activeText,
  inactiveText,
}: Readonly<{
  active: boolean;
  activeText: string;
  inactiveText: string;
}>) {
  return (
    <Badge variant={active ? "green" : "gray"} size="xs">
      {active ? activeText : inactiveText}
    </Badge>
  );
}

function getGroupIdsFromResource(resource: NetworkResource) {
  return (resource.groups || []).map((group) =>
    typeof group === "string" ? group : group.id,
  );
}

function getNodeMeta(nodeId: string, nodeMap: Map<string, Node>, t: Translate) {
  const node = nodeMap.get(nodeId);
  const data = (node?.data || {}) as {
    peer?: Peer;
    group?: Group;
    network?: Network;
    resource?: NetworkResource;
    policy?: Policy;
  };

  if (data.peer) {
    return {
      title: data.peer.name,
      subtitle: data.peer.ip,
      kind: t("peers.title"),
    };
  }

  if (data.group) {
    return {
      title: data.group.name,
      subtitle: t("groups.title"),
      kind: t("groups.title"),
    };
  }

  if (data.network) {
    return {
      title: data.network.name,
      subtitle: data.network.description || t("networks.title"),
      kind: t("networks.title"),
    };
  }

  if (data.resource) {
    return {
      title: data.resource.name,
      subtitle: data.resource.address,
      kind: t("networkDetails.resources"),
    };
  }

  if (data.policy) {
    const rule = data.policy.rules?.[0];
    return {
      title: rule?.name || data.policy.name,
      subtitle:
        getPolicyProtocolAndPortText(data.policy) ||
        t("controlCenter.allTraffic"),
      kind: t("groups.count.policy"),
    };
  }

  return {
    title: nodeId,
    subtitle: undefined,
    kind: t("controlCenter.node"),
  };
}

function getEdgeRelation(edge: Edge, t: Translate) {
  if (edge.id.includes("-policy-")) return t("controlCenter.policyConnection");
  if (edge.id.includes("-resource-"))
    return t("controlCenter.resourceConnection");
  if (edge.id.includes("-peer-")) return t("controlCenter.peerConnection");
  if (edge.id.includes("-network-"))
    return t("controlCenter.networkConnection");
  return t("controlCenter.connection");
}

function getEdgeStatus(edge: Edge, t: Translate) {
  const enabled = edge.data?.enabled;
  if (typeof enabled === "boolean") {
    return {
      active: enabled,
      text: enabled ? t("common.on") : t("common.disabled"),
    };
  }

  return {
    active: true,
    text: t("controlCenter.visible"),
  };
}

function getPolicyFromEdge(
  edge: Edge,
  nodeMap: Map<string, Node>,
  policies: Policy[],
) {
  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);
  const sourcePolicy = (sourceNode?.data as { policy?: Policy } | undefined)
    ?.policy;
  if (sourcePolicy?.id) return sourcePolicy;
  const targetPolicy = (targetNode?.data as { policy?: Policy } | undefined)
    ?.policy;
  if (targetPolicy?.id) return targetPolicy;
  const edgePolicyId = edge.id.match(/policy-([^-]+)/)?.[1];
  return policies.find((policy) => policy.id === edgePolicyId);
}

function getEdgeLabel(edge: Edge, policy?: Policy) {
  if (typeof edge.data?.label === "string" && edge.data.label.length > 0) {
    return edge.data.label;
  }

  if (policy) {
    return getPolicyProtocolAndPortText(policy);
  }

  return undefined;
}

function getViewLabel(view: FlowView, t: Translate) {
  if (view === FlowView.PEERS) return t("peers.title");
  if (view === FlowView.USERS) return t("users.title");
  if (view === FlowView.GROUPS) return t("groups.title");
  return t("networks.title");
}

function getRoleLabel(role: Role, t: Translate) {
  switch (role) {
    case Role.Owner:
      return t("userRoles.owner");
    case Role.Admin:
      return t("userRoles.admin");
    case Role.NetworkAdmin:
      return t("userRoles.networkAdmin");
    case Role.BillingAdmin:
      return t("userRoles.billingAdmin");
    case Role.Auditor:
      return t("userRoles.auditor");
    case Role.User:
    default:
      return t("userRoles.user");
  }
}

function getUserStatusText(user: User, t: Translate) {
  if (user.pending_approval) return t("users.status.pendingApproval");
  if (user.status === "blocked" || user.is_blocked) {
    return t("users.status.blocked");
  }
  if (user.status === "invited") return t("users.status.pending");
  if (user.status === "active") return t("users.status.active");
  return user.status || t("common.unknown");
}

function formatDate(value?: Date | string) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm") : "-";
}
