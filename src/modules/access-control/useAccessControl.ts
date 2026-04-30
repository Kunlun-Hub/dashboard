import { notify } from "@components/Notification";
import { Direction } from "@components/ui/PolicyDirection";
import useFetchApi, { useApiCall } from "@utils/api";
import { merge, orderBy, uniqBy, isEmpty } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { usePolicies } from "@/contexts/PoliciesProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { Group } from "@/interfaces/Group";
import {
  AuthorizedGroups,
  Policy,
  PolicyRule,
  PolicyRuleResource,
  PortRange,
  Protocol,
} from "@/interfaces/Policy";
import { PostureCheck } from "@/interfaces/PostureCheck";
import { usePostureCheck } from "@/modules/posture-checks/usePostureCheck";

export type RuleState = {
  id?: string;
  name?: string;
  description?: string;
  enabled: boolean;
  ports: number[];
  port_ranges: PortRange[];
  protocol: Protocol;
  direction: Direction;
  bidirectional: boolean;
  action: "accept" | "drop";
  sources: Group[];
  destinations: Group[];
  sourceResource?: PolicyRuleResource;
  destinationResource?: PolicyRuleResource;
  sshAccessType: "full" | "limited";
  sshAuthorizedGroups?: AuthorizedGroups;
};

const createDefaultRule = (): RuleState => ({
  enabled: true,
  ports: [],
  port_ranges: [],
  protocol: "all",
  direction: "bi",
  bidirectional: true,
  action: "accept",
  sources: [],
  destinations: [],
  sshAccessType: "full",
  sshAuthorizedGroups: {},
});

const resolveGroup = (
  group: Group | string | null | undefined,
  groups?: Group[],
): Group | null => {
  if (!group) return null;
  if (typeof group === "object" && "id" in group) return group;
  if (typeof group === "string") {
    return groups?.find((g) => g.id === group) ?? null;
  }
  return null;
};

const resolveGroups = (
  values: Group[] | string[] | null | undefined,
  groups?: Group[],
): Group[] => {
  if (!Array.isArray(values)) return [];
  return values
    .map((group) => resolveGroup(group, groups))
    .filter(Boolean) as Group[];
};

const convertRuleToState = (rule: PolicyRule, groups: Group[]): RuleState => {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled ?? true,
    ports: rule.ports?.map((p) => Number(p)) ?? [],
    port_ranges: rule.port_ranges ?? [],
    protocol: rule.protocol ?? "all",
    direction: rule.bidirectional ? "bi" : "in",
    bidirectional: rule.bidirectional ?? true,
    action: (rule.action || "accept") as "accept" | "drop",
    sources: resolveGroups(rule.sources, groups),
    destinations: resolveGroups(rule.destinations, groups),
    sourceResource: rule.sourceResource,
    destinationResource: rule.destinationResource,
    sshAccessType:
      rule.authorized_groups && Object.keys(rule.authorized_groups).length > 0
        ? "limited"
        : "full",
    sshAuthorizedGroups: rule.authorized_groups,
  };
};

type Props = {
  policy?: Policy;
  postureCheckTemplates?: PostureCheck[];
  onSuccess?: (policy: Policy) => void;
  initialDestinationGroups?: Group[] | string[];
  initialName?: string;
  initialDescription?: string;
  initialProtocol?: Protocol;
  initialPorts?: number[];
  initialDestinationResource?: PolicyRuleResource;
};

