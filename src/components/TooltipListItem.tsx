import { cn } from "@utils/helpers";
import * as React from "react";

export const TooltipListItem = ({
  icon,
  label,
  value,
  className,
  labelClassName,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
  labelClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "flex justify-between gap-12 border-b border-neutral-200 py-2 px-4 last:border-b-0 dark:border-nb-gray-920",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-neutral-900 font-medium dark:text-nb-gray-100",
          labelClassName,
        )}
      >
        {icon}
        {label}
      </div>
      <div className={"text-neutral-500 dark:text-nb-gray-300"}>{value}</div>
    </div>
  );
};
