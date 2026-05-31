import * as RadioGroup from "@radix-ui/react-radio-group";
import { ReactNode } from "react"; // or replace with clsx or similar
import { cn } from "@/utils/helpers";

type Props = {
  value: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
};

export const RadioCard = ({
  value,
  title,
  description,
  className,
  icon,
  disabled,
}: Props) => {
  return (
    <RadioGroup.Item
      value={value}
      disabled={disabled}
      className={cn(
        "peer relative block cursor-pointer rounded-lg border border-neutral-200 bg-white px-5 py-3 transition-all focus:outline-none dark:border-nb-gray-900 dark:bg-nb-gray-930/60",
        "data-[state=checked]:border-netbird data-[state=checked]:bg-netbird-50 dark:data-[state=checked]:border-nb-gray-400 dark:data-[state=checked]:bg-nb-gray-920",
        "outline-none focus:ring-0 focus:bg-neutral-50 focus:border-neutral-300 dark:focus:bg-nb-gray-930 dark:focus:border-nb-gray-920",
        "hover:bg-neutral-50 dark:hover:bg-nb-gray-930",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-nb-gray-930/60",
        className,
      )}
    >
      <div className="text-neutral-900 dark:text-nb-gray-100 font-normal text-sm text-left gap-2 flex items-center">
        {icon}
        {title}
      </div>
      <div className="text-neutral-500 dark:text-nb-gray-300 text-[0.8rem] text-left">
        {description}
      </div>
    </RadioGroup.Item>
  );
};

type RadioCardGroupProps = {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export const RadioCardGroup = ({
  value,
  onValueChange,
  children,
  className,
  "aria-label": ariaLabel = "Options",
}: RadioCardGroupProps) => {
  return (
    <RadioGroup.Root
      className={cn("flex flex-col gap-2", className)}
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
    >
      {children}
    </RadioGroup.Root>
  );
};
