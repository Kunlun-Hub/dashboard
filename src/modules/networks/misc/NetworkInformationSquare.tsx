import DescriptionWithTooltip from "@components/ui/DescriptionWithTooltip";
import TextWithTooltip from "@components/ui/TextWithTooltip";
import { cn } from "@utils/helpers";
import { ArrowRightIcon } from "lucide-react";
import * as React from "react";

type Props = {
  onClick?: () => void;
  name: string;
  description?: string;
  active?: boolean;
  size?: "md" | "lg";
};
export const NetworkInformationSquare = ({
  onClick,
  name,
  description,
  active = false,
  size = "md",
}: Props) => {
  return (
    <button
      className={cn(
        "flex w-full min-w-0 items-center max-w-[450px] gap-4 dark:text-neutral-300 text-neutral-500 transition-all group/network rounded-md",
        onClick
          ? "hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 dark:hover:bg-nb-gray-900/60 cursor-pointer py-2 pl-3 pr-14 relative"
          : "cursor-default",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-nb-gray-800 dark:text-nb-gray-100 dark:border-transparent rounded-md flex items-center justify-center font-medium relative",
          "uppercase",
          size === "md" ? "h-10 w-10 text-md" : "h-12 w-12 text-lg",
          "shrink-0",
        )}
      >
        {name.substring(0, 2)}
        <div
          className={cn(
            "h-2 w-2 rounded-full absolute bottom-0 right-0 z-10",
            active ? "bg-green-500" : "bg-neutral-400 dark:bg-nb-gray-700",
          )}
        ></div>
        <div
          className={cn(
            "h-3 w-3 bg-white dark:bg-nb-gray-950 rounded-tl-[8px] rounded-br absolute bottom-0 right-0 transition-all",
            onClick && "group-hover/table-row:bg-neutral-50 dark:group-hover/table-row:bg-nb-gray-940",
            onClick && "group-hover/network:!bg-neutral-100 dark:group-hover/network:!bg-nb-gray-910",
          )}
        ></div>
      </div>
      <div
        className={"mt-[0px] flex items-start flex-wrap flex-col min-w-0"}
      >
        {size === "md" ? (
          <TextWithTooltip
            text={name}
            maxChars={25}
            className={"font-medium text-left text-sm"}
          />
        ) : (
          <p
            className={
              "font-medium text-left whitespace-nowrap text-xl leading-none mb-0.5"
            }
          >
            {name}
          </p>
        )}
        <DescriptionWithTooltip
          className={cn("text-left", size == "lg" && "text-md mt-0.5")}
          maxChars={24}
          text={description}
        />
      </div>
      {onClick && (
        <div
          className={
            "absolute right-0 top-0 h-full flex items-center pr-4 text-neutral-700 dark:text-nb-gray-200 opacity-0 group-hover/network:opacity-100"
          }
        >
          <ArrowRightIcon size={18} />
        </div>
      )}
    </button>
  );
};
