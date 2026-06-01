import { cn } from "@utils/helpers";
import { cva, VariantProps } from "class-variance-authority";
import Link, { LinkProps } from "next/link";
import React from "react";

export type InlineLinkProps = VariantProps<typeof linkVariants>;

interface Props extends LinkProps, InlineLinkProps {
  children: React.ReactNode;
  className?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

interface InlineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    InlineLinkProps {
  children: React.ReactNode;
  className?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export const linkVariants = cva(
  "underline-offset-4 items-center transition-all duration-200 inline-flex texts-inherit gap-1",
  {
    variants: {
      variant: {
        default: "text-netbird hover:underline font-normal",
        faded:
          "text-neutral-500 hover:text-neutral-900 hover:underline dark:text-nb-gray-400 dark:hover:text-nb-gray-300",
        white:
          "text-neutral-700 hover:text-neutral-900 hover:underline dark:text-nb-gray-100 dark:hover:text-white",
        dashed:
          "text-neutral-700 underline font-normal decoration-dashed hover:text-neutral-900 dark:text-nb-gray-100/90 dark:hover:text-white",
      },
    },
  },
);

export default function InlineLink({ variant = "default", ...props }: Props) {
  return (
    <Link {...props} className={cn(props.className, linkVariants({ variant }))}>
      {props.children}
    </Link>
  );
}

export function InlineButtonLink({
  variant = "default",
  ...props
}: InlineButtonProps) {
  return (
    <button
      {...props}
      className={cn(props.className, linkVariants({ variant }))}
    >
      {props.children}
    </button>
  );
}
