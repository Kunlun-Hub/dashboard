"use client";

import Badge from "@components/Badge";
import Button from "@components/Button";
import Card from "@components/Card";
import HelpText from "@components/HelpText";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@components/HoverCard";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { ScrollArea } from "@components/ScrollArea";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { Textarea } from "@components/Textarea";
import { ToggleSwitch } from "@components/ToggleSwitch";
import GroupBadge from "@components/ui/GroupBadge";
import ResourceBadge from "@components/ui/ResourceBadge";
import useFetchApi, { useApiCall } from "@utils/api";
import cidr from "ip-cidr";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RouteIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { Network, NetworkResource, NetworkRouter } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { Policy, PolicyRule, PolicyRuleResource } from "@/interfaces/Policy";

type Props = {
  peer: Peer;
};

type RouteKind = "advertised" | "excluded" | "preview";

export function PeerAdvertisedRoutesSection({ peer }: Readonly<Props>) {
  return <PeerRouteSettingsSection peer={peer} />;
}

export function PeerRoutePreviewSection({ peer }: Readonly<Props>) {
  return <PeerRoutePoliciesSection peer={peer} />;
}

function PeerRouteSettingsSection({ peer }: Readonly<Props>) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { data: routers, isLoading } =
    useFetchApi<NetworkRouter[]>("/networks/routers");
  const [advertisedOpen, setAdvertisedOpen] = useState(true);
  const [excludedOpen, setExcludedOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const peerRouters = useMemo(
    () => (routers ?? []).filter((router) => router.peer === peer.id),
    [peer.id, routers],
  );
  const advertisedRoutes = useMemo(
    () =>
      uniqueRoutes(
        peerRouters.flatMap((router) => router.advertised_routes ?? []),
      ),
    [peerRouters],
  );
  const excludedRoutes = useMemo(
    () =>
      uniqueRoutes(
        peerRouters.flatMap((router) => router.excluded_routes ?? []),
      ),
    [peerRouters],
  );

  if (isLoading) {
    return (
      <div className={"px-8 pb-10"}>
        <SkeletonTable withHeader={false} />
      </div>
    );
  }

  return (
    <div className={"px-8 pb-10"}>
      <div className={"flex items-start justify-between gap-4"}>
        <div className={"max-w-6xl"}>
          <Paragraph>{t("peerAdvertisedRoutes.description")}</Paragraph>
        </div>
        <Button
          variant={"primary"}
          onClick={() => setModalOpen(true)}
          disabled={!permission.networks.update || peerRouters.length === 0}
        >
          <RouteIcon size={15} />
          {t("peerRouteSettings.setRoutes")}
        </Button>
      </div>

      {peerRouters.length === 0 ? (
        <Card className={"mt-5 w-full p-5"}>
          <EmptyRoutesCard
            title={t("peerAdvertisedRoutes.emptyTitle")}
            description={t("peerAdvertisedRoutes.emptyDescription")}
          />
        </Card>
      ) : (
        <div className={"mt-5 flex flex-col gap-4"}>
          <CollapsibleRouteCard
            title={t("networkRoutingPeers.advertisedRoutes")}
            open={advertisedOpen}
            onOpenChange={setAdvertisedOpen}
          >
            <RouteGrid
              routes={advertisedRoutes}
              emptyLabel={t("peerRouteSettings.noAdvertisedRoutes")}
            />
          </CollapsibleRouteCard>
          <CollapsibleRouteCard
            title={t("networkRoutingPeers.excludedRoutes")}
            open={excludedOpen}
            onOpenChange={setExcludedOpen}
          >
            <RouteGrid
              routes={excludedRoutes}
              emptyLabel={t("peerRouteSettings.noExcludedRoutes")}
            />
          </CollapsibleRouteCard>
        </div>
      )}

      <RouteSettingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        routers={peerRouters}
        advertisedRoutes={advertisedRoutes}
        excludedRoutes={excludedRoutes}
        initialTab={"advertised"}
      />
    </div>
  );
}

