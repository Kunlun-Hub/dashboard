import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { cn } from "@utils/helpers";
import { Copy } from "lucide-react";
import * as React from "react";

type Props = {
  children: React.ReactNode;
  copy?: boolean;
};
export const Mark = ({ children, copy = false }: Props) => {
  const [ref, copyToClipBoard] = useCopyToClipboard();

  return (
    <>
      {" "}
      <i
        onClick={() => copy && copyToClipBoard()}
        ref={ref}
        className={cn(
          "inline-flex not-italic gap-2 bg-neutral-100 text-neutral-700 py-[2px] px-2 rounded-md text-[12px] items-center mx-[1px] -top-[1px] relative my-[2.5px] dark:bg-nb-gray-900 dark:text-nb-gray-300",
          copy &&
            "cursor-pointer hover:bg-neutral-200 hover:text-neutral-900 transition-all dark:hover:bg-nb-gray-800 dark:hover:text-nb-gray-100",
        )}
      >
        {children}
        {copy && <Copy size={11} />}
      </i>{" "}
    </>
  );
};
