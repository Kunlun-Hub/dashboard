import { DeviceCard } from "@components/DeviceCard";
import { cn } from "@utils/helpers";
import { Handle, type Node, Position } from "@xyflow/react";
import * as React from "react";
import type { Peer } from "@/interfaces/Peer";
import { useAnySourceGroupEnabled } from "@/modules/control-center/utils/helpers";

type PeerNodeProps = Node<
  {
    peer: Peer;
    enabled?: boolean;
    onClick?: (p: Peer) => void;
  },
  "peerNode"
>;

export const PeerNode = ({ data, id }: PeerNodeProps) => {
  const { peer, enabled, onClick } = data;
  const sourceGroupEnabled = useAnySourceGroupEnabled(id);
  const isEnabled = enabled ?? sourceGroupEnabled;

  return (
    <div
      className={cn(
        "border-0 border-neutral-200 rounded-lg overflow-hidden transition-all dark:border-nb-gray-800",
        onClick &&
          "border-transparent border hover:border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer pl-3 py-1 pr-5 dark:hover:border-nb-gray-800 dark:hover:bg-nb-gray-930",
      )}
      onClick={() => onClick?.(peer)}
    >
      <DeviceCard
        device={peer}
        className={cn("p-0", !isEnabled && "opacity-60", onClick && "w-auto")}
      />
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
