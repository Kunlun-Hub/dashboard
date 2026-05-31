import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import { cn } from "@utils/helpers";
import { Handle, type Node, Position } from "@xyflow/react";
import * as React from "react";
import { Policy } from "@/interfaces/Policy";
import { getPolicyProtocolAndPortText } from "@/modules/control-center/utils/helpers";

type PolicyNode = Node<
  {
    policy: Policy;
  },
  "policyNode"
>;

export const PolicyNode = ({ data }: PolicyNode) => {
  const rule = data.policy.rules?.[0];
  const label = getPolicyProtocolAndPortText(data.policy);
  const isActive = data.policy.enabled && (rule?.enabled ?? true);

  return (
    <div
      className={cn(
        "relative bg-white hover:bg-neutral-50 cursor-pointer border border-neutral-200 rounded-full flex justify-between overflow-hidden shadow-sm dark:border-nb-gray-800 dark:bg-nb-gray-940 dark:hover:bg-nb-gray-930 dark:shadow-none",
        !isActive && "opacity-60",
      )}
    >
      <div className={"flex items-center justify-center"}>
        <div
          className={cn(
            "h-2 w-2 rounded-full ml-3 mr-2",
            isActive ? "bg-green-400" : "bg-neutral-400 dark:bg-nb-gray-400",
          )}
        ></div>
      </div>
      <div className={"pt-2.5 pb-[0.6rem] pr-3 flex gap-4 leading-none"}>
        <div
          className={
            " text-neutral-800 font-normal whitespace-nowrap text-[0.8rem] flex items-center justify-center w-full dark:text-nb-gray-200"
          }
        >
          <div className={"truncate max-w-[200px]"}>{rule?.name}</div>
        </div>
      </div>
      <div
        className={
          "border-l border-neutral-200 flex items-center text-neutral-500 text-[0.65rem] pl-2 pr-3 font-mono dark:border-nb-gray-800 dark:text-nb-gray-300"
        }
      >
        <div>{label === "" ? "All" : label}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id={"sr"}
        className={"opacity-0"}
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
