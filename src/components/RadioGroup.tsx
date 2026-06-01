import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@utils/helpers";
import * as React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

export const RadioGroup = ({ value, onChange, children }: Props) => {
  return (
    <RadixRadioGroup.Root
      value={value}
      onValueChange={onChange}
      className={
        "flex bg-neutral-100 rounded-md border border-neutral-200 text-sm items-center justify-center p-1 dark:border-nb-gray-700 dark:bg-nb-gray-900"
      }
    >
      {children}
    </RadixRadioGroup.Root>
  );
};
export const RadioGroupItems = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className={"flex w-full bg-neutral-100 dark:bg-nb-gray-900"}>
      {children}
    </div>
  );
};

export const RadioGroupItem = ({
  value,
  children,
  variant = "default",
}: {
  value: string;
  children?: React.ReactNode;
  variant?: "default" | "red" | "green";
}) => {
  return (
    <RadixRadioGroup.Item value={value} asChild={true}>
      <div
        key={value}
        className={cn(
          variant === "default" &&
            "text-neutral-500 hover:text-neutral-700 data-[state=checked]:bg-netbird-50 data-[state=checked]:text-netbird-700 data-[state=checked]:ring-1 data-[state=checked]:ring-netbird-200 dark:text-nb-gray-500 dark:hover:text-nb-gray-400 dark:data-[state=checked]:bg-nb-gray-600 dark:data-[state=checked]:text-nb-gray-100 dark:data-[state=checked]:ring-0",
          variant === "red" &&
            "text-neutral-600 hover:text-neutral-800 data-[state=checked]:bg-red-50 data-[state=checked]:text-red-700 data-[state=checked]:ring-1 data-[state=checked]:ring-red-200 dark:text-nb-gray-500 dark:hover:text-nb-gray-400 dark:data-[state=checked]:bg-red-800 dark:data-[state=checked]:text-red-200 dark:data-[state=checked]:ring-0",
          variant === "green" &&
            "text-neutral-600 hover:text-neutral-800 data-[state=checked]:bg-emerald-50 data-[state=checked]:text-emerald-700 data-[state=checked]:ring-1 data-[state=checked]:ring-emerald-200 dark:text-nb-gray-500 dark:hover:text-nb-gray-400 dark:data-[state=checked]:bg-green-800 dark:data-[state=checked]:text-green-200 dark:data-[state=checked]:ring-0",
          "cursor-pointer relative transition-all w-full py-1.5 px-5 rounded-md h-full flex items-center text-sm gap-1 text-center justify-center",
        )}
      >
        {children ? children : <div className={"h-3"}></div>}
      </div>
    </RadixRadioGroup.Item>
  );
};
