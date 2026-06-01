"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@utils/helpers";
import { cva, VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import * as React from "react";

type CheckboxVariants = VariantProps<typeof variants>;

const variants = cva([], {
  variants: {
    variant: {
      default: [
        "data-[state=unchecked]:bg-white hover:border-netbird-300 dark:data-[state=unchecked]:bg-nb-gray-950 dark:border-nb-gray-900 dark:ring-offset-neutral-950 dark:focus-visible:ring-netbird-500/40",
        "dark:data-[state=checked]:bg-netbird dark:data-[state=checked]:text-neutral-50",
      ],
      tableCell: [
        "data-[state=unchecked]:bg-white hover:border-netbird-300 dark:data-[state=unchecked]:bg-nb-gray-920 dark:border-nb-gray-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-netbird-500/40",
        "dark:data-[state=checked]:bg-netbird dark:data-[state=checked]:text-neutral-50",
      ],
    },
  },
});

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
    CheckboxVariants
>(({ className, variant = "default", ...props }, ref) => (
  <div className={"h-5 w-5"}>
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        variants({ variant }),
        "border-neutral-300",
        "peer h-5 w-5 shrink-0 rounded-[4px] border",
        "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netbird-400/50 focus-visible:ring-offset-2 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-netbird data-[state=checked]:bg-netbird data-[state=checked]:text-white ",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={"flex items-center justify-center"}
      >
        <Check size={14} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  </div>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
