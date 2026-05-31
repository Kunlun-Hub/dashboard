import { cn } from "@utils/helpers";
import { Handle, type Node, Position } from "@xyflow/react";
import { Layers3Icon } from "lucide-react";
import * as React from "react";

type SummaryNodeProps = Node<
  {
    title: string;
    subtitle: string;
    enabled?: boolean;
  },
  "summaryNode"
>;

export const SummaryNode = ({ data }: SummaryNodeProps) => {
  const { title, subtitle, enabled = true } = data;

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-neutral-300 bg-white/90 px-3 py-3 text-left transition-all shadow-sm dark:border-nb-gray-700 dark:bg-nb-gray-930/90 dark:shadow-none",
        !enabled && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-nb-gray-100">
        <Layers3Icon size={14} className="text-neutral-500 dark:text-nb-gray-400" />
        <span>{title}</span>
      </div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-nb-gray-400">{subtitle}</div>

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
