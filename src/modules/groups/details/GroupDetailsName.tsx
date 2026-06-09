import FullTooltip from "@components/FullTooltip";
import { GroupBadgeIcon } from "@components/ui/GroupBadgeIcon";
import { cn } from "@utils/helpers";
import { PencilIcon } from "lucide-react";
import React from "react";
import { useGroupContext } from "@/contexts/GroupProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { GROUP_TOOLTIP_TEXT } from "@/interfaces/Group";

export const GroupDetailsName = () => {
  const { group, isJWTGroup, isAllowedToRename, openGroupRenameModal } =
    useGroupContext();
  const { permission } = usePermissions();

  return (
    <div className={"w-full"}>
      <h1 className={"flex items-center gap-3 w-full whitespace-nowrap"}>
        <GroupBadgeIcon id={group?.id} issued={group?.issued} size={20} />
        {group.name}
        {group.name !== "All" && permission?.groups?.update && (
          <div>
            <FullTooltip
              content={
                <div className={"text-xs max-w-xs"}>
                  {isJWTGroup
                    ? GROUP_TOOLTIP_TEXT.RENAME.JWT
                    : GROUP_TOOLTIP_TEXT.RENAME.INTEGRATION}
                </div>
              }
              interactive={false}
              disabled={isAllowedToRename}
              className={"w-full block"}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center gap-2 text-neutral-500 hover:text-neutral-900 transition-all hover:bg-neutral-100 rounded-md cursor-pointer dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-nb-gray-800/60",
                  !isAllowedToRename &&
                    "opacity-40 cursor-not-allowed pointer-events-none",
                )}
                onClick={openGroupRenameModal}
              >
                <PencilIcon size={16} />
              </div>
            </FullTooltip>
          </div>
        )}
      </h1>
    </div>
  );
};
