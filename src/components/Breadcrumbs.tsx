import { cn } from "@utils/helpers";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  children: React.ReactNode;
};
function Breadcrumbs({ children }: Props) {
  return <div className={"flex items-center mb-6 gap-2"}>{children}</div>;
}

type ItemProps = {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
};

export const Item = ({
  href,
  label,
  icon,
  active,
  disabled = false,
}: ItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 group",
        disabled && "pointer-events-none",
      )}
    >
      <ChevronRightIcon
        size={16}
        className={"text-neutral-400 group-first:hidden dark:text-nb-gray-400"}
      />
      <div
        className={cn(
          "flex items-center gap-2.5 text-neutral-500 transition-all cursor-pointer dark:text-nb-gray-400",
          active
            ? "text-neutral-900 dark:text-nb-gray-300"
            : "hover:text-neutral-900 dark:hover:text-nb-gray-300",
        )}
      >
        {icon && icon}
        {href ? (
          <Link href={href} data-cy={"breadcrumb-item"}>
            {label}
          </Link>
        ) : (
          label
        )}
      </div>
    </div>
  );
};

Breadcrumbs.Item = Item;

export default Breadcrumbs;