function PeerRoutePoliciesSection({ peer }: Readonly<Props>) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const updatePolicy = useApiCall<Policy>("/policies").put;
  const updateResource = useApiCall<NetworkResource>("/networks").put;
  const { data: routers, isLoading: isRoutersLoading } =
    useFetchApi<NetworkRouter[]>("/networks/routers");
  const { data: networks, isLoading: isNetworksLoading } =
    useFetchApi<Network[]>("/networks");
  const { data: resources, isLoading: isResourcesLoading } = useFetchApi<
    NetworkResource[]
  >("/networks/resources");
  const { data: peers, isLoading: isPeersLoading } = useFetchApi<Peer[]>(
    "/peers",
    true,
    true,
    permission.peers.read,
  );
  const { data: policies, isLoading: isPoliciesLoading } = useFetchApi<
    Policy[]
  >("/policies", true, true, permission.policies.read);

  const peerRouters = useMemo(
    () => (routers ?? []).filter((router) => router.peer === peer.id),
    [peer.id, routers],
  );

  const referencedNetworks = useMemo(() => {
    const routerIds = new Set(peerRouters.map((router) => router.id));
    const networkIds = new Set(peerRouters.map((router) => router.network_id));
    return (networks ?? []).filter(
      (network) =>
        networkIds.has(network.id) ||
        (network.routers ?? []).some((routerId) => routerIds.has(routerId)),
    );
  }, [networks, peerRouters]);

  const referencedPolicies = useMemo(() => {
    const policyIds = new Set(
      referencedNetworks.flatMap((network) => network.policies ?? []),
    );
    return (policies ?? []).filter(
      (policy) => policy.id && policyIds.has(policy.id),
    );
  }, [policies, referencedNetworks]);

  const displayRows = useMemo(() => {
    return buildRoutePolicyRows(
      referencedNetworks,
      resources ?? [],
      referencedPolicies,
    );
  }, [referencedNetworks, referencedPolicies, resources]);

  if (
    isRoutersLoading ||
    isNetworksLoading ||
    isResourcesLoading ||
    isPoliciesLoading ||
    isPeersLoading
  ) {
    return (
      <div className={"px-8 pb-10"}>
        <SkeletonTable withHeader={false} />
      </div>
    );
  }

  const togglePolicy = (policy: Policy, enabled: boolean) => {
    if (!policy.id) return;
    notify({
      title: policy.name,
      description: enabled
        ? t("accessControl.ruleEnabled")
        : t("accessControl.ruleDisabled"),
      loadingMessage: t("peerRoutePreview.updating"),
      promise: updatePolicy(
        {
          ...policy,
          enabled,
          rules: serializePolicyRules(policy.rules, enabled),
          source_posture_checks:
            policy.source_posture_checks
              ?.map((check) => (typeof check === "string" ? check : check.id))
              .filter(Boolean) ?? [],
        },
        `/${policy.id}`,
      ).then(() => mutate("/policies")),
    });
  };

  const toggleResource = (
    network: Network,
    resource: NetworkResource,
    enabled: boolean,
  ) => {
    notify({
      title: resource.name,
      description: t("networkResources.toggleDescription", {
        name: resource.name,
        status: enabled ? t("table.active") : t("common.disabled"),
      }),
      loadingMessage: t("networkResources.updating"),
      duration: 1200,
      promise: updateResource(
        {
          ...resource,
          groups: resolveResourceGroups(resource)
            .map((group) => group.id)
            .filter(Boolean),
          enabled,
        },
        `/${network.id}/resources/${resource.id}`,
      ).then(() => {
        mutate("/networks/resources");
        mutate(`/networks/${network.id}/resources`);
      }),
    });
  };

  return (
    <div className={"px-8 pb-10"}>
      <div className={"max-w-6xl"}>
        <Paragraph>{t("peerRoutePreview.description")}</Paragraph>
      </div>

      <Card className={"mt-5 w-full p-5"}>
        {displayRows.length === 0 ? (
          <EmptyRoutesCard
            title={t("peerRoutePreview.emptyTitle")}
            description={t("peerRoutePreview.emptyDescription")}
          />
        ) : (
          <div className={"overflow-x-auto"}>
            <table className={"w-full min-w-[1040px] text-left text-sm"}>
              <thead className={"border-b border-nb-gray-900 text-nb-gray-400"}>
                <tr>
                  <th className={"w-[260px] px-4 py-3 font-medium"}>
                    {t("peerRoutePreview.accessControl")}
                  </th>
                  <th className={"w-[160px] px-4 py-3 font-medium"}>
                    {t("peerRoutePreview.accessControlStatus")}
                  </th>
                  <th className={"w-[160px] px-4 py-3 font-medium"}>
                    {t("table.resource")}
                  </th>
                  <th className={"px-4 py-3 font-medium"}>
                    {t("table.address")}
                  </th>
                  <th className={"w-[120px] px-4 py-3 font-medium"}>
                    {t("peerRoutePreview.resourceStatus")}
                  </th>
                  <th className={"w-[200px] px-4 py-3 font-medium"}>
                    {t("peerRoutePreview.resourceGroups")}
                  </th>
                  <th className={"w-[200px] px-4 py-3 font-medium"}>
                    {t("table.sources")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr
                    key={`${row.network.id}-${row.policy.id}-${row.resource.id}`}
                    className={
                      "border-b border-nb-gray-900 last:border-b-0 hover:bg-nb-gray-930/60"
                    }
                  >
                    <td className={"px-4 py-3 align-middle"}>
                      <div className={"flex flex-col gap-1"}>
                        <div className={"flex items-center gap-2"}>
                          <span className={"font-medium text-nb-gray-100"}>
                            {row.policy.name}
                          </span>
                        </div>
                        <HelpText>
                          {t("peerRoutePreview.syncedAccessControl")}
                        </HelpText>
                      </div>
                    </td>
                    <td className={"px-4 py-3 align-middle"}>
                      <div className={"flex justify-start pl-1"}>
                        <ToggleSwitch
                          checked={row.policy.enabled}
                          size={"small"}
                          disabled={!permission.policies.update}
                          onClick={() =>
                            togglePolicy(row.policy, !row.policy.enabled)
                          }
                        />
                      </div>
                    </td>
                    <td className={"px-4 py-3 align-middle font-medium"}>
                      {row.resource.name}
                    </td>
                    <td className={"px-4 py-3 align-middle font-mono"}>
                      {row.resource.address}
                    </td>
                    <td className={"px-4 py-3 align-middle"}>
                      <div className={"flex justify-start pl-1"}>
                        <ToggleSwitch
                          checked={row.resource.enabled}
                          size={"small"}
                          disabled={!permission.networks.update}
                          onClick={() =>
                            toggleResource(
                              row.network,
                              row.resource,
                              !row.resource.enabled,
                            )
                          }
                        />
                      </div>
                    </td>
                    <td className={"px-4 py-3 align-middle"}>
                      <GroupList groups={resolveResourceGroups(row.resource)} />
                    </td>
                    <td className={"px-4 py-3 align-middle"}>
                      <SourceList
                        sources={row.sources}
                        peers={peers ?? []}
                        resources={resources ?? []}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function CollapsibleRouteCard({
  title,
  open,
  onOpenChange,
  children,
}: Readonly<{
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}>) {
  return (
    <Card className={"w-full overflow-hidden"}>
      <button
        type={"button"}
        onClick={() => onOpenChange(!open)}
        className={
          "flex w-full items-center gap-2 border-b border-nb-gray-900 bg-nb-gray-930 px-4 py-3 text-left"
        }
      >
        {open ? (
          <ChevronDownIcon size={16} className={"text-nb-gray-400"} />
        ) : (
          <ChevronRightIcon size={16} className={"text-nb-gray-400"} />
        )}
        <Label>{title}</Label>
      </button>

      {open && <div className={"p-5"}>{children}</div>}
    </Card>
  );
}

type RoutePolicyRow = {
  policy: Policy;
  network: Network;
  resource: NetworkResource;
  sources: SourceItem[];
};

type SourceItem =
  | {
      key: string;
      type: "group";
      group: Group;
    }
  | {
      key: string;
      type: "resource";
      resource: PolicyRuleResource;
    };

function buildRoutePolicyRows(
  networks: Network[],
  resources: NetworkResource[],
  policies: Policy[],
): RoutePolicyRow[] {
  const networkIds = new Set(networks.map((network) => network.id));
  const routeResources = networks.flatMap((network) =>
    resources
      .filter((resource) => {
        const resourceNetwork = (
          resource as NetworkResource & { network?: Network }
        ).network;
        return (
          (network.resources ?? []).includes(resource.id) ||
          (resourceNetwork?.id &&
            networkIds.has(resourceNetwork.id) &&
            resourceNetwork.id === network.id)
        );
      })
      .map((resource) => ({ network, resource })),
  );

  return policies.flatMap((policy) =>
    routeResources.flatMap(({ network, resource }) => {
      const matchingRules =
        policy.rules?.filter((rule) =>
          ruleReferencesResource(rule, resource),
        ) ?? [];
      if (matchingRules.length === 0) return [];
      return [
        {
          policy,
          network,
          resource,
          sources: uniqueSourceItems(
            matchingRules.flatMap((rule) => collectRuleSources(rule)),
          ),
        },
      ];
    }),
  );
}

function serializePolicyRules(rules: Policy["rules"], enabled: boolean) {
  return (rules ?? []).map((rule) => ({
    ...rule,
    enabled,
    sources: rule.sourceResource
      ? null
      : (rule.sources ?? []).map((source) =>
          typeof source === "string" ? source : source.id,
        ),
    destinations: rule.destinationResource
      ? null
      : (rule.destinations ?? []).map((destination) =>
          typeof destination === "string" ? destination : destination.id,
        ),
  }));
}

function ruleReferencesResource(rule: PolicyRule, resource: NetworkResource) {
  if (rule.destinationResource?.id === resource.id) return true;

  const resourceGroups = resolveResourceGroups(resource);
  const resourceGroupKeys = new Set(
    resourceGroups.flatMap((group) => [group.id, group.name].filter(Boolean)),
  );

  return (rule.destinations ?? []).some((destination) => {
    const group =
      typeof destination === "string"
        ? ({ id: destination, name: destination } as Group)
        : (destination as Group);
    return resourceGroupKeys.has(group.id) || resourceGroupKeys.has(group.name);
  });
}

function collectRuleSources(rule: PolicyRule): SourceItem[] {
  const groupSources =
    rule.sources?.map((source) => {
      const group =
        typeof source === "string"
          ? ({ id: source, name: source } as Group)
          : (source as Group);
      return {
        key: `group:${group.id || group.name}`,
        type: "group" as const,
        group,
      };
    }) ?? [];

  if (!rule.sourceResource?.id) return groupSources;

  return [
    ...groupSources,
    {
      key: `resource:${rule.sourceResource.type || "resource"}:${
        rule.sourceResource.id
      }`,
      type: "resource" as const,
      resource: rule.sourceResource,
    },
  ];
}

function uniqueSourceItems(items: SourceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

function resolveResourceGroups(resource: NetworkResource) {
  return ((resource.groups ?? []) as Array<Group | string>).map((group) =>
    typeof group === "string" ? ({ id: group, name: group } as Group) : group,
  );
}

function GroupList({ groups }: Readonly<{ groups: Group[] }>) {
  const { t } = useI18n();

  if (groups.length === 0) {
    return <span className={"text-nb-gray-500"}>-</span>;
  }

  return (
    <div className={"flex flex-wrap gap-1.5"}>
      {groups.map((group) => (
        <GroupBadge
          key={group.id || group.name}
          group={group}
          redirectGroupTab={"resources"}
          redirectToGroupPage={!!group.id}
          maxChars={16}
        />
      ))}
      <span className={"sr-only"}>{t("peerRoutePreview.resourceGroups")}</span>
    </div>
  );
}

function SourceList({
  sources,
  peers,
  resources,
}: Readonly<{
  sources: SourceItem[];
  peers: Peer[];
  resources: NetworkResource[];
}>) {
  const { t } = useI18n();

  if (sources.length === 0) {
    return (
      <span className={"text-nb-gray-500"}>
        {t("peerRoutePreview.noSources")}
      </span>
    );
  }

  const firstSource = sources[0];
  const otherSources = sources.slice(1);

  if (otherSources.length === 0) {
    return (
      <SourceBadge source={firstSource} peers={peers} resources={resources} />
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger>
        <div className={"inline-flex items-center gap-2"}>
          <SourceBadge
            source={firstSource}
            peers={peers}
            resources={resources}
          />
          <Badge variant={"gray-ghost"} useHover={true} className={"px-3"}>
            + {otherSources.length}
          </Badge>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className={"w-[360px] p-0"}>
        <ScrollArea className={"max-h-[260px] px-4 py-3"}>
          <div className={"flex flex-wrap gap-2"}>
            {sources.map((source) => (
              <SourceBadge
                key={source.key}
                source={source}
                peers={peers}
                resources={resources}
              />
            ))}
          </div>
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
}

function SourceBadge({
  source,
  peers,
  resources,
}: Readonly<{
  source: SourceItem;
  peers: Peer[];
  resources: NetworkResource[];
}>) {
  if (source.type === "group") {
    return (
      <GroupBadge
        group={source.group}
        redirectToGroupPage={!!source.group.id}
        maxChars={16}
      />
    );
  }

  const peer = peers.find((item) => item.id === source.resource.id);
  const resource =
    resources.find((item) => item.id === source.resource.id) ??
    ({
      id: source.resource.id,
      name: source.resource.id,
      type: source.resource.type,
      enabled: true,
      address: source.resource.id,
    } as NetworkResource);

  return <ResourceBadge resource={resource} peer={peer} />;
}

function RouteSettingsModal({
  open,
  onOpenChange,
  routers,
  advertisedRoutes,
  excludedRoutes,
  initialTab,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routers: NetworkRouter[];
  advertisedRoutes: string[];
  excludedRoutes: string[];
  initialTab: Exclude<RouteKind, "preview">;
}>) {
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const updateRouter = useApiCall<NetworkRouter>("/networks").put;
  const [tab, setTab] = useState<RouteKind>(initialTab);
  const [search, setSearch] = useState("");
  const [bulkEdit, setBulkEdit] = useState(false);
  const [advertisedDraft, setAdvertisedDraft] = useState(advertisedRoutes);
  const [excludedDraft, setExcludedDraft] = useState(excludedRoutes);

  React.useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setSearch("");
    setBulkEdit(false);
    setAdvertisedDraft(advertisedRoutes);
    setExcludedDraft(excludedRoutes);
  }, [advertisedRoutes, excludedRoutes, initialTab, open]);

  const currentRoutes = tab === "excluded" ? excludedDraft : advertisedDraft;
  const currentSetter =
    tab === "excluded" ? setExcludedDraft : setAdvertisedDraft;
  const invalidRoute = currentRoutes.find(
    (route) => !cidr.isValidAddress(route),
  );
  const previewRoutes = useMemo(
    () => calculateRoutes(advertisedDraft, excludedDraft),
    [advertisedDraft, excludedDraft],
  );
  const filteredRoutes = useMemo(() => {
    const routes = tab === "preview" ? previewRoutes : currentRoutes;
    if (!search.trim()) return routes;
    return routes.filter((route) =>
      route.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [currentRoutes, previewRoutes, search, tab]);

  const save = () => {
    const sanitizedAdvertisedRoutes = uniqueRoutes(advertisedDraft);
    const sanitizedExcludedRoutes = uniqueRoutes(excludedDraft);
    notify({
      title: t("peerRouteSettings.title"),
      description: t("peerAdvertisedRoutes.saved"),
      loadingMessage: t("peerAdvertisedRoutes.saving"),
      promise: Promise.all(
        routers.map((router) =>
          updateRouter(
            {
              ...router,
              advertised_routes: sanitizedAdvertisedRoutes,
              excluded_routes: sanitizedExcludedRoutes,
            },
            `/${router.network_id}/routers/${router.id}`,
          ),
        ),
      ).then(() => {
        mutate("/networks/routers");
        routers.forEach((router) =>
          mutate(`/networks/${router.network_id}/routers`),
        );
        onOpenChange(false);
      }),
    });
  };

  const addRoute = () => currentSetter([...currentRoutes, ""]);
  const updateRoute = (index: number, value: string) => {
    currentSetter(
      currentRoutes.map((route, i) => (i === index ? value : route)),
    );
  };
  const removeRoute = (index: number) => {
    currentSetter(currentRoutes.filter((_, i) => i !== index));
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"max-w-3xl"} className={"py-0"}>
        <div className={"border-b border-nb-gray-900 px-6 py-4"}>
          <h2 className={"text-xl font-semibold text-white"}>
            {t("peerRouteSettings.editTitle")}
          </h2>
        </div>
        <div className={"px-6 py-5"}>
          <h3 className={"text-2xl font-semibold text-white"}>
            {t("peerRouteSettings.connector")}
          </h3>
          <Paragraph>{t("peerRouteSettings.connectorModalHelp")}</Paragraph>

          <div className={"mt-5 flex flex-wrap gap-2"}>
            <Button
              variant={"secondary"}
              onClick={addRoute}
              disabled={tab === "preview"}
            >
              <PlusIcon size={15} />
              {t("peerRouteSettings.addRoute")}
            </Button>
            <Button
              variant={"secondary"}
              onClick={() => setBulkEdit((value) => !value)}
              disabled={tab === "preview"}
            >
              <PencilIcon size={15} />
              {t("peerRouteSettings.bulkEdit")}
            </Button>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("peerRouteSettings.searchRoutes")}
              maxWidthClass={"w-[260px]"}
              customSuffix={
                <SearchIcon size={16} className={"text-nb-gray-400"} />
              }
            />
          </div>

          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as RouteKind);
              setBulkEdit(false);
            }}
            className={"mt-4"}
          >
            <TabsList justify={"start"}>
              <TabsTrigger value={"advertised"}>
                {t("networkRoutingPeers.advertisedRoutes")}
              </TabsTrigger>
              <TabsTrigger value={"excluded"}>
                {t("networkRoutingPeers.excludedRoutes")}
              </TabsTrigger>
              <TabsTrigger value={"preview"}>
                {t("peerDetails.routePreview")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={"advertised"} className={"pt-4"}>
              <EditableRouteList
                routes={filteredRoutes}
                sourceRoutes={advertisedDraft}
                bulkEdit={bulkEdit}
                onBulkChange={(value) =>
                  setAdvertisedDraft(parseRouteList(value))
                }
                onChange={updateRoute}
                onRemove={removeRoute}
                emptyLabel={t("peerRouteSettings.noAdvertisedRoutes")}
              />
            </TabsContent>
            <TabsContent value={"excluded"} className={"pt-4"}>
              <EditableRouteList
                routes={filteredRoutes}
                sourceRoutes={excludedDraft}
                bulkEdit={bulkEdit}
                onBulkChange={(value) =>
                  setExcludedDraft(parseRouteList(value))
                }
                onChange={updateRoute}
                onRemove={removeRoute}
                emptyLabel={t("peerRouteSettings.noExcludedRoutes")}
              />
            </TabsContent>
            <TabsContent value={"preview"} className={"pt-4"}>
              <RouteGrid
                routes={filteredRoutes}
                emptyLabel={t("peerRoutePreview.noCalculatedRoutes")}
              />
            </TabsContent>
          </Tabs>

          {invalidRoute && (
            <HelpText className={"mt-3 !text-red-500"}>{invalidRoute}</HelpText>
          )}
        </div>
        <ModalFooter>
          <Button variant={"secondary"} onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant={"primary"}
            onClick={save}
            disabled={
              advertisedDraft.some((route) => !cidr.isValidAddress(route)) ||
              excludedDraft.some((route) => !cidr.isValidAddress(route))
            }
          >
            <SaveIcon size={15} />
            {t("actions.saveChanges")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function EditableRouteList({
  routes,
  sourceRoutes,
  bulkEdit,
  onBulkChange,
  onChange,
  onRemove,
  emptyLabel,
}: Readonly<{
  routes: string[];
  sourceRoutes: string[];
  bulkEdit: boolean;
  onBulkChange: (value: string) => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  emptyLabel: string;
}>) {
  if (bulkEdit) {
    return (
      <Textarea
        value={sourceRoutes.join("\n")}
        onChange={(event) => onBulkChange(event.target.value)}
        rows={12}
        placeholder={"10.202.10.0/24"}
      />
    );
  }

  if (routes.length === 0) {
    return <div className={"py-6 text-sm text-nb-gray-400"}>{emptyLabel}</div>;
  }

  return (
    <div className={"flex flex-col gap-2"}>
      {routes.map((route) => {
        const sourceIndex = sourceRoutes.indexOf(route);
        return (
          <div
            key={`${route}-${sourceIndex}`}
            className={"grid grid-cols-[1fr_auto_auto] gap-3"}
          >
            <Input
              value={route}
              onChange={(event) => onChange(sourceIndex, event.target.value)}
              error={route && !cidr.isValidAddress(route) ? route : undefined}
            />
            <Button variant={"secondary"} className={"!px-3"}>
              <PencilIcon size={14} />
            </Button>
            <Button
              variant={"secondary"}
              className={"!px-3 text-red-500"}
              onClick={() => onRemove(sourceIndex)}
            >
              <MinusIcon size={16} />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function RouteGrid({
  routes,
  emptyLabel,
}: Readonly<{ routes: string[]; emptyLabel: string }>) {
  if (routes.length === 0) {
    return <div className={"py-6 text-sm text-nb-gray-400"}>{emptyLabel}</div>;
  }

  return (
    <div
      className={"grid gap-x-16 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4"}
    >
      {routes.map((route) => (
        <div key={route} className={"font-mono text-nb-gray-200"}>
          {route}
        </div>
      ))}
    </div>
  );
}

function EmptyRoutesCard({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <div className={"mt-5 flex flex-col items-center gap-2 py-8 text-center"}>
      <RouteIcon size={20} className={"text-nb-gray-400"} />
      <Label>{title}</Label>
      <HelpText>{description}</HelpText>
    </div>
  );
}

function uniqueRoutes(routes: string[]) {
  return Array.from(
    new Set(routes.map((route) => route.trim()).filter(Boolean)),
  );
}

function parseRouteList(value: string) {
  return uniqueRoutes(value.split(/[\n,]+/));
}

function calculateRoutes(advertisedRoutes: string[], excludedRoutes: string[]) {
  return advertisedRoutes.flatMap((route) => {
    const base = parseIPv4Prefix(route);
    if (!base) return [route];
    const exclusions = excludedRoutes
      .map(parseIPv4Prefix)
      .filter((excluded): excluded is IPv4Range => !!excluded);
    return subtractIPv4Ranges([base], exclusions).flatMap(rangeToCIDRs);
  });
}

type IPv4Range = {
  start: number;
  end: number;
};

function parseIPv4Prefix(value: string): IPv4Range | undefined {
  const [ip, bitsValue] = value.includes("/")
    ? value.split("/")
    : [value, "32"];
  if (!ip || ip.includes(":")) return undefined;
  const octets = ip.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return undefined;
  }

  const bits = Number(bitsValue);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return undefined;

  const raw = octets.reduce((value, octet) => ((value << 8) + octet) >>> 0, 0);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const start = (raw & mask) >>> 0;
  const size = 2 ** (32 - bits);
  return { start, end: start + size - 1 };
}

function subtractIPv4Ranges(
  ranges: IPv4Range[],
  exclusions: IPv4Range[],
): IPv4Range[] {
  let remaining = ranges;
  for (const exclusion of exclusions) {
    remaining = remaining.flatMap((range) =>
      subtractIPv4Range(range, exclusion),
    );
  }
  return remaining;
}

function subtractIPv4Range(
  range: IPv4Range,
  exclusion: IPv4Range,
): IPv4Range[] {
  if (exclusion.end < range.start || exclusion.start > range.end)
    return [range];
  const result: IPv4Range[] = [];
  if (exclusion.start > range.start) {
    result.push({ start: range.start, end: exclusion.start - 1 });
  }
  if (exclusion.end < range.end) {
    result.push({ start: exclusion.end + 1, end: range.end });
  }
  return result;
}

function rangeToCIDRs(range: IPv4Range): string[] {
  const result: string[] = [];
  let start = range.start;
  while (start <= range.end) {
    const maxSize = largestAlignedBlockSize(start);
    const remaining = range.end - start + 1;
    let blockSize = maxSize;
    while (blockSize > remaining) blockSize /= 2;
    const bits = 32 - Math.log2(blockSize);
    result.push(`${numberToIPv4(start)}/${bits}`);
    start += blockSize;
  }
  return result;
}

function numberToIPv4(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function largestAlignedBlockSize(value: number) {
  if (value === 0) return 2 ** 32;
  let size = 1;
  while (size < 2 ** 32 && value % (size * 2) === 0) {
    size *= 2;
  }
  return size;
}
