import Badge from "@components/Badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@components/HoverCard";
import { ScrollArea } from "@components/ScrollArea";
import GroupBadge from "@components/ui/GroupBadge";
import ResourceBadge from "@components/ui/ResourceBadge";
import { cn } from "@utils/helpers";
import * as React from "react";
import Skeleton from "react-loading-skeleton";
import LongArrowBidirectionalIcon from "@/assets/icons/LongArrowBidirectionalIcon";
import LongArrowLeftIcon from "@/assets/icons/LongArrowLeftIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { NetworkResource } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import { Policy, PolicyRule, PolicyRuleResource } from "@/interfaces/Policy";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";
import { TransparentEditIconButton } from "@components/ui/MultipleGroups";
import useFetchApi from "@utils/api";
import { CheckIcon, XIcon } from "lucide-react";
import { getRuleDirectionKey } from "@/modules/access-control/table/AccessControlDirectionCell";

type Endpoint = "sources" | "destinations";

type EndpointItem =
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

type Props = {
  policy: Policy;
  endpoint: Endpoint;
  hideEdit?: boolean;
  disableRedirect?: boolean;
};

export const collectRuleEndpointItems = (
  policy: Policy,
  endpoint: Endpoint,
): EndpointItem[] => {
  const items: EndpointItem[] = [];
  const seen = new Set<string>();

  policy.rules?.forEach((rule) => {
    const groups = rule[endpoint];
    if (Array.isArray(groups)) {
      groups.forEach((group) => {
        const resolvedGroup =
          typeof group === "string"
            ? ({ id: group, name: group } as Group)
            : (group as Group);
        const key = `group:${resolvedGroup.id || resolvedGroup.name}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ key, type: "group", group: resolvedGroup });
      });
    }

    const resource =
      endpoint === "sources" ? rule.sourceResource : rule.destinationResource;
    if (!resource?.id) return;

    const key = `resource:${resource.type || "resource"}:${resource.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ key, type: "resource", resource });
  });

  return items;
};

const collectSingleRuleEndpointItems = (
  rule: PolicyRule,
  endpoint: Endpoint,
): EndpointItem[] => {
  const items: EndpointItem[] = [];

  const groups = rule[endpoint];
  if (Array.isArray(groups)) {
    groups.forEach((group) => {
      const resolvedGroup =
        typeof group === "string"
          ? ({ id: group, name: group } as Group)
          : (group as Group);
      items.push({
        key: `group:${resolvedGroup.id || resolvedGroup.name}`,
        type: "group",
        group: resolvedGroup,
      });
    });
  }

  const resource =
    endpoint === "sources" ? rule.sourceResource : rule.destinationResource;
  if (resource?.id) {
    items.push({
      key: `resource:${resource.type || "resource"}:${resource.id}`,
      type: "resource",
      resource,
    });
  }

  return items;
};

export default function AccessControlRuleEndpointCell({
  policy,
  endpoint,
  hideEdit = false,
  disableRedirect = false,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const canUpdate = permission?.policies?.update;
  const items = React.useMemo(
    () => collectRuleEndpointItems(policy, endpoint),
    [policy, endpoint],
  );

  if (items.length === 0) return <EmptyRow />;

  const firstItem = items[0];
  const otherItems = items.slice(1);

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        canUpdate && !hideEdit && "group",
      )}
    >
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger>
          <div className="inline-flex items-center gap-2 z-0">
            <EndpointBadge item={firstItem} disableRedirect={disableRedirect} />
            {otherItems.length > 0 && (
              <Badge
                variant="gray-ghost"
                useHover={true}
                className={cn(
                  "px-3 gap-2 whitespace-nowrap",
                  permission.groups.update ? "group-hover:bg-nb-gray-800" : "",
                )}
              >
                + {otherItems.length}
              </Badge>
            )}
          </div>
        </HoverCardTrigger>
        <AccessControlRulesOverviewHoverContent
          policy={policy}
          disableRedirect={disableRedirect}
        />
      </HoverCard>
      {canUpdate && !hideEdit && <TransparentEditIconButton />}
    </div>
  );
}

export const AccessControlRulesOverviewHoverContent = ({
  policy,
  disableRedirect,
}: {
  policy: Policy;
  disableRedirect: boolean;
}) => {
  const { t } = useI18n();

  return (
    <HoverCardContent
      className="p-0 w-[520px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-sm font-medium text-left px-5 pt-3">
        {t("accessControl.ruleOverview")}
      </div>
      <ScrollArea className="max-h-[360px] overflow-y-auto flex flex-col px-5 pt-3">
        <div className="flex flex-col gap-3 mb-2 last:pb-2">
          {policy.rules?.map((rule, index) => (
            <RuleOverview
              key={rule.id || index}
              rule={rule}
              ruleIndex={index}
              disableRedirect={disableRedirect}
            />
          ))}
        </div>
      </ScrollArea>
    </HoverCardContent>
  );
};

