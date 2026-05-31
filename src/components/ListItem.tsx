import { cn } from "@utils/helpers";
import * as React from "react";

export const ListItem = ({
  icon,
  label,
  value,
  className,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(" border-b border-neutral-200 last:border-b-0 dark:border-nb-gray-920", className)}
    >
      <div className={cn("flex justify-between gap-12 py-2 px-4")}>
        <div className={"flex items-center gap-2 text-neutral-900 font-medium dark:text-nb-gray-100"}>
          {icon}
          {label}
        </div>
        <div className={"text-neutral-600 dark:text-nb-gray-300"}>{value}</div>
      </div>
      {children}
    </div>
  );
};
