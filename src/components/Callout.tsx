import { cn } from "@utils/helpers";
import { cva, VariantProps } from "class-variance-authority";
import { InfoIcon } from "lucide-react";
import * as React from "react";

type CalloutVariants = VariantProps<typeof calloutVariants>;

type Props = {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & CalloutVariants;

export const calloutVariants = cva(
  ["px-4 py-3.5 rounded-md border text-sm font-normal flex gap-3 font-light"],
  {
    variants: {
      variant: {
        default:
          "bg-neutral-50 border-neutral-200 text-neutral-700 dark:bg-nb-gray-900/60 dark:border-nb-gray-800/80 dark:text-nb-gray-300",
        warning:
          "bg-orange-50 border-orange-200 text-orange-800 dark:bg-netbird-500/10 dark:border-netbird-400/20 dark:text-netbird-150",
        info: "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-400/10 dark:border-sky-400/20 dark:text-sky-100",
        success:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-400/15 dark:border-green-400/20 dark:text-green-100",
        error:
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-400/20 dark:text-red-100",
      },
    },
  },
);

export const Callout = ({
  children,
  icon = <InfoIcon size={14} className={"shrink-0 relative top-[3px]"} />,
  className,
  variant = "default",
}: Props) => {
  return (
    <div className={cn(calloutVariants({ variant }), className)}>
      {icon}
      <div>{children}</div>
    </div>
  );
};
