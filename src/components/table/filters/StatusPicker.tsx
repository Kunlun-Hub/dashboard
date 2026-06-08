"use client";

import { cn } from "@utils/helpers";
import { CheckIcon } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

// StatusPicker — three-way radio that maps to the `connected` column.
//   undefined → All
//   true      → Online
//   false     → Offline
type Option = {
  value: boolean | undefined;
  label: string;
  dotClass: string;
};

type Props = {
  value: boolean | undefined;
  onChange: (next: boolean | undefined) => void;
  close: () => void;
};

export function StatusPicker({ value, onChange, close }: Props) {
  const { t } = useI18n();
  const options: Option[] = [
    { value: undefined, label: t("common.all"), dotClass: "bg-nb-gray-500" },
    { value: true, label: t("common.online"), dotClass: "bg-green-500" },
    { value: false, label: t("common.offline"), dotClass: "bg-nb-gray-700" },
  ];

  return (
    <div className={"flex flex-col gap-0.5"}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.label}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors",
              "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-nb-gray-300 dark:hover:bg-nb-gray-900 dark:hover:text-white",
              selected && "text-neutral-900 dark:text-white",
            )}
            onClick={() => {
              onChange(option.value);
              close();
            }}
          >
            <CheckIcon
              size={14}
              className={cn(
                "shrink-0 text-netbird dark:text-white",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                option.dotClass,
              )}
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// formatChip helper exported for use in the filter def's formatChip().
type Translate = ReturnType<typeof useI18n>["t"];

export function formatStatusChip(
  value: boolean | undefined,
  t: Translate,
): string | null {
  if (value === true) return t("common.online");
  if (value === false) return t("common.offline");
  return null;
}
