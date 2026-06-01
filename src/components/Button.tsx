"use client";

import { cva, VariantProps } from "class-variance-authority";
import classNames from "classnames";
import React, { forwardRef } from "react";

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  disabled?: boolean;
  stopPropagation?: boolean;
}

export const buttonVariants = cva(
  [
    "relative",
    "text-sm focus:z-10 focus:ring-2 font-medium  focus:outline-none whitespace-nowrap shadow-sm",
    "inline-flex gap-2 items-center justify-center transition-colors focus:ring-offset-1",
    "disabled:opacity-70 disabled:cursor-not-allowed disabled:dark:text-nb-gray-300 dark:ring-offset-neutral-950/50",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-white hover:text-black focus:ring-zinc-200/50  hover:bg-gray-100 border-gray-200 text-gray-900",
          "dark:focus:ring-zinc-800/50 dark:bg-nb-gray dark:text-gray-400 dark:border-gray-700/30 dark:hover:text-white dark:hover:bg-zinc-800/50",
        ],
        primary: [
          "dark:focus:ring-netbird-600/50 dark:ring-offset-neutral-950/50 enabled:dark:bg-netbird disabled:dark:bg-nb-gray-910 dark:text-gray-100 enabled:dark:hover:text-white enabled:dark:hover:bg-netbird-500/80",
          "enabled:bg-netbird enabled:text-white enabled:border-netbird enabled:focus:ring-netbird-400/50 enabled:hover:bg-netbird-500 enabled:hover:border-netbird-500 disabled:bg-netbird-100 disabled:text-netbird-700 disabled:border-netbird-200",
        ],
        secondary: [
          "bg-white hover:text-neutral-950 focus:ring-netbird/20 hover:bg-neutral-50 border-neutral-300 text-neutral-800 shadow-sm",
          "dark:ring-offset-neutral-950/50 dark:focus:ring-neutral-500/20  ",
          "dark:bg-nb-gray-920 dark:text-gray-400 dark:border-gray-700/40 dark:hover:text-white dark:hover:bg-nb-gray-910",
        ],
        secondaryLighter: [
          "bg-white hover:text-black focus:ring-zinc-200/50 hover:bg-gray-100 border-gray-200 text-gray-900",
          "dark:ring-offset-neutral-950/50 dark:focus:ring-neutral-500/20  ",
          "dark:bg-nb-gray-900/70 dark:text-gray-400 dark:border-gray-700/70 dark:hover:text-white dark:hover:bg-nb-gray-800/60",
        ],
        input: [
          "bg-white hover:text-black focus:ring-zinc-200/50 hover:bg-gray-100 border-neutral-200 text-gray-900",
          "dark:ring-offset-neutral-950/50 dark:focus:ring-neutral-500/20  ",
          "dark:bg-nb-gray-900  dark:text-gray-400  dark:border-nb-gray-700 dark:hover:bg-nb-gray-900/80",
        ],
        dropdown: [
          "bg-white hover:text-black focus:ring-zinc-200/50 hover:bg-gray-100 border-neutral-200 text-gray-900",
          "dark:ring-offset-neutral-950/50 dark:focus:ring-neutral-500/20  ",
          "dark:bg-nb-gray-900/40 dark:text-gray-400 dark:border-nb-gray-900 dark:hover:bg-nb-gray-900/50",
        ],
        dotted: [
          "bg-white hover:text-black focus:ring-zinc-200/50 hover:bg-gray-100 border-gray-200 text-gray-900 border-dashed",
          "dark:ring-offset-neutral-950/50 dark:focus:ring-neutral-500/20  ",
          "dark:bg-nb-gray-900/30 dark:text-gray-400 dark:border-gray-500/40 dark:hover:text-white dark:hover:bg-nb-gray-900/50",
        ],
        tertiary: [
          "bg-netbird-50 hover:text-netbird-900 focus:ring-netbird/25 hover:bg-netbird-100 border-netbird-300 text-netbird-800 shadow-sm ring-1 ring-netbird-200/60",
          "dark:focus:ring-zinc-800/50 dark:bg-white dark:text-gray-800 dark:border-gray-700/40 dark:hover:bg-neutral-200 disabled:dark:bg-nb-gray-920 disabled:dark:text-nb-gray-300",
        ],
        white: [
          "focus:ring-white/50 bg-white text-gray-800 border-white outline-none hover:bg-neutral-200 disabled:dark:bg-nb-gray-920 disabled:dark:text-nb-gray-300",
          "disabled:dark:bg-nb-gray-900 disabled:dark:text-nb-gray-300 disabled:dark:border-nb-gray-900",
        ],
        outline: [
          "bg-white hover:text-black focus:ring-zinc-200/50  hover:bg-gray-100 border-gray-200 text-gray-900",
          "dark:focus:ring-zinc-800/50 dark:bg-transparent dark:text-netbird dark:border-netbird dark:hover:bg-nb-gray-900/30",
        ],
        "danger-outline": [
          "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus:ring-red-200/70",
          "enabled:dark:focus:ring-red-800/20 enabled:dark:focus:bg-red-950/40 enabled:hover:dark:bg-red-950/50 enabled:dark:hover:border-red-800/50 dark:bg-transparent dark:text-red-500",
        ],
        "danger-text": [
          "bg-transparent text-red-600 hover:text-red-700 border-transparent !px-0 !shadow-none !py-0 focus:ring-red-500/30 dark:bg-transparent dark:text-red-500 dark:hover:text-red-600 dark:border-transparent dark:ring-offset-neutral-950/50 rounded-sm",
        ],
        "default-outline": [
          "bg-transparent text-neutral-600 border-transparent hover:text-neutral-900 hover:bg-neutral-100 hover:border-neutral-200",
          "data-[state=open]:text-neutral-900 data-[state=open]:bg-neutral-100 data-[state=open]:border-neutral-200",
          "dark:ring-offset-nb-gray-950/50 dark:focus:ring-nb-gray-500/20",
          "dark:bg-transparent dark:text-nb-gray-400 dark:border-transparent dark:hover:text-white dark:hover:bg-nb-gray-900/30 dark:hover:border-nb-gray-800/50",
          "data-[state=open]:dark:text-white data-[state=open]:dark:bg-nb-gray-900/30 data-[state=open]:dark:border-nb-gray-800/50",
        ],
        danger: [
          "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200/70 border-red-600 hover:border-red-700",
          "dark:focus:ring-red-700/20 dark:focus:bg-red-700 hover:dark:bg-red-700 dark:hover:border-red-800/50 dark:bg-red-600 dark:text-red-100",
        ],
      },
      size: {
        xs: "text-xs py-2 px-4",
        xs2: "text-[0.78rem] py-2 px-4",
        sm: "text-sm py-2.5 px-4",
        md: "text-md py-2.5 px-4",
        lg: "text-lg py-2.5 px-4",
      },
      rounded: {
        true: "rounded-md",
        false: "",
      },
      border: {
        0: "border-0",
        1: "border",
        2: "border border-t-0 border-b-0",
      },
    },
  },
);

const Button = forwardRef(
  (
    {
      variant = "default",
      rounded = true,
      border = 1,
      size = "md",
      stopPropagation = true,
      ...props
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <button
        type="button"
        {...props}
        ref={ref}
        className={classNames(
          buttonVariants({
            variant,
            rounded,
            border: border ? 1 : 0,
            size: size,
          }),
          props.className,
        )}
        onClick={(e) => {
          stopPropagation && e.stopPropagation();
          props.onClick && props.onClick(e);
        }}
      >
        {props.children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
