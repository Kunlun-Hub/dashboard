import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import { useRouter } from "next/navigation";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  icon: React.ReactNode;
  count: number;
  groupName: string;
  text?: string;
  href?: string;
  hidden?: boolean;
};
export default function GroupsCountCell({
  icon,
  count = 0,
  groupName,
  text,
  href,
  hidden = false,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const handleClick = () => {
    href && router.push(href);
  };

  return (
    !hidden && (
      <FullTooltip
        className={"w-full"}
        content={
          <div className={"text-xs"}>
            {t("groups.usedInPrefix")}{" "}
            <span className={"text-netbird font-medium"}>{groupName}</span>{" "}
            {t("groups.usedInMiddle")}{" "}
            <span className={"font-medium text-netbird"}>{count}</span> {text}
          </div>
        }
        disabled={count === 0}
      >
        <Badge
          variant={"gray"}
          useHover={!!href}
          onClick={href ? handleClick : undefined}
          className={cn(
            "gap-2 w-full border",
            count === 0
              ? "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-nb-gray-930/30 dark:text-nb-gray-400 dark:border-nb-gray-800/30"
              : "bg-white text-neutral-800 border-neutral-300 dark:bg-nb-gray-930/60 dark:text-nb-gray-200 dark:border-nb-gray-800/40",
            href && "cursor-pointer",
          )}
        >
          {icon}
          {count}
        </Badge>
      </FullTooltip>
    )
  );
}
