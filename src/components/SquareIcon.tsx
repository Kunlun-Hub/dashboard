import { cn } from "@utils/helpers";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const iconVariant = cva(
  "rounded-md flex items-center justify-center border shadow-sm shrink-0",
  {
    variants: {
      color: {
        netbird:
          "bg-netbird-50 border-netbird-200 text-netbird-700 dark:bg-netbird-950 dark:border-netbird dark:text-netbird",
        blue:
          "bg-netbird-50 border-netbird-200 text-netbird-700 dark:bg-netbird-950 dark:border-netbird-500 dark:text-netbird-500",
        "blue-darker":
          "bg-netbird-50 border-netbird-200 text-netbird-700 dark:bg-netbird-950 dark:border-netbird-500 dark:text-netbird-500",
        red:
          "bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-500 dark:text-red-500",
        gray: "bg-neutral-100 border-neutral-200 text-neutral-500 dark:bg-nb-gray-930 dark:border-nb-gray-800 dark:text-gray-500",
        green:
          "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-500 dark:text-green-500",
        purple:
          "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-500 dark:text-purple-500",
        indigo:
          "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-500 dark:text-indigo-500",
        yellow:
          "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-400",
      },
      size: {
        small: "w-8 h-8",
        medium: "w-10 h-10",
        large: "w-12 h-12",
      },
    },
  },
);

export type IconVariant = VariantProps<typeof iconVariant>;
interface Props extends IconVariant {
  icon: React.ReactNode;
  margin?: string;
  rounded?: boolean;
}

export default function SquareIcon({
  color = "netbird",
  icon,
  size = "medium",
  margin = "mt-1",
  rounded = false,
}: Props) {
  return (
    <div
      className={cn(
        iconVariant({
          color,
          size,
        }),
        margin,
        rounded && "rounded-full",
      )}
    >
      {icon}
    </div>
  );
}
