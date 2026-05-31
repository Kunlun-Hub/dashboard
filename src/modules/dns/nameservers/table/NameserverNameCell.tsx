import DescriptionWithTooltip from "@components/ui/DescriptionWithTooltip";
import React from "react";
import { NameserverGroup } from "@/interfaces/Nameserver";
import ActiveInactiveRow from "@/modules/common-table-rows/ActiveInactiveRow";

type Props = {
  ns: NameserverGroup;
};
export default function NameserverNameCell({ ns }: Props) {
  return (
    <div className={"flex min-w-[270px] max-w-[270px]"}>
      <div
        className={
          "flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-all hover:bg-neutral-100 py-2 px-3 rounded-md cursor-pointer dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-nb-gray-800/60"
        }
      >
        <ActiveInactiveRow
          active={ns.enabled}
          inactiveDot={"gray"}
          text={ns.name}
        >
          <DescriptionWithTooltip className={"mt-1"} text={ns.description} />
        </ActiveInactiveRow>
      </div>
    </div>
  );
}