const RuleOverview = ({
  rule,
  ruleIndex,
  disableRedirect,
}: {
  rule: PolicyRule;
  ruleIndex: number;
  disableRedirect: boolean;
}) => {
  const { t } = useI18n();
  const sources = collectSingleRuleEndpointItems(rule, "sources");
  const destinations = collectSingleRuleEndpointItems(rule, "destinations");
  const isDrop = rule.action === "drop";

  return (
    <div className="rounded-md border border-nb-gray-800 bg-nb-gray-900/40 px-3 py-2">
      <div className="flex items-center gap-2 text-left mb-2">
        <span className="text-sm font-medium text-nb-gray-100 truncate">
          {rule.name?.trim() ||
            t("accessControl.ruleNumber", { number: ruleIndex + 1 })}
        </span>
        <span
          className={cn("text-xs", isDrop ? "text-red-400" : "text-green-400")}
        >
          {isDrop
            ? t("accessControl.actionDrop")
            : t("accessControl.actionAllow")}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_1fr] items-center gap-3">
        <EndpointBadgeList
          items={sources}
          disableRedirect={disableRedirect}
          emptyLabel={t("table.sources")}
        />
        <RuleDirectionIndicator rule={rule} isDrop={isDrop} />
        <div
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center border",
            isDrop
              ? "border-red-500/50 bg-red-950/40 text-red-400"
              : "border-green-500/50 bg-green-950/40 text-green-400",
          )}
        >
          {isDrop ? <XIcon size={15} /> : <CheckIcon size={15} />}
        </div>
        <EndpointBadgeList
          items={destinations}
          disableRedirect={disableRedirect}
          emptyLabel={t("table.destinations")}
        />
      </div>
    </div>
  );
};

const RuleDirectionIndicator = ({
  rule,
  isDrop,
}: {
  rule: PolicyRule;
  isDrop: boolean;
}) => {
  const isBidirectional = getRuleDirectionKey(rule) === "bidirectional";
  const iconClass = isDrop ? "fill-red-400" : "fill-sky-400";

  return (
    <div
      className={cn(
        "h-7 min-w-16 rounded-md flex items-center justify-center border px-2",
        isDrop
          ? "border-red-500/40 bg-red-950/30"
          : isBidirectional
          ? "border-green-500/40 bg-green-950/30"
          : "border-sky-500/40 bg-sky-950/30",
      )}
    >
      {isBidirectional ? (
        <LongArrowBidirectionalIcon
          size={48}
          autoHeight={true}
          className={isDrop ? "fill-red-400" : "fill-green-400"}
        />
      ) : (
        <LongArrowLeftIcon
          size={48}
          autoHeight={true}
          className={cn(iconClass, "rotate-180")}
        />
      )}
    </div>
  );
};

const EndpointBadgeList = ({
  items,
  disableRedirect,
  emptyLabel,
}: {
  items: EndpointItem[];
  disableRedirect: boolean;
  emptyLabel: string;
}) => {
  if (items.length === 0) {
    return <span className="text-xs text-nb-gray-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-w-0">
      {items.map((item) => (
        <EndpointBadge
          key={item.key}
          item={item}
          disableRedirect={disableRedirect}
        />
      ))}
    </div>
  );
};

const EndpointBadge = ({
  item,
  disableRedirect,
}: {
  item: EndpointItem;
  disableRedirect: boolean;
}) => {
  const { data: resources, isLoading: isLoadingResources } = useFetchApi<
    NetworkResource[]
  >("/networks/resources");
  const { data: peers, isLoading: isLoadingPeers } =
    useFetchApi<Peer[]>("/peers");

  if (item.type === "group") {
    return (
      <GroupBadge
        group={item.group}
        showNewBadge={true}
        redirectToGroupPage={!disableRedirect}
      />
    );
  }

  const isPeer = item.resource.type === "peer";
  const peer = peers?.find((p) => p.id === item.resource.id);
  const resource =
    resources?.find((r) => r.id === item.resource.id) ??
    ({
      id: item.resource.id,
      name: item.resource.id,
      type: item.resource.type,
    } as NetworkResource);

  if ((isPeer && isLoadingPeers) || (!isPeer && isLoadingResources)) {
    return <Skeleton height={35} width={72} />;
  }

  return <ResourceBadge resource={resource} peer={peer} />;
};
