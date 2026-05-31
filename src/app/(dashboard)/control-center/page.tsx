"use client";

import "@xyflow/react/dist/style.css";
import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { NoPeersGettingStarted } from "@components/NoPeersGettingStarted";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import SquareIcon from "@components/SquareIcon";
import GetStartedTest from "@components/ui/GetStartedTest";
import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import useFetchApi from "@utils/api";
import {
  Background,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import { forEach, orderBy, sortBy } from "lodash";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  LayoutGridIcon,
  LocateFixedIcon,
  MinusIcon,
  NetworkIcon,
  PlusIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import PoliciesProvider from "@/contexts/PoliciesProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { Network, NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { Policy } from "@/interfaces/Policy";
import { User } from "@/interfaces/User";
import PageContainer from "@/layouts/PageContainer";
import { AccessControlUpdateModal } from "@/modules/access-control/AccessControlModal";
import {
  ControlCenterDetailsPanel,
  ControlCenterInspectTarget,
} from "@/modules/control-center/ControlCenterDetailsPanel";
import { FlowSelector, FlowView } from "@/modules/control-center/FlowSelector";
import { NetworkRoutingPeerCount } from "@/modules/control-center/NetworkRoutingPeerCount";
import { ControlCenterCurrentUserBadge } from "@/modules/control-center/user/ControlCenterCurrentUserBadge";
import { EDGE_TYPES } from "@/modules/control-center/utils/edges";
import {
  getFirstGroup,
  getPolicyProtocolAndPortText,
  getResourcePolicyByGroups,
} from "@/modules/control-center/utils/helpers";
import {
  applyD3ForceLayout,
  applyD3HierarchicalLayout,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
} from "@/modules/control-center/utils/layouts";
import { NODE_TYPES } from "@/modules/control-center/utils/nodes";
import { OSLogo } from "@/modules/peers/PeerOSCell";

const MAX_EXPANDED_DESTINATION_PEERS = 6;
const MAX_EXPANDED_DESTINATION_RESOURCES = 6;

type ExpandedDestinationContent = {
  visiblePeers: Peer[];
  visibleResources: NetworkResource[];
  hiddenPeerCount: number;
  hiddenResourceCount: number;
};

export default function ControlCenter() {
  return (
    <ReactFlowProvider>
      <PoliciesProvider>
        <ControlCenterView />
      </PoliciesProvider>
    </ReactFlowProvider>
  );
}

function ControlCenterView() {
  const { t } = useI18n();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlow = useReactFlow();
  const { zoom } = useViewport();
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const { loggedInUser } = useLoggedInUser();

  const queryParams = useSearchParams();
  const queryTab = queryParams.get("tab");
  const initialTab = useMemo(() => {
    if (queryTab === "peers") return FlowView.PEERS;
    if (queryTab === "users") return FlowView.USERS;
    if (queryTab === "groups") return FlowView.GROUPS;
    if (queryTab === "networks") return FlowView.NETWORKS;
    return FlowView.PEERS;
  }, [queryTab]);
  const [currentView, setCurrentView] = useState<FlowView>(initialTab);

  const { data: policies, isLoading: isPoliciesLoading } =
    useFetchApi<Policy[]>("/policies");
  const { data: peers, isLoading: isPeersLoading } =
    useFetchApi<Peer[]>("/peers");
  const { data: networks, isLoading: isNetworksLoading } =
    useFetchApi<Network[]>("/networks");
  const { data: networkResources, isLoading: isResourcesLoading } = useFetchApi<
    NetworkResource[]
  >("/networks/resources");
  const { data: groups, isLoading: isGroupsLoading } =
    useFetchApi<Group[]>("/groups");
  const { data: users, isLoading: isUsersLoading } = useFetchApi<User[]>(
    "/users?service_user=false",
  );

  const isLoading =
    isPoliciesLoading ||
    isPeersLoading ||
    isNetworksLoading ||
    isResourcesLoading ||
    isGroupsLoading ||
    isUsersLoading;

  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedPeer, setSelectedPeer] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [previousSelectedUser, setPreviousSelectedUser] = useState("");

  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [selectedDestinationGroup, setSelectedDestinationGroup] = useState("");
  const [inspectedTarget, setInspectedTarget] =
    useState<ControlCenterInspectTarget | null>(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const networkOptions: SelectOption[] = useMemo(() => {
    let allNetworks = sortBy(
      networks?.map(
        (network) =>
          ({
            value: network.id,
            label: network.name,
            icon: NetworkIcon,
          }) as SelectOption,
      ) || [],
      "label",
      "asc",
    );
    allNetworks.unshift({
      value: "",
      label: t("controlCenter.allNetworks"),
      icon: () => <LayoutGridIcon size={14} />,
    } as SelectOption);
    return allNetworks;
  }, [networks, t]);

  const peerFilterUserId =
    currentView === FlowView.PEERS && previousSelectedUser
      ? previousSelectedUser
      : undefined;

  const peerOptions: SelectOption[] = useMemo(
    () =>
      orderBy(
        (peers ?? [])
          .filter((peer) => !peerFilterUserId || peer.user_id === peerFilterUserId)
          .map(
            (peer) =>
              ({
                value: peer.id || "",
                label: peer.name,
                searchValue: `${peer.id}${peer.name}${peer.ip}${peer.hostname}${peer.user?.name || ""}`,
                icon: () => (
                  <div className="flex h-4 w-4 items-center justify-center grayscale brightness-[100%] contrast-[40%]">
                    <OSLogo os={peer.os} />
                  </div>
                ),
              }) as SelectOption,
          ),
        ["label", "value"],
        ["asc", "asc"],
      ),
    [peerFilterUserId, peers],
  );

  const groupOptions: SelectOption[] = useMemo(
    () =>
      orderBy(
        (groups ?? []).map(
          (group) =>
            ({
              value: group.id || "",
              label: group.name,
              searchValue: `${group.id}${group.name}`,
              icon: () => (
                <GroupBadgeIcon
                  id={group?.id}
                  issued={group?.issued}
                  size={14}
                />
              ),
            }) as SelectOption,
        ),
        ["label", "value"],
        ["asc", "asc"],
      ),
    [groups],
  );

  const userOptions: SelectOption[] = useMemo(
    () =>
      orderBy(
        (users ?? []).map(
          (user) =>
            ({
              value: user.id || "",
              label: user.name || user.email || user.id || "",
              searchValue: `${user.id}${user.email}${user.name}`,
            }) as SelectOption,
        ),
        ["label", "value"],
        ["asc", "asc"],
      ),
    [users],
  );

  const getPeersAndResourcesForGroup = useCallback(
    (groupId: string) => {
      const resources =
        networkResources?.filter((resource) => {
          const resourceGroupIds =
            resource.groups?.map((group) =>
              typeof group === "string" ? group : group.id,
            ) || [];
          return resourceGroupIds.includes(groupId);
        }) || [];

      const groupPeers =
        peers?.filter((peer) => {
          const peerGroupIds = peer.groups?.map((group) => group.id) || [];
          return peerGroupIds.includes(groupId);
        }) || [];

      return { resources, peers: groupPeers };
    },
    [networkResources, peers],
  );

  const getExpandedDestinationContent = useCallback(
    (groupId: string): ExpandedDestinationContent => {
      const { resources, peers: groupPeers } = getPeersAndResourcesForGroup(groupId);

      return {
        visiblePeers: groupPeers.slice(0, MAX_EXPANDED_DESTINATION_PEERS),
        visibleResources: resources.slice(0, MAX_EXPANDED_DESTINATION_RESOURCES),
        hiddenPeerCount: Math.max(
          groupPeers.length - MAX_EXPANDED_DESTINATION_PEERS,
          0,
        ),
        hiddenResourceCount: Math.max(
          resources.length - MAX_EXPANDED_DESTINATION_RESOURCES,
          0,
        ),
      };
    },
    [getPeersAndResourcesForGroup],
  );

  const createDestinationSummaryNode = useCallback(
    (
      groupId: string,
      hiddenPeerCount: number,
      hiddenResourceCount: number,
      position: { x: number; y: number },
      enabled = true,
    ): Node | null => {
      const hiddenTotal = hiddenPeerCount + hiddenResourceCount;
      if (!hiddenTotal) return null;

      const parts: string[] = [];
      if (hiddenPeerCount > 0) {
        parts.push(
          t("controlCenter.hiddenPeerCount", { count: hiddenPeerCount }),
        );
      }
      if (hiddenResourceCount > 0) {
        parts.push(
          t("controlCenter.hiddenResourceCount", {
            count: hiddenResourceCount,
          }),
        );
      }

      return {
        id: `summary-${groupId}`,
        type: "summaryNode",
        data: {
          title: t("controlCenter.moreCount", { count: hiddenTotal }),
          subtitle: parts.join(", "),
          enabled,
        },
        position,
      };
    },
    [t],
  );

  const createDestinationSummaryEdge = useCallback(
    (groupId: string, enabled = true): Edge => ({
      id: `group-summary-${groupId}`,
      source: `group-${groupId}`,
      target: `summary-${groupId}`,
      type: "simple",
      data: { enabled },
    }),
    [],
  );

  const onDestinationGroupSelect = useCallback(
    (groupId: string) => {
      const isTogglingSameGroup = selectedDestinationGroup === groupId;
      const newSelectedGroup = isTogglingSameGroup ? "" : groupId;

      setSelectedDestinationGroup(newSelectedGroup);
      if (newSelectedGroup) setDetailsCollapsed(false);
      setInspectedTarget(
        newSelectedGroup
          ? {
              kind: "group",
              groupId: newSelectedGroup,
              role: "destination",
            }
          : null,
      );

      if (
        currentView !== FlowView.PEERS &&
        currentView !== FlowView.GROUPS &&
        currentView !== FlowView.USERS
      ) {
        setLayoutInitialized(false);
        return;
      }

      const addExpandedNodes = (groupId: string, baseNodes: Node[]) => {
        const {
          visiblePeers,
          visibleResources,
          hiddenPeerCount,
          hiddenResourceCount,
        } = getExpandedDestinationContent(groupId);
        const destinationGroupNode = baseNodes.find(
          (node) => node.id === `group-${groupId}`,
        );

        if (!destinationGroupNode) return [];

        const baseX = destinationGroupNode.position.x + 300;
        const groupCenterY = destinationGroupNode.position.y;
        const nodeSpacing = 80;
        const totalNodes =
          visiblePeers.length +
          visibleResources.length +
          (hiddenPeerCount + hiddenResourceCount > 0 ? 1 : 0);
        const totalHeight = (totalNodes - 1) * nodeSpacing;
        const startY = groupCenterY - totalHeight / 2;

        const newNodes: Node[] = [];
        let currentY = startY;

        // Add peer nodes
        visiblePeers.forEach((peer) => {
          newNodes.push({
            id: `peer-${peer.id}`,
            type:
              currentView === FlowView.PEERS ? "expandedGroupPeer" : "peerNode",
            data: { peer },
            position: { x: baseX, y: currentY },
          });
          currentY += nodeSpacing;
        });

        // Add resource nodes
        visibleResources.forEach((resource) => {
          newNodes.push({
            id: `resource-${resource.id}`,
            type: "resourceNode",
            data: { resource },
            position: { x: baseX, y: currentY },
          });
          currentY += nodeSpacing;
        });

        const summaryNode = createDestinationSummaryNode(
          groupId,
          hiddenPeerCount,
          hiddenResourceCount,
          { x: baseX, y: currentY },
        );
        if (summaryNode) newNodes.push(summaryNode);

        return newNodes;
      };

      const addExpandedEdges = (groupId: string) => {
        const {
          visiblePeers,
          visibleResources,
          hiddenPeerCount,
          hiddenResourceCount,
        } = getExpandedDestinationContent(groupId);
        const newEdges: Edge[] = [];

        // Add peer edges
        visiblePeers.forEach((peer) => {
          newEdges.push({
            id: `group-peer-${groupId}-${peer.id}`,
            source: `group-${groupId}`,
            target: `peer-${peer.id}`,
            type: "simple",
            data: { enabled: true },
          });
        });

        // Add resource edges
        visibleResources.forEach((resource) => {
          newEdges.push({
            id: `group-resource-${groupId}-${resource.id}`,
            source: `group-${groupId}`,
            target: `resource-${resource.id}`,
            type: "simple",
            data: { enabled: true },
          });
        });

        if (hiddenPeerCount + hiddenResourceCount > 0) {
          newEdges.push(createDestinationSummaryEdge(groupId));
        }

        return newEdges;
      };

      // Update nodes
      setNodes((prevNodes) => {
        // Remove previous nodes
        const baseNodes = prevNodes.filter(
          (node) =>
            !node.id.startsWith(`peer-`) &&
            !node.id.startsWith(`dest-peer-`) &&
            !node.id.startsWith(`resource-`),
        );
        const nodesWithoutSummary = baseNodes.filter(
          (node) => !node.id.startsWith(`summary-`),
        );
        // If toggling a new group, add its nodes
        if (!isTogglingSameGroup) {
          const expandedNodes = addExpandedNodes(groupId, nodesWithoutSummary);
          return [...nodesWithoutSummary, ...expandedNodes];
        }
        return nodesWithoutSummary;
      });

      // Update edges
      setEdges((prevEdges) => {
        // Remove all previously expanded peer/resource edges
        const baseEdges = prevEdges.filter(
          (edge) =>
            !edge.id.includes(`group-peer-`) &&
            !edge.id.includes(`group-resource-`) &&
            !edge.id.includes(`group-summary-`),
        );
        // If expanding a new group, add its edges
        if (!isTogglingSameGroup) {
          const expandedEdges = addExpandedEdges(groupId);
          return [...baseEdges, ...expandedEdges];
        }
        return baseEdges;
      });
    },
    [
      selectedDestinationGroup,
      currentView,
      setNodes,
      setEdges,
      getExpandedDestinationContent,
      createDestinationSummaryNode,
      createDestinationSummaryEdge,
    ],
  );

  const applySingleGroupView = (groupId: string) => {
    if (!policies || isLoading) return;
    if (!groups || isGroupsLoading) return;
    if (!networks || isNetworksLoading) return;
    if (!networkResources || isResourcesLoading) return;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const sourceGroup = groups.find((group) => group.id === groupId);
    if (!sourceGroup) return;

    allNodes.push({
      id: `source-group-${groupId}`,
      type: "sourceGroupNode",
      data: {
        group: sourceGroup,
        hoverable: false,
      },
      position: { x: 0, y: 0 },
    });

    const groupPolicies = sortBy(
      policies.filter((policy) => {
        const rule = policy.rules?.[0];
        if (!rule) return false;
        const sources = rule.sources as Group[];
        return sources?.some((d) => d.id === groupId);
      }),
      "enabled",
      "asc",
    );

    groupPolicies.forEach((policy) => {
      const enabled = policy.rules?.[0]?.enabled;
      const nodeExists = allNodes.some((n) => n.id === `policy-${policy.id}`);
      if (!nodeExists) {
        allNodes.push({
          id: `policy-${policy.id}`,
          type: "policyNode",
          data: {
            policy,
          },
          position: { x: 0, y: 0 },
        });
      }

      const edgeExists = allEdges.some(
        (e) => e.id === `group-policy-${groupId}-${policy.id}`,
      );
      if (!edgeExists) {
        allEdges.push({
          id: `group-policy-${groupId}-${policy.id}`,
          source: `source-group-${groupId}`,
          target: `policy-${policy.id}`,
          type: "in",
          data: { enabled, type: "bezier" },
        });
      }

      const destinations = orderBy(
        policy.rules?.[0].destinations as Group[],
        "name",
        "asc",
      );
      destinations?.forEach((destination) => {
        const destinationNodeId = `group-${destination.id}`;
        const destinationNodeExists = allNodes.some(
          (n) => n.id === destinationNodeId,
        );
        if (!destinationNodeExists) {
          allNodes.push({
            id: destinationNodeId,
            type: "destinationGroupNode",
            data: {
              group: destination,
            },
            position: { x: 0, y: 0 },
          });

          if (selectedDestinationGroup == destination.id) {
            const {
              visiblePeers,
              visibleResources,
              hiddenPeerCount,
              hiddenResourceCount,
            } = getExpandedDestinationContent(destination.id || "");

            visiblePeers.forEach((peer) => {
              const peerNodeId = `peer-${peer.id}`;
              const peerNodeExists = allNodes.some((n) => n.id === peerNodeId);
              if (!peerNodeExists) {
                allNodes.push({
                  id: peerNodeId,
                  type: "peerNode",
                  data: { peer },
                  position: { x: 0, y: 0 },
                });
              } else {
                allNodes.forEach((n) => {
                  if (n.id === peerNodeId) {
                    n.data = {
                      ...n.data,
                      enabled,
                    };
                  }
                });
              }

              const peerEdgeExists = allEdges.some(
                (e) => e.id === `group-peer-${destination.id}-${peer.id}`,
              );
              if (!peerEdgeExists) {
                allEdges.push({
                  id: `group-peer-${destination.id}-${peer.id}`,
                  source: `group-${destination.id}`,
                  target: peerNodeId,
                  type: "simple",
                });
              } else {
                allEdges.forEach((e) => {
                  if (e.id === `group-peer-${destination.id}-${peer.id}`) {
                    e.data = {
                      ...e.data,
                      enabled,
                    };
                  }
                });
              }
            });

            // add resource nodes
            visibleResources.forEach((resource) => {
              const resourceNodeId = `resource-${resource.id}`;
              const resourceNodeExists = allNodes.some(
                (n) => n.id === resourceNodeId,
              );
              if (!resourceNodeExists) {
                allNodes.push({
                  id: resourceNodeId,
                  type: "resourceNode",
                  data: { resource },
                  position: { x: 0, y: 0 },
                });
              } else {
                allNodes.forEach((n) => {
                  if (n.id === resourceNodeId) {
                    n.data = {
                      ...n.data,
                      enabled,
                    };
                  }
                });
              }

              const resourceEdgeExists = allEdges.some(
                (e) =>
                  e.id === `group-resource-${destination.id}-${resource.id}`,
              );
              if (!resourceEdgeExists) {
                allEdges.push({
                  id: `group-resource-${destination.id}-${resource.id}`,
                  source: `group-${destination.id}`,
                  target: resourceNodeId,
                  type: "simple",
                  data: {
                    enabled,
                  },
                });
              } else {
                allEdges.forEach((e) => {
                  if (
                    e.id === `group-resource-${destination.id}-${resource.id}`
                  ) {
                    e.data = {
                      ...e.data,
                      enabled,
                    };
                  }
                });
              }
            });
          }
        } else {
          allNodes.forEach((n) => {
            if (n.id === destinationNodeId) {
              n.data = {
                ...n.data,
                enabled,
              };
            }
          });
        }

        const destinationEdgeExists = allEdges.some(
          (e) => e.id === `policy-group-${policy.id}-${destination.id}`,
        );
        if (!destinationEdgeExists) {
          allEdges.push({
            id: `policy-group-${policy.id}-${destination.id}`,
            source: `policy-${policy.id}`,
            target: destinationNodeId,
            type: "in",
            data: { enabled, type: "bezier" },
          });
        } else {
          allEdges.forEach((e) => {
            if (e.id === `policy-group-${policy.id}-${destination.id}`) {
              e.data = {
                ...e.data,
                enabled,
              };
            }
          });
        }
      });

      // Add destination resource nodes
      addDestinationResourceNodes(policy, allNodes, allEdges);
    });

    return applyD3HierarchicalLayout(allNodes, allEdges, 400, 120, "group", {
      policy: { width: 500, spacing: 60 },
      destinationGroup: { width: 1000, spacing: 100 },
      peersAndResources: { width: 1400, spacing: 80 },
    });
  };

  const applySingleNetworkView = (networkId: string) => {
    if (isLoading) return;
    if (layoutInitialized) return;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    const network = networks?.find((n) => n.id === networkId);
    if (!network) return;

    const networkPolicies = network.policies || [];

    forEach(networkPolicies, (p) => {
      const policy = policies?.find((policyItem) => policyItem.id === p);
      if (!policy) return;
      const enabled = policy.rules?.[0]?.enabled;

      const existsPolicy = allNodes.find(
        (node) => node.id === `policy-${policy.id}`,
      );
      if (!existsPolicy) {
        allNodes.push({
          id: `policy-${policy.id}`,
          type: "policyNode",
          data: {
            policy,
            enabled,
          },
          position: { x: 0, y: 0 },
        });
      }

      const rule = policy.rules?.[0];
      if (rule) {
        const ruleSourceGroups = (rule.sources as Group[]) || [];

        ruleSourceGroups.forEach((group) => {
          if (!allNodes.find((node) => node.id === `group-${group.id}`)) {
            allNodes.push({
              id: `group-${group.id}`,
              type: "groupNode",
              data: {
                group,
                enabled,
                onClick: () => forceSingleGroupView(group.id || ""),
              },
              position: { x: 0, y: 0 },
            });
          }

          const edgeExists = allEdges.find(
            (edge) => edge.id === `group-${group.id}-policy-${policy.id}`,
          );
          if (!edgeExists) {
            allEdges.push({
              id: `group-${group.id}-policy-${policy.id}`,
              source: `group-${group.id}`,
              target: `policy-${policy.id}`,
              type: "in",
              data: {
                enabled,
                type: "bezier",
              },
            });
          }
        });
      }
    });

    const resources = network.resources || [];

    resources.forEach((r) => {
      const resource = networkResources?.find((n) => n.id === r);
      if (!resource) return;

      const existsResource = allNodes.find(
        (node) => node.id === `resource-${resource.id}`,
      );
      if (!existsResource) {
        allNodes.push({
          id: `resource-${resource.id}`,
          type: "resourceNode",
          data: {
            resource,
          },
          position: { x: 0, y: 0 },
        });
      }

      const networkResourceGroups = (resource.groups as Group[]) || [];

      let resourcePolicies = getResourcePolicyByGroups(
        networkResourceGroups as Group[],
        policies ?? [],
      );

      resourcePolicies = resourcePolicies.filter((rp) =>
        networkPolicies.includes(rp.id || ""),
      );

      resourcePolicies.forEach((policy) => {
        const rule = policy.rules?.[0];
        const enabled = policy.enabled;
        if (rule) {
          const ruleSourceGroups = (rule.sources as Group[]) || [];
          const ruleDestinationGroups = (rule.destinations as Group[]) || [];

          ruleDestinationGroups.forEach((group) => {
            const resourceGroup = networkResourceGroups.find(
              (g) => g.id === group.id,
            );
            if (!resourceGroup) return;

            if (!allNodes.find((node) => node.id === `group-${group.id}`)) {
              allNodes.push({
                id: `group-${group.id}`,
                type: "destinationGroupNode",
                data: {
                  group,
                  enabled,
                  hoverable: false,
                },
                position: { x: 0, y: 0 },
              });
            }

            // add edge from policy to destination group
            const policyDestinationEdgeExists = allEdges.find(
              (edge) => edge.id === `policy-${policy.id}-group-${group.id}`,
            );
            if (!policyDestinationEdgeExists) {
              allEdges.push({
                id: `policy-${policy.id}-group-${group.id}`,
                source: `policy-${policy.id}`,
                target: `group-${group.id}`,
                type: "in",
                data: {
                  enabled,
                  type: "bezier",
                },
              });
            }

            // add edge from destination group to resource
            const groupResourceEdgeExists = allEdges.find(
              (edge) => edge.id === `group-${group.id}-resource-${resource.id}`,
            );
            if (!groupResourceEdgeExists) {
              allEdges.push({
                id: `group-${group.id}-resource-${resource.id}`,
                source: `group-${group.id}`,
                target: `resource-${resource.id}`,
                type: "simple",
              });
            }
          });

          ruleSourceGroups.forEach((group) => {
            // Ensure the group node exists
            if (!allNodes.find((node) => node.id === `group-${group.id}`)) {
              allNodes.push({
                id: `group-${group.id}`,
                type: "groupNode",
                data: {
                  group,
                  enabled,
                },
                position: { x: 0, y: 0 },
              });
            }

            const groupPolicyEdgeExists = allEdges.find(
              (edge) => edge.id === `group-${group.id}-policy-${policy.id}`,
            );
            if (!groupPolicyEdgeExists) {
              allEdges.push({
                id: `group-${group.id}-policy-${policy.id}`,
                source: `group-${group.id}`,
                target: `policy-${policy.id}`,
                type: "in",
                data: {
                  enabled,
                  type: "bezier",
                },
              });
            }
          });
        }
      });
    });

    return applyD3HierarchicalLayout(allNodes, allEdges, 400, 120, "network", {
      policy: { width: 500, spacing: 60 },
      destinationGroup: { width: 1000, spacing: 100 },
      peersAndResources: { width: 1400, spacing: 80 },
    });
  };

  const applyNetworksView = () => {
    if (!policies || isLoading) return;
    if (!groups || isGroupsLoading) return;
    if (!networks || isNetworksLoading) return;
    if (!networkResources || isResourcesLoading) return;

    if (layoutInitialized) return;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    const hidePolicies = !selectedNetwork;

    networks.forEach((network) => {
      const resourceIds = new Set(network.resources || []);
      const resources =
        networkResources?.filter((resource) =>
          resourceIds.has(resource?.id || ""),
        ) || [];
      const visibleResources = resources.slice(0, 6);

      allNodes.push({
        id: `network-${network.id}`,
        type: "networkNode",
        data: {
          network,
          resources: visibleResources,
          hiddenResourceCount: Math.max(
            resources.length - visibleResources.length,
            0,
          ),
        },
        draggable: true,
        position: { x: 0, y: 0 },
      });

      (network.policies || []).forEach((policyId) => {
        const policy = policies.find((item) => item.id === policyId);
        if (!policy) return;

        const enabled = policy.rules?.[0]?.enabled;
        const rule = policy.rules?.[0];
        if (!rule) return;

        const ruleSourceGroups = (rule.sources as Group[]) || [];
        ruleSourceGroups.forEach((group) => {
          if (!allNodes.find((node) => node.id === `group-${group.id}`)) {
            allNodes.push({
              id: `group-${group.id}`,
              type: "groupNode",
              data: {
                group,
                enabled,
                onClick: () => forceSingleGroupView(group.id || ""),
              },
              position: { x: 0, y: 0 },
            });
          }

          const edgeExists = allEdges.some(
            (edge) => edge.id === `group-${group.id}-network-${network.id}`,
          );
          if (!edgeExists && hidePolicies) {
            allEdges.push({
              id: `group-${group.id}-network-${network.id}`,
              source: `group-${group.id}`,
              target: `network-${network.id}`,
              type: "floating-straight",
              data: { label: getPolicyProtocolAndPortText(policy) },
            });
          }
        });
      });
    });

    return applyD3ForceLayout(allNodes, allEdges);
  };

  const applyPeerView = (peerId: string) => {
    if (!policies || isLoading) return;
    if (!groups || isGroupsLoading) return;
    if (!networks || isNetworksLoading) return;
    if (!networkResources || isResourcesLoading) return;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    const peer = peers?.find((p) => p.id === peerId);
    if (!peer) return;

    allNodes.push({
      id: `source-peer-${peer.id}`,
      type: "sourcePeerNode",
      data: { peer },
      position: { x: 0, y: 0 },
    });

    const peerGroups = peer.groups || [];

    const peerPolicies = sortBy(
      policies?.filter((p) => {
        const rule = p.rules?.[0];
        if (!rule) return false;
        const sources = rule.sources as Group[];
        return sources?.some((d) => peerGroups?.some((pg) => pg.id === d.id));
      }),
      "enabled",
      "desc",
    );

    peerPolicies?.forEach((policy) => {
      const enabled = policy.enabled;
      const nodeExists = allNodes.some((n) => n.id === `policy-${policy.id}`);
      if (!nodeExists) {
        allNodes.push({
          id: `policy-${policy.id}`,
          type: "policyNode",
          data: { policy },
          position: { x: 0, y: 0 },
        });
      }

      const edgeExists = allEdges.some(
        (e) => e.id === `peer-policy-${peer.id}-${policy.id}`,
      );
      if (!edgeExists) {
        allEdges.push({
          id: `peer-policy-${peer.id}-${policy.id}`,
          source: `source-peer-${peer.id}`,
          target: `policy-${policy.id}`,
          type: "in",
          data: { enabled, type: "bezier" },
        });
      }
      // add destination groups
      const destinations = policy.rules?.[0].destinations as Group[];
      destinations?.forEach((destination) => {
        const destinationNodeId = `group-${destination.id}`;
        const destinationNodeExists = allNodes.some(
          (n) => n.id === destinationNodeId,
        );

        if (!destinationNodeExists) {
          allNodes.push({
            id: destinationNodeId,
            type: "destinationGroupNode",
            data: {
              group: destination,
            },
            position: { x: 0, y: 0 },
          });
        } else {
          allNodes.forEach((n) => {
            if (n.id === destinationNodeId) {
              n.data = {
                ...n.data,
                enabled,
              };
            }
          });
        }
        const destinationEdgeExists = allEdges.some(
          (e) => e.id === `policy-group-${policy.id}-${destination.id}`,
        );
        if (!destinationEdgeExists) {
          allEdges.push({
            id: `policy-group-${policy.id}-${destination.id}`,
            source: `policy-${policy.id}`,
            target: destinationNodeId,
            type: "in",
            data: { enabled, type: "bezier" },
          });
        }

        if (selectedDestinationGroup == destination.id) {
          const {
            visiblePeers,
            visibleResources,
            hiddenPeerCount,
            hiddenResourceCount,
          } = getExpandedDestinationContent(destination.id || "");

          // add peer nodes
          visiblePeers.forEach((peer) => {
            const peerNodeId = `peer-${peer.id}`;
            const peerNodeExists = allNodes.some((n) => n.id === peerNodeId);
            if (!peerNodeExists) {
              allNodes.push({
                id: peerNodeId,
                type: "expandedGroupPeer",
                data: {
                  peer,
                  enabled,
                },
                position: { x: 0, y: 0 },
              });
            } else {
              allNodes.forEach((n) => {
                if (n.id === peerNodeId) {
                  n.data = {
                    ...n.data,
                    enabled,
                  };
                }
              });
            }

            const peerEdgeExists = allEdges.some(
              (e) => e.id === `group-peer-${destination.id}-${peer.id}`,
            );
            if (!peerEdgeExists) {
              allEdges.push({
                id: `group-peer-${destination.id}-${peer.id}`,
                source: `group-${destination.id}`,
                target: peerNodeId,
                type: "simple",
                data: {
                  enabled,
                },
              });
            } else {
              allEdges.forEach((e) => {
                if (e.id === `group-peer-${destination.id}-${peer.id}`) {
                  e.data = {
                    ...e.data,
                    enabled,
                  };
                }
              });
            }
          });

          // add resource nodes
          visibleResources.forEach((resource) => {
            const resourceNodeId = `resource-${resource.id}`;
            const resourceNodeExists = allNodes.some(
              (n) => n.id === resourceNodeId,
            );
            if (!resourceNodeExists) {
              allNodes.push({
                id: resourceNodeId,
                type: "resourceNode",
                data: {
                  resource,
                  enabled,
                },
                position: { x: 0, y: 0 },
              });
            } else {
              allNodes.forEach((n) => {
                if (n.id === resourceNodeId) {
                  n.data = {
                    ...n.data,
                    enabled,
                  };
                }
              });
            }

            const resourceEdgeExists = allEdges.some(
              (e) => e.id === `group-resource-${destination.id}-${resource.id}`,
            );
            if (!resourceEdgeExists) {
              allEdges.push({
                id: `group-resource-${destination.id}-${resource.id}`,
                source: `group-${destination.id}`,
                target: resourceNodeId,
                type: "simple",
                data: {
                  enabled,
                },
              });
            } else {
              allEdges.forEach((e) => {
                if (
                  e.id === `group-resource-${destination.id}-${resource.id}`
                ) {
                  e.data = {
                    ...e.data,
                    enabled,
                  };
                }
              });
            }
          });

          const summaryNode = createDestinationSummaryNode(
            destination.id || "",
            hiddenPeerCount,
            hiddenResourceCount,
            { x: 0, y: 0 },
            enabled,
          );
          if (summaryNode) {
            const existingSummaryNode = allNodes.find(
              (node) => node.id === summaryNode.id,
            );
            if (!existingSummaryNode) {
              allNodes.push(summaryNode);
            } else {
              existingSummaryNode.data = summaryNode.data;
            }

            const summaryEdgeId = `group-summary-${destination.id}`;
            const summaryEdgeExists = allEdges.some(
              (edge) => edge.id === summaryEdgeId,
            );
            if (!summaryEdgeExists) {
              allEdges.push(
                createDestinationSummaryEdge(destination.id || "", enabled),
              );
            } else {
              allEdges.forEach((edge) => {
                if (edge.id === summaryEdgeId) {
                  edge.data = {
                    ...edge.data,
                    enabled,
                  };
                }
              });
            }
          }
        }
      });

      // Add destination resource nodes
      addDestinationResourceNodes(policy, allNodes, allEdges);
    });

    return applyD3HierarchicalLayout(allNodes, allEdges, 400, 120, "peer", {
      policy: { width: 500, spacing: 60 },
      destinationGroup: { width: 1000, spacing: 100 },
      peersAndResources: { width: 1400, spacing: 80 },
    });
  };

  const addDestinationResourceNodes = (
    policy: Policy,
    nodes: Node[],
    edges: Edge[],
  ) => {
    const destinationPolicyResource = policy?.rules?.[0].destinationResource;
    const enabled = policy.enabled;

    if (destinationPolicyResource) {
      const type = destinationPolicyResource.type;
      const peer = peers?.find((p) => p.id === destinationPolicyResource.id);
      const resource = networkResources?.find(
        (r) => r.id === destinationPolicyResource.id,
      );
      const nodeId = `destination-resource-${destinationPolicyResource.id}`;
      const nodeExists = nodes.some((n) => n.id === nodeId);
      if (!nodeExists) {
        if (type === "peer" && peer) {
          nodes.push({
            id: nodeId,
            type: "destinationResourceNode",
            data: {
              peer: peer,
              enabled,
              className: "pl-3",
            },
            position: { x: 0, y: 0 },
          });
        } else if (resource) {
          nodes.push({
            id: nodeId,
            type: "destinationResourceNode",
            data: {
              resource: resource,
              enabled,
              className: "pl-3",
            },
            position: { x: 0, y: 0 },
          });
        }
      } else {
        nodes.forEach((n) => {
          if (n.id === nodeId) {
            n.data = {
              ...n.data,
              enabled,
            };
          }
        });
      }

      const edgeExists = edges.some(
        (e) => e.id === `policy-dest-resource-${policy.id}-${nodeId}`,
      );
      if (!edgeExists) {
        edges.push({
          id: `policy-dest-resource-${policy.id}-${nodeId}`,
          source: `policy-${policy.id}`,
          target: nodeId,
          type: "in",
          data: { enabled, type: "bezier" },
        });
      }
    }
  };

  const applyUserView = (userId: string) => {
    if (!policies || isLoading) return;
    if (!groups || isGroupsLoading) return;
    if (!networks || isNetworksLoading) return;
    if (!networkResources || isResourcesLoading) return;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    // Get all peers for this user
    const userPeers = peers?.filter((p) => p.user_id === userId) || [];
    if (userPeers.length === 0) {
      return applyD3HierarchicalLayout([], [], 400, 120, "user", {
        policy: { width: 500, spacing: 60 },
        destinationGroup: { width: 1000, spacing: 100 },
        peersAndResources: { width: 1400, spacing: 80 },
      });
    }

    // Add peer nodes
    userPeers.forEach((peer, index) => {
      allNodes.push({
        id: `source-peer-${peer.id}`,
        type: "sourcePeerNode",
        data: {
          peer,
          enabled: true,
          onClick: () => {
            setPreviousSelectedUser(userId);
            forceSinglePeerView(peer.id || "", userId);
          },
        },
        position: { x: 0, y: 0 },
      });
    });

    const allUserGroups = [
      ...new Set(userPeers.flatMap((p) => p.groups?.map((g) => g.id) || [])),
    ];
    const userPolicies = sortBy(
      policies?.filter((p) => {
        const rule = p.rules?.[0];
        if (!rule) return false;
        const sources = rule.sources as Group[];
        return sources?.some((d) => allUserGroups.includes(d.id));
      }),
      "enabled",
      "desc",
    );

    // Add policies and their connections
    userPolicies?.forEach((policy, policyIndex) => {
      const enabled = policy.enabled;
      const policyNodeId = `policy-${policy.id}`;

      allNodes.push({
        id: policyNodeId,
        type: "policyNode",
        data: { policy },
        position: { x: 600, y: policyIndex * 120 },
      });

      // Add peer to policy edges
      const rule = policy.rules?.[0];
      const sourcesIds = (rule?.sources as Group[])?.map((g) => g.id) || [];

      userPeers.forEach((peer) => {
        const peerGroupIds = peer.groups?.map((g) => g.id) || [];
        const hasSharedGroup = sourcesIds.some((sourceId) =>
          peerGroupIds.includes(sourceId),
        );

        if (hasSharedGroup) {
          allEdges.push({
            id: `peer-policy-${peer.id}-${policy.id}`,
            source: `source-peer-${peer.id}`,
            target: policyNodeId,
            type: "in",
            data: { enabled, type: "bezier" },
          });
        }
      });

      // Add destination groups
      const destinations = (rule?.destinations as Group[]) || [];
      destinations.forEach((destination, destIndex) => {
        const destinationNodeId = `group-${destination.id}`;
        const destinationNodeExists = allNodes.some(
          (n) => n.id === destinationNodeId,
        );

        if (!destinationNodeExists) {
          allNodes.push({
            id: destinationNodeId,
            type: "destinationGroupNode",
            data: {
              group: destination,
            },
            position: { x: 900, y: policyIndex * 120 + destIndex * 60 },
          });
        }

        const destinationEdgeExists = allEdges.some(
          (e) => e.id === `policy-group-${policy.id}-${destination.id}`,
        );
        if (!destinationEdgeExists) {
          allEdges.push({
            id: `policy-group-${policy.id}-${destination.id}`,
            source: policyNodeId,
            target: destinationNodeId,
            type: "in",
            data: { enabled, type: "bezier" },
          });
        }

        // Add expanded destination group content if selected
        if (selectedDestinationGroup === destination.id) {
          const {
            visiblePeers,
            visibleResources,
            hiddenPeerCount,
            hiddenResourceCount,
          } = getExpandedDestinationContent(destination.id || "");

          // Add peer nodes
          visiblePeers.forEach((peer, peerIndex) => {
            const peerNodeId = `dest-peer-${peer.id}`;
            const peerNodeExists = allNodes.some((n) => n.id === peerNodeId);
            if (!peerNodeExists) {
              allNodes.push({
                id: peerNodeId,
                type: "peerNode",
                data: { peer },
                position: { x: 1200, y: policyIndex * 120 + peerIndex * 80 },
              });
            }

            const peerEdgeExists = allEdges.some(
              (e) => e.id === `group-peer-${destination.id}-${peer.id}`,
            );
            if (!peerEdgeExists) {
              allEdges.push({
                id: `group-peer-${destination.id}-${peer.id}`,
                source: destinationNodeId,
                target: peerNodeId,
                type: "simple",
                data: { enabled },
              });
            }
          });

          // Add resource nodes
          visibleResources.forEach((resource, resourceIndex) => {
            const resourceNodeId = `resource-${resource.id}`;
            const resourceNodeExists = allNodes.some(
              (n) => n.id === resourceNodeId,
            );
            if (!resourceNodeExists) {
              allNodes.push({
                id: resourceNodeId,
                type: "resourceNode",
                data: { resource },
                position: {
                  x: 1200,
                  y:
                    policyIndex * 120 +
                    visiblePeers.length * 80 +
                    resourceIndex * 80,
                },
              });
            }

            const resourceEdgeExists = allEdges.some(
              (e) => e.id === `group-resource-${destination.id}-${resource.id}`,
            );
            if (!resourceEdgeExists) {
              allEdges.push({
                id: `group-resource-${destination.id}-${resource.id}`,
                source: destinationNodeId,
                target: resourceNodeId,
                type: "simple",
                data: { enabled },
              });
            }
          });

          const summaryNode = createDestinationSummaryNode(
            destination.id || "",
            hiddenPeerCount,
            hiddenResourceCount,
            {
              x: 1200,
              y:
                policyIndex * 120 +
                (visiblePeers.length + visibleResources.length) * 80,
            },
            enabled,
          );
          if (summaryNode) {
            const summaryNodeExists = allNodes.some(
              (node) => node.id === summaryNode.id,
            );
            if (!summaryNodeExists) {
              allNodes.push(summaryNode);
            }

            const summaryEdgeId = `group-summary-${destination.id}`;
            const summaryEdgeExists = allEdges.some(
              (edge) => edge.id === summaryEdgeId,
            );
            if (!summaryEdgeExists) {
              allEdges.push(
                createDestinationSummaryEdge(destination.id || "", enabled),
              );
            }
          }
        }
      });

      // Add destination resource nodes
      addDestinationResourceNodes(policy, allNodes, allEdges);
    });

    return applyD3HierarchicalLayout(allNodes, allEdges, 400, 120, "user", {
      policy: { width: 500, spacing: 60 },
      destinationGroup: { width: 1000, spacing: 100 },
      peersAndResources: { width: 1400, spacing: 80 },
    });
  };

  const fitView = (newNodes?: Node[]) => {
    window.requestAnimationFrame(() =>
      reactFlow.fitView({
        nodes: newNodes ?? nodes,
        padding: 0.1,
        duration: 750,
        maxZoom: 0.8,
        minZoom: DEFAULT_MIN_ZOOM,
      }),
    );
  };

  const handleGroupChange = (id: string) => {
    if (selectedGroup !== id) setSelectedGroup(id);
    setDetailsCollapsed(false);
    setInspectedTarget({ kind: "group", groupId: id, role: "source" });
    const result = applySingleGroupView(id);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  const handlePeerChange = (newPeerId: string) => {
    if (selectedPeer !== newPeerId) setSelectedPeer(newPeerId);
    setDetailsCollapsed(false);
    setInspectedTarget({ kind: "peer", peerId: newPeerId });
    const result = applyPeerView(newPeerId);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  const handleUserChange = (newUserId: string) => {
    if (selectedUser !== newUserId) setSelectedUser(newUserId);
    setDetailsCollapsed(false);
    setInspectedTarget({ kind: "user", userId: newUserId });
    const result = applyUserView(newUserId);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  const forceSingleGroupView = (groupId: string) => {
    setSelectedGroup(groupId);
    setSelectedNetwork("");
    setCurrentView(FlowView.GROUPS);
    const result = applySingleGroupView(groupId);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  const forceSingleUserView = (userId: string) => {
    setSelectedPeer("");
    setSelectedUser(userId);
    setPreviousSelectedUser("");
    setCurrentView(FlowView.USERS);

    const result = applyUserView(userId);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  const forceSinglePeerView = (peerId: string, userId?: string) => {
    setSelectedPeer(peerId);
    setSelectedNetwork("");
    setSelectedUser("");
    setPreviousSelectedUser(userId ?? "");
    setCurrentView(FlowView.PEERS);
    const result = applyPeerView(peerId);
    if (result) {
      setEdges(result.updatedEdges);
      setNodes(result.updatedNodes);
      setLayoutInitialized(true);
      fitView(result.updatedNodes);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (layoutInitialized) return;

    switch (currentView) {
      case FlowView.PEERS:
        if (!peers || peers.length === 0) {
          setEdges([]);
          setNodes([]);
          setLayoutInitialized(true);
          fitView([]);
          return;
        }

        if (selectedPeer === "") {
          const userPeer = peers?.find((p) => p.user_id === loggedInUser?.id);
          const firstPeer = userPeer ?? peers?.[0];
          const initialPeerId = firstPeer?.id ?? "";
          if (initialPeerId !== "") handlePeerChange(initialPeerId);
        } else {
          resetView();
          handlePeerChange(selectedPeer);
        }

        break;
      case FlowView.USERS:
        if (!users || users.length === 0) {
          setEdges([]);
          setNodes([]);
          setLayoutInitialized(true);
          fitView([]);
          return;
        }

        if (selectedUser === "") {
          let initialUser = users?.find((u) => u.id === loggedInUser?.id);

          if (
            !initialUser ||
            !peers?.some((p) => p.user_id === initialUser?.id)
          ) {
            initialUser = users?.find(
              (u) => peers?.some((p) => p.user_id === u.id),
            );
          }

          if (!initialUser) {
            initialUser = users?.[0];
          }

          const initialUserId = initialUser?.id ?? "";
          if (initialUserId !== "") handleUserChange(initialUserId);
        } else {
          resetView();
          handleUserChange(selectedUser);
        }

        break;
      case FlowView.GROUPS:
        if (selectedGroup === "") {
          const firstGroup = getFirstGroup(groups, policies);
          const initialGroupId = firstGroup?.id ?? "";
          if (initialGroupId !== "") {
            handleGroupChange(initialGroupId);
          }
        } else {
          resetView();
          handleGroupChange(selectedGroup);
        }
        break;
      case FlowView.NETWORKS:
        if (!networks || networks.length === 0) {
          setEdges([]);
          setNodes([]);
          setLayoutInitialized(true);
          fitView([]);
          return;
        }
        let result;
        if (selectedNetwork) {
          result = applySingleNetworkView(selectedNetwork);
        } else {
          result = applyNetworksView();
        }
        if (result) {
          setEdges(result.updatedEdges);
          setNodes(result.updatedNodes);
          setLayoutInitialized(true);
          fitView(result.updatedNodes);
        }
        break;
      default:
        break;
    }
  }, [
    currentView,
    selectedNetwork,
    selectedPeer,
    selectedGroup,
    selectedUser,
    isLoading,
    layoutInitialized,
  ]);

  const resetView = () => {
    setLayoutInitialized(false);
  };

  const onNetworkSelect = useCallback((networkId: string) => {
    resetView();
    setDetailsCollapsed(false);
    setCurrentView(FlowView.NETWORKS);
    setSelectedNetwork(networkId);
    setInspectedTarget(
      networkId
        ? { kind: "network", networkId }
        : { kind: "summary", view: FlowView.NETWORKS },
    );
  }, []);

  const onGroupSelect = useCallback((groupId: string) => {
    resetView();
    setDetailsCollapsed(false);
    setCurrentView(FlowView.GROUPS);
    setSelectedGroup(groupId);
    setInspectedTarget({ kind: "group", groupId, role: "source" });
  }, []);

  const onViewChange = (view: FlowView) => {
    resetView();
    setDetailsCollapsed(false);
    setSelectedDestinationGroup("");
    setSelectedPeer("");
    setSelectedGroup("");
    setSelectedNetwork("");
    setSelectedUser("");
    setPreviousSelectedUser("");
    setCurrentView(view);
    setInspectedTarget({ kind: "summary", view });

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("tab");
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
  };

  const currentNetwork = useMemo(() => {
    return networks?.find((n) => n.id === selectedNetwork);
  }, [networks, selectedNetwork]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, _node: Node) => {
      const nodeData = (_node.data || {}) as {
        peer?: Peer;
        group?: Group;
        network?: Network;
        policy?: Policy;
        resource?: NetworkResource;
      };
      const isNetworkNode = _node.type === "networkNode";
      const isSourceGroupNode = _node.type === "sourceGroupNode";
      const isGroupNode = _node.type === "groupNode" || isSourceGroupNode;
      const isDestinationNode = _node.type === "destinationGroupNode";
      const isPolicyNode = _node.type === "policyNode";
      const isPeerNode =
        _node.type === "peerNode" ||
        _node.type === "sourcePeerNode" ||
        _node.type === "expandedGroupPeer";
      const isResourceNode =
        _node.type === "resourceNode" || _node.type === "destinationResourceNode";

      const networkId = isNetworkNode ? nodeData.network?.id || "" : "";
      const groupId = isGroupNode ? nodeData.group?.id || "" : "";
      const destinationGroupId = isDestinationNode
        ? nodeData.group?.id || ""
        : "";
      const policyId = isPolicyNode ? nodeData.policy?.id || "" : "";
      const peerId = isPeerNode ? nodeData.peer?.id || "" : "";
      const resourceId = isResourceNode ? nodeData.resource?.id || "" : "";

      if (peerId) {
        setDetailsCollapsed(false);
        setInspectedTarget({ kind: "peer", peerId });
      }
      if (resourceId) {
        setDetailsCollapsed(false);
        setInspectedTarget({ kind: "resource", resourceId });
      }
      if (groupId) {
        setDetailsCollapsed(false);
        setInspectedTarget({
          kind: "group",
          groupId,
          role: isDestinationNode ? "destination" : "source",
        });
      }
      if (networkId) {
        setDetailsCollapsed(false);
        setInspectedTarget({ kind: "network", networkId });
      }
      if (policyId) {
        setDetailsCollapsed(false);
        setInspectedTarget({ kind: "policy", policyId });
      }

      if (networkId && currentView === FlowView.NETWORKS) {
        onNetworkSelect(networkId);
      }
      if (
        currentView === FlowView.PEERS ||
        currentView === FlowView.GROUPS ||
        currentView === FlowView.USERS
      ) {
        groupId && onGroupSelect(groupId);
        destinationGroupId && onDestinationGroupSelect(destinationGroupId);
      }
      if (policyId) {
        setSelectedPolicy(policyId);
        setPolicyModalOpen(true);
      }
    },
    [onNetworkSelect, onGroupSelect, onDestinationGroupSelect, currentView],
  );

  const currentPolicy = useMemo(() => {
    return policies?.find((p) => p.id === selectedPolicy);
  }, [policies, selectedPolicy]);

  const detailTarget = useMemo<ControlCenterInspectTarget>(() => {
    if (inspectedTarget) return inspectedTarget;
    if (currentView === FlowView.PEERS && selectedPeer) {
      return { kind: "peer", peerId: selectedPeer };
    }
    if (currentView === FlowView.USERS && selectedUser) {
      return { kind: "user", userId: selectedUser };
    }
    if (currentView === FlowView.GROUPS && selectedGroup) {
      return { kind: "group", groupId: selectedGroup, role: "source" };
    }
    if (currentView === FlowView.NETWORKS && selectedNetwork) {
      return { kind: "network", networkId: selectedNetwork };
    }
    return { kind: "summary", view: currentView };
  }, [
    currentView,
    inspectedTarget,
    selectedGroup,
    selectedNetwork,
    selectedPeer,
    selectedUser,
  ]);

  const handlePolicyChange = () => {
    setTimeout(() => {
      setLayoutInitialized(false);
      setSelectedPolicy("");
      setPolicyModalOpen(false);
    }, 500);
  };

  const { permission } = usePermissions();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme !== "light";
  const selectorClassName =
    "!bg-white !text-neutral-700 hover:!bg-neutral-50 dark:!bg-nb-gray-920 dark:!text-nb-gray-300 dark:hover:!bg-nb-gray-925";

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 200 });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 200 });
  }, [reactFlow]);

  const handleResetViewport = useCallback(() => {
    reactFlow.fitView({
      nodes,
      padding: 0.1,
      duration: 750,
      maxZoom: 0.8,
      minZoom: DEFAULT_MIN_ZOOM,
    });
  }, [nodes, reactFlow]);

  return (
    <PageContainer className="overflow-hidden">
      {currentPolicy && (
        <AccessControlUpdateModal
          policy={currentPolicy}
          open={policyModalOpen}
          onSuccess={handlePolicyChange}
          onOpenChange={setPolicyModalOpen}
        />
      )}
      <div
        style={{ width: "100%", height: "100%" }}
        className={"relative overflow-hidden"}
      >
        {currentView === FlowView.PEERS &&
          !isPeersLoading &&
          peers?.length === 0 && (
            <div className={"absolute left-0 top-0 w-full mt-20"}>
              <NoPeersGettingStarted showBackground={false} />
            </div>
          )}

        {currentView === FlowView.NETWORKS &&
          !isNetworksLoading &&
          networks?.length === 0 && (
            <div className={"absolute left-0 top-0 w-full mt-20"}>
              <GetStartedTest
                showBackground={false}
                icon={
                  <SquareIcon
                    icon={
                      <NetworkRoutesIcon
                        className={"fill-nb-gray-200"}
                        size={20}
                      />
                    }
                    color={"gray"}
                    size={"large"}
                  />
                }
                title={t("controlCenter.emptyNetworkTitle")}
                description={t("controlCenter.emptyNetworkDescription")}
                button={
                  <div className={"gap-x-4 flex items-center justify-center"}>
                    <Button
                      variant={"primary"}
                      onClick={() => router.push("/networks")}
                      disabled={!permission.networks.create}
                    >
                      {t("controlCenter.goToNetworks")}
                    </Button>
                  </div>
                }
                learnMore={
                  <>
                    {t("common.learnMorePrefix")}
                    <InlineLink
                      href={"https://docs.netbird.io/how-to/networks"}
                      target={"_blank"}
                    >
                      {t("networks.title")}
                      <ExternalLinkIcon size={12} />
                    </InlineLink>
                  </>
                }
              />
            </div>
          )}

        <div className={"absolute left-0 top-0 z-10"}>
          <div className={"flex justify-between px-6 py-4 text-sm w-full"}>
            <div className={"flex flex-wrap items-center gap-3"}>
              {selectedNetwork !== "" && (
                <Button
                  variant={"secondary"}
                  size={"xs"}
                  className={"!bg-white hover:!bg-neutral-50 dark:!bg-nb-gray-930"}
                  onClick={() => onNetworkSelect("")}
                >
                  <ArrowLeftIcon size={14} />
                </Button>
              )}

              {previousSelectedUser !== "" && (
                <>
                  <Button
                    variant={"secondary"}
                    size={"xs"}
                    className={"!bg-white hover:!bg-neutral-50 dark:!bg-nb-gray-930"}
                    onClick={() => {
                      forceSingleUserView(previousSelectedUser);
                    }}
                  >
                    <ArrowLeftIcon size={14} />
                  </Button>
                  <ControlCenterCurrentUserBadge
                    userId={previousSelectedUser}
                  />
                </>
              )}

              <FlowSelector value={currentView} onChange={onViewChange} />

              {currentView === FlowView.PEERS && peerOptions.length > 0 && (
                <div className={"w-72"}>
                  <SelectDropdown
                    variant={"secondary"}
                    value={selectedPeer}
                    onChange={handlePeerChange}
                    options={peerOptions}
                    showSearch={true}
                    searchPlaceholder={
                      peerFilterUserId
                        ? t("controlCenter.searchPeersOfUser")
                        : t("groupPeers.searchPlaceholder")
                    }
                    className={selectorClassName}
                    size={"xs"}
                    truncate
                  />
                </div>
              )}

              {currentView === FlowView.USERS && userOptions.length > 0 && (
                <div className={"w-72"}>
                  <SelectDropdown
                    variant={"secondary"}
                    value={selectedUser}
                    onChange={handleUserChange}
                    options={userOptions}
                    showSearch={true}
                    searchPlaceholder={t("users.searchByEmailOrName")}
                    className={selectorClassName}
                    size={"xs"}
                    truncate
                  />
                </div>
              )}

              {currentView === FlowView.GROUPS && groupOptions.length > 0 && (
                <div className={"w-72"}>
                  <SelectDropdown
                    variant={"secondary"}
                    value={selectedGroup}
                    onChange={handleGroupChange}
                    options={groupOptions}
                    showSearch={true}
                    searchPlaceholder={t("groups.searchPlaceholder")}
                    className={selectorClassName}
                    size={"xs"}
                    truncate
                  />
                </div>
              )}

              {currentView === FlowView.NETWORKS && (
                <div className={"w-64"}>
                  <SelectDropdown
                    variant={"secondary"}
                    value={selectedNetwork}
                    onChange={onNetworkSelect}
                    options={networkOptions}
                    showSearch={true}
                    className={selectorClassName}
                    size={"xs"}
                  />
                </div>
              )}

              {selectedNetwork && currentNetwork && (
                <NetworkRoutingPeerCount network={currentNetwork} />
              )}

              <div className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white/95 p-1 shadow-sm backdrop-blur-sm dark:border-nb-gray-800 dark:bg-nb-gray-930/95">
                <Button
                  variant={"secondary"}
                  size={"xs"}
                  className={"!px-2.5 !py-2 !bg-transparent"}
                  onClick={handleZoomOut}
                  title={t("controlCenter.zoomOut")}
                  aria-label={t("controlCenter.zoomOut")}
                >
                  <MinusIcon size={14} />
                </Button>
                <div className="min-w-[3.5rem] px-2 text-center text-xs font-medium text-neutral-600 dark:text-nb-gray-300">
                  {Math.round(zoom * 100)}%
                </div>
                <Button
                  variant={"secondary"}
                  size={"xs"}
                  className={"!px-2.5 !py-2 !bg-transparent"}
                  onClick={handleZoomIn}
                  title={t("controlCenter.zoomIn")}
                  aria-label={t("controlCenter.zoomIn")}
                >
                  <PlusIcon size={14} />
                </Button>
                <Button
                  variant={"secondary"}
                  size={"xs"}
                  className={"!px-2.5 !py-2 !bg-transparent"}
                  onClick={handleResetViewport}
                  title={t("controlCenter.resetViewport")}
                  aria-label={t("controlCenter.resetViewport")}
                >
                  <LocateFixedIcon size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ControlCenterDetailsPanel
          currentView={currentView}
          target={detailTarget}
          collapsed={detailsCollapsed}
          onToggleCollapsed={() => setDetailsCollapsed((value) => !value)}
          peers={peers || []}
          groups={groups || []}
          users={users || []}
          networks={networks || []}
          policies={policies || []}
          resources={networkResources || []}
          nodes={nodes}
          edges={edges}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          onOpenPolicy={(policyId) => {
            setSelectedPolicy(policyId);
            setPolicyModalOpen(true);
            setInspectedTarget({ kind: "policy", policyId });
          }}
        />

        <PeersProvider>
          <ReactFlow
            edges={edges}
            nodes={nodes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            proOptions={{
              hideAttribution: true,
            }}
            onNodeClick={onNodeClick}
            onEdgeClick={(_event, edge) => {
              setInspectedTarget({ kind: "connection", edgeId: edge.id });
              setDetailsCollapsed(false);
            }}
            onPaneClick={() => {
              setInspectedTarget({ kind: "summary", view: currentView });
            }}
            nodeTypes={NODE_TYPES as unknown as NodeTypes} // TODO fix type
            edgeTypes={EDGE_TYPES as unknown as EdgeTypes} // TODO fix type
            fitView={false}
            maxZoom={DEFAULT_MAX_ZOOM}
            minZoom={DEFAULT_MIN_ZOOM}
            colorMode={isDarkTheme ? "dark" : "light"}
          >
            <Background
              bgColor={isDarkTheme ? "#181a1d" : "#ffffff"}
              gap={20}
              color={isDarkTheme ? "#717171" : "#d4d4d4"}
            />
          </ReactFlow>
        </PeersProvider>
      </div>
    </PageContainer>
  );
}