export const useAccessControl = ({
  policy,
  postureCheckTemplates,
  initialDestinationGroups,
  initialName,
  initialDescription,
  onSuccess,
  initialProtocol,
  initialPorts,
  initialDestinationResource,
}: Props = {}) => {
  const { data: allPostureChecks, isLoading: isPostureChecksLoading } =
    useFetchApi<PostureCheck[]>("/posture-checks");
  const { groups } = useGroups();

  const [postureChecks, setPostureChecks] = useState<PostureCheck[]>([]);
  const postureChecksLoaded = useRef(false);

  const initialPostureChecks = useMemo(() => {
    const foundChecks =
      allPostureChecks?.filter((check) => {
        if (policy?.source_posture_checks) {
          if (
            policy.source_posture_checks.every((id) => typeof id === "string")
          ) {
            let checks = policy.source_posture_checks as string[];
            return checks.includes(check.id);
          } else {
            return policy.source_posture_checks.some((c) => {
              let policyCheck = c as PostureCheck;
              return policyCheck.id === check.id;
            });
          }
        }
        return false;
      }) || [];

    const templates = postureCheckTemplates || [];

    return merge(foundChecks, templates);
  }, [policy, allPostureChecks, postureCheckTemplates]);

  useEffect(() => {
    if (postureChecksLoaded.current) return;

    if (initialPostureChecks.length > 0) {
      postureChecksLoaded.current = true;
      setPostureChecks(initialPostureChecks);
    }
  }, [initialPostureChecks]);

  const { updatePolicy } = usePolicies();

  const initRules = useMemo((): RuleState[] => {
    // 兼容旧格式的 policy：先检查是否有 rules 数组
    if (policy?.rules && policy.rules.length > 0) {
      if (!groups) return [createDefaultRule()];
      return policy.rules.map((rule) => convertRuleToState(rule, groups));
    }
    // 兼容旧格式的 policy：如果没有 rules 数组，但有直接的字段
    if (
      policy &&
      ((policy as any).sources ||
        (policy as any).destinations ||
        (policy as any).protocol)
    ) {
      if (!groups) return [createDefaultRule()];

      const direction: Direction = (policy as any).bidirectional ? "bi" : "in";

      return [
        {
          ...createDefaultRule(),
          id: (policy as any).rule_id,
          name: policy.name,
          description: policy.description,
          protocol: (policy as any).protocol ?? "all",
          ports: (policy as any).ports?.map((p: string) => Number(p)) ?? [],
          port_ranges: (policy as any).port_ranges ?? [],
          sources: resolveGroups((policy as any).sources, groups),
          destinations: resolveGroups((policy as any).destinations, groups),
          direction,
          bidirectional: (policy as any).bidirectional ?? true,
          sourceResource: (policy as any).sourceResource,
          destinationResource: (policy as any).destinationResource,
          sshAccessType:
            (policy as any).authorized_groups &&
            Object.keys((policy as any).authorized_groups).length > 0
              ? "limited"
              : "full",
          sshAuthorizedGroups: (policy as any).authorized_groups,
        },
      ];
    }
    // 如果有初始参数
    if (
      initialDestinationGroups ||
      initialProtocol ||
      initialPorts ||
      initialDestinationResource
    ) {
      return [
        {
          ...createDefaultRule(),
          protocol: initialProtocol ?? "all",
          ports: initialPorts ?? [],
          destinations: resolveGroups(initialDestinationGroups, groups),
          destinationResource: initialDestinationResource,
        },
      ];
    }
    return [createDefaultRule()];
  }, [
    policy,
    groups,
    initialDestinationGroups,
    initialProtocol,
    initialPorts,
    initialDestinationResource,
  ]);

  const [rules, setRules] = useState<RuleState[]>(initRules);
  const initializedRulesKey = useRef<string | undefined>(
    policy || !groups ? undefined : "__create__",
  );

  useEffect(() => {
    if (!groups) return;

    const key = policy?.id ?? "__create__";
    if (initializedRulesKey.current === key) return;

    initializedRulesKey.current = key;
    setRules(initRules);
  }, [policy, groups, initRules]);

  const [policyName, setPolicyName] = useState(
    policy?.name || initialName || "",
  );
  const [policyDescription, setPolicyDescription] = useState(
    policy?.description || initialDescription || "",
  );
  const [policyEnabled, setPolicyEnabled] = useState<boolean>(
    policy?.enabled ?? true,
  );

  // 当 policy 变化时更新 policyName 和 policyDescription
  useEffect(() => {
    if (policy) {
      setPolicyName(policy.name || initialName || "");
      setPolicyDescription(policy.description || initialDescription || "");
      setPolicyEnabled(policy.enabled ?? true);
    }
  }, [policy, initialName, initialDescription]);
  const { mutate } = useSWRConfig();

  const policyRequest = useApiCall<Policy>("/policies");
  const groupRequest = useApiCall<Group>("/groups");

  const addRule = () => {
    setRules((prev) => [...prev, createDefaultRule()]);
  };

  const removeRule = (index: number) => {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<RuleState>) => {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)),
    );
  };

  const { updateOrCreateAndNotify: checkToCreate } = usePostureCheck({});
  const createPostureChecksWithoutID = async () => {
    const checks = postureChecks.filter(
      (check) => check?.id === undefined || check?.id === "",
    );
    const createChecks = checks.map((check) => checkToCreate(check));
    return Promise.all(createChecks);
  };

  const getPolicyData = () => {
    const policyRules = rules.map((rule) => {
      let sources = rule.sources;
      let destinations = rule.destinations;
      if (rule.direction === "out") {
        [sources, destinations] = [destinations, sources];
      }

      const [newPorts, newPortRanges] = parseAccessControlPorts(
        rule.ports,
        rule.port_ranges,
      );

      return {
        id: rule.id,
        bidirectional: rule.direction === "bi",
        description: rule.description,
        name: rule.name,
        sources: rule.sourceResource ? undefined : sources,
        destinations: rule.destinationResource ? undefined : destinations,
        sourceResource: rule.sourceResource || undefined,
        destinationResource: rule.destinationResource || undefined,
        action: rule.action,
        protocol: rule.protocol,
        enabled: rule.enabled,
        ports: newPorts,
        port_ranges: newPortRanges,
        authorized_groups: rule.sshAuthorizedGroups,
      };
    });

    return {
      name: policyName,
      description: policyDescription,
      enabled: policyEnabled,
      source_posture_checks: postureChecks,
      rules: policyRules,
    } as Policy;
  };

  const submit = async () => {
    const allGroups = rules.flatMap((rule) => [
      ...rule.sources,
      ...rule.destinations,
    ]);
    const uniqueGroups = uniqBy(allGroups, "name").filter((g) => g);

    // 创建/更新 groups
    const groupPromises = uniqueGroups.map(async (group) => {
      // 如果 group 已有 id，说明已经存在，直接返回
      if (group.id) {
        return group;
      }
      // 否则创建新的 group
      const groupPeers =
        group.peers &&
        group.peers
          .map((p) => {
            const groupPeer = p as any;
            return groupPeer.id;
          })
          .filter((p) => p !== undefined && p !== null);
      return groupRequest.post({
        name: group.name,
        peers: isEmpty(groupPeers) ? [] : groupPeers,
        resources: group.resources,
      });
    });

    const groups = await Promise.all(groupPromises).then((groups) => {
      mutate("/groups");
      return groups;
    });

    let hasError = false;
    let allChecks = postureChecks;
    await createPostureChecksWithoutID()
      .then((checks) => {
        allChecks = [...allChecks, ...(checks as PostureCheck[])];
      })
      .catch((e) => {
        hasError = true;
        console.error(e);
      });
    if (hasError) return;

    const policyRules = rules.map((rule) => {
      let sources = rule.sources
        .map((g) => {
          const find = groups.find((group) => group.name === g.name);
          return find?.id;
        })
        .filter((g) => g !== undefined) as string[];
      let destinations = rule.destinations
        .map((g) => {
          const find = groups.find((group) => group.name === g.name);
          return find?.id;
        })
        .filter((g) => g !== undefined) as string[];

      if (rule.direction === "out") {
        [sources, destinations] = [destinations, sources];
      }

      let [newPorts, newPortRanges] = parseAccessControlPorts(
        rule.ports,
        rule.port_ranges,
      );

      let authorizedGroups: AuthorizedGroups = {};
      if (rule.protocol === "netbird-ssh") {
        newPorts = ["22"];
        newPortRanges = [];

        const isEmpty =
          !rule.sshAuthorizedGroups ||
          Object.keys(rule.sshAuthorizedGroups).length === 0 ||
          rule.sshAccessType === "full";

        if (!isEmpty && rule.sshAuthorizedGroups) {
          Object.entries(rule.sshAuthorizedGroups).reduce(
            (acc, [groupName, usernames]) => {
              const group = groups?.find((group) => group.name === groupName);
              if (group?.id) {
                authorizedGroups[group.id] = usernames;
              }
              return acc;
            },
            {} as AuthorizedGroups,
          );
        } else {
          authorizedGroups = {};
        }
      }

      return {
        id: rule.id,
        bidirectional: rule.direction === "bi",
        description: rule.description,
        name: rule.name,
        action: rule.action,
        protocol: rule.protocol,
        enabled: rule.enabled,
        sources: rule.sourceResource ? undefined : sources,
        destinations: rule.destinationResource ? undefined : destinations,
        sourceResource: rule.sourceResource || undefined,
        destinationResource: rule.destinationResource || undefined,
        ports: newPorts,
        port_ranges: newPortRanges,
        authorized_groups:
          rule.protocol === "netbird-ssh" ? authorizedGroups : undefined,
      };
    });

    const policyObj = {
      name: policyName,
      description: policyDescription,
      enabled: policyEnabled,
      source_posture_checks: postureChecks
        ? postureChecks.map((c) => c.id)
        : undefined,
      rules: policyRules,
    } as Policy;

    if (policy && policy?.id !== undefined) {
      updatePolicy(
        policy,
        policyObj,
        (p) => {
          mutate("/policies");
          onSuccess && onSuccess(p);
        },
        "The policy was successfully saved",
      );
    } else {
      notify({
        title: "Create Access Control Policy",
        description: "Policy was created successfully.",
        loadingMessage: "Creating your policy...",
        promise: policyRequest.post(policyObj).then((policy) => {
          mutate("/policies");
          onSuccess && onSuccess(policy);
        }),
      });
    }
  };

  const hasPortSupport = (p: Protocol) => p === "tcp" || p === "udp";

  return {
    rules,
    addRule,
    removeRule,
    updateRule,
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
    hasPortSupport,
  } as const;
};

const parseAccessControlPorts = (ports: number[], portRanges: PortRange[]) => {
  const hasRanges = portRanges.length > 0;
  const hasPorts = ports.length > 0;
  if (!hasPorts && !hasRanges) return [undefined, undefined];
  if (!hasRanges) return [ports.map(String), undefined];
  if (!hasPorts) return [undefined, portRanges];

  const portRangesFromPorts = ports.map((port) => ({
    start: port,
    end: port,
  })) as PortRange[];

  const allRanges = [...portRanges, ...portRangesFromPorts];
  return [undefined, allRanges];
};

export const parsePortsToStrings = (rule?: PolicyRule): string[] => {
  if (!rule) return [];
  const ports = rule?.ports ?? [];
  const portRanges =
    rule?.port_ranges?.map((r) => {
      if (r.start === r.end) return `${r.start}`;
      return `${r.start}-${r.end}`;
    }) ?? [];
  return orderBy(
    [...portRanges, ...ports],
    [(p) => Number(p.split("-")[0])],
    ["asc"],
  );
};
