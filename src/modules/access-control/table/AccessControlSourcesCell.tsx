import Badge from "@components/Badge";
import MultipleGroups, { TransparentEditIconButton } from "@components/ui/MultipleGroups";
import { cn } from "@utils/helpers";
import { UserIcon, UsersIcon } from "lucide-react";
import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Group } from "@/interfaces/Group";
import { Policy } from "@/interfaces/Policy";
import { AccessControlResourceCell } from "@/modules/access-control/table/AccessControlResourceCell";
import AccessControlRuleEndpointCell from "@/modules/access-control/table/AccessControlRuleEndpointCell";
import EmptyRow from "@/modules/common-table-rows/EmptyRow";

type Props = {
  policy: Policy;
  hideEdit?: boolean;
  disableRedirect?: boolean;
};

export default function AccessControlSourcesCell({
  policy,
  hideEdit = false,
  disableRedirect = false,
}: Props) {
  const { permission } = usePermissions();
  const canUpdate = permission?.policies?.update;

  const firstRule = useMemo(() => {
    if (policy.rules.length > 0) return policy.rules[0];
    return undefined;
  }, [policy]);

  if (firstRule?.sourceResource) {
    return <AccessControlResourceCell resource={firstRule.sourceResource} />;
  }

  const sourceUsers = (firstRule?.source_users ?? []) as string[];
  const sourceUserGroups = (firstRule?.source_user_groups ?? []) as string[];

  return firstRule ? (
    <div
      className={cn(
        "flex items-center gap-1 flex-wrap",
        canUpdate && !hideEdit && "group",
      )}
    >
      {firstRule.sources && firstRule.sources.length > 0 && (
        <MultipleGroups
          groups={firstRule.sources as Group[]}
          showUsers={firstRule.protocol === "netbird-ssh"}
          disableRedirect={disableRedirect}
          countOnly
        />
      )}
      {sourceUsers.length > 0 && (
        <Badge variant="gray" size="xs">
          <UserIcon size={12} />
          {sourceUsers.length}
        </Badge>
      )}
      {sourceUserGroups.length > 0 && (
        <Badge variant="gray" size="xs">
          <UsersIcon size={12} />
          {sourceUserGroups.length}
        </Badge>
      )}
      {canUpdate && !hideEdit && <TransparentEditIconButton />}
    </div>
  ) : (
    <EmptyRow />
  );
}
