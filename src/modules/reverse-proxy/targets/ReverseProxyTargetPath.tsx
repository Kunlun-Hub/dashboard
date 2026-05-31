import { cn } from "@utils/helpers";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { ReverseProxyTarget } from "@/interfaces/ReverseProxy";
import { useReverseProxyTarget } from "@/modules/reverse-proxy/targets/ReverseProxyTargetContext";

type Props = {
  target: ReverseProxyTarget;
};

export const ReverseProxyTargetPath = ({ target }: Props) => {
  const reverseProxy = useReverseProxyTarget();

  const path = target.path
    ? target.path.startsWith("/")
      ? target.path
      : `/${target.path}`
    : "/";

  const fullUrl = `https://${reverseProxy.domain}${path}`;

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-2 group",
        !target.enabled && "opacity-50 pointer-events-none",
      )}
    >
      <span
        className={
          "text-[11px] leading-none font-mono px-2.5 py-2 rounded bg-neutral-100 text-neutral-700 transition-all group-hover:bg-neutral-200 group-hover:text-neutral-900 dark:bg-nb-gray-920 dark:text-nb-gray-300 dark:group-hover:bg-nb-gray-900 dark:group-hover:text-nb-gray-100"
        }
      >
        {path}
      </span>
      <ExternalLinkIcon
        size={12}
        className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity dark:text-nb-gray-400"
      />
    </a>
  );
};
