import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import useFetchApi from "@utils/api";
import { Handle, type Node, Position } from "@xyflow/react";
import { sortBy } from "lodash";
import { ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Group } from "@/interfaces/Group";
import { controlCenterHandleColor } from "@/modules/control-center/utils/theme";

type NodeProps = Node<
  {
    currentGroup: string;
    onChange: (id: string) => void;
  },
  "selectGroupNode"
>;

export const SelectGroupNode = ({ data, id }: NodeProps) => {
  const { t } = useI18n();
  const { data: groups, isLoading: isGroupsLoading } =
    useFetchApi<Group[]>("/groups");

  const groupOptions: SelectOption[] = sortBy(
    groups?.map(
      (g) =>
        ({
          value: g.id,
          label: g.name,
          icon: () => (
            <GroupBadgeIcon id={g?.id} issued={g?.issued} size={14} />
          ),
        }) as SelectOption,
    ) || [],
    "label",
    "asc",
  );

  const group = groups?.find((g) => g.id === data.currentGroup);

  const countLabel = useMemo(() => {
    const peerCount = group?.peers_count || 0;
    const resourceCount = group?.resources_count || 0;
    if (resourceCount === 0) {
      return `${peerCount} ${t("groups.count.peers")}`;
    }
    if (peerCount === 0) {
      return `${resourceCount} ${t("groups.count.resources")}`;
    }
    return `${peerCount} ${t("groups.count.peers")}, ${resourceCount} ${t("groups.count.resources")}`;
  }, [group, t]);

  return (
    <div
      className={
        "bg-white border hover:bg-neutral-50 cursor-pointer border-neutral-200 rounded-lg overflow-hidden transition-all shadow-sm dark:border-nb-gray-800 dark:bg-nb-gray-930 dark:hover:bg-nb-gray-910 dark:shadow-none"
      }
    >
      <SelectDropdown
        variant={"secondary"}
        value={data.currentGroup}
        onChange={data.onChange}
        options={groupOptions}
        showSearch={true}
        searchPlaceholder={t("groups.searchPlaceholder")}
        popoverWidth={280}
        className={"!bg-white !text-neutral-700 hover:!bg-neutral-50 dark:!bg-nb-gray-920 dark:!text-nb-gray-300 dark:hover:!bg-nb-gray-925"}
        size={"xs"}
        maxHeight={300}
      >
        <div className={"flex items-center justify-between gap-8 pr-3"}>
          {group && (
            <div
              className={
                "flex w-full items-center justify-between text-neutral-600 gap-2 text-sm pl-3 pr-5 py-3 font-normal dark:text-nb-gray-300"
              }
            >
              <div className={"flex items-center gap-3 font-normal text-sm"}>
                <div
                  className={
                    "h-9 w-9 bg-neutral-100 rounded-md flex items-center justify-center shrink-0 dark:bg-nb-gray-850"
                  }
                >
                  <GroupBadgeIcon
                    id={group?.id}
                    issued={group?.issued}
                    size={14}
                  />
                </div>
                <div>
                  <div
                    className={
                      " text-neutral-900 font-normal whitespace-nowrap text-left dark:text-nb-gray-200"
                    }
                  >
                    {group.name}
                  </div>
                  <div
                    className={
                      "text-neutral-500 whitespace-nowrap text-xs text-left dark:text-nb-gray-400"
                    }
                  >
                    {countLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
          <ChevronsUpDown size={18} className={"shrink-0"} />
        </div>
      </SelectDropdown>
      <Handle
        type="source"
        position={Position.Right}
        id={"sr"}
        style={{
          height: 20,
          width: "1px",
          border: "none",
          backgroundColor: controlCenterHandleColor,
          borderRadius: "0px 4px 4px 0px",
          right: -2,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={"tl"}
        className={"opacity-0"}
      />
    </div>
  );
};
