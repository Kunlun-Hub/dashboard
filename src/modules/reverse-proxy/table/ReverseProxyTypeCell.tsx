import * as React from "react";
import { useMemo } from "react";
import { ReverseProxy, ServiceMode } from "@/interfaces/ReverseProxy";
import { trim } from "lodash";
import { SERVICE_MODES } from "@/modules/reverse-proxy/ReverseProxyServiceModeSelector";
import Badge from "@components/Badge";
import { cn } from "@utils/helpers";
import { ArrowRightFromLineIcon, GlobeIcon, LockKeyhole } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  reverseProxy?: ReverseProxy;
};

export const ReverseProxyTypeCell = ({ reverseProxy }: Props) => {
  const { t } = useI18n();
  const serviceModeLabel = useMemo(() => {
    if (!reverseProxy?.mode) return "HTTP/S";
    const mode = SERVICE_MODES[reverseProxy.mode];
    if (!mode) return "HTTP/S";
    return trim(
      t(mode.labelKey).replace(` ${t("reverseProxy.serviceSuffix")}`, ""),
    );
  }, [reverseProxy, t]);

  return (
    <div className={"flex"}>
      <Badge variant={"gray"} className={"font-normal"}>
        <ReverseProxyServiceIcon
          reverseProxy={reverseProxy}
          className={"text-neutral-800 dark:text-nb-gray-200"}
          size={11}
        />
        {serviceModeLabel}
      </Badge>
    </div>
  );
};

type ReverseProxyServiceIconProps = {
  reverseProxy?: ReverseProxy;
  className?: string;
  size?: number;
};

export const ReverseProxyServiceIcon = ({
  reverseProxy,
  className,
  size = 14,
}: ReverseProxyServiceIconProps) => {
  const mode = reverseProxy?.mode;

  switch (mode) {
    case ServiceMode.HTTP:
      return <GlobeIcon size={size} className={cn("shrink-0", className)} />;
    case ServiceMode.TLS:
      return <LockKeyhole size={size} className={cn("shrink-0", className)} />;
    case ServiceMode.TCP:
      return (
        <ArrowRightFromLineIcon
          size={size}
          className={cn("shrink-0", className)}
        />
      );
    case ServiceMode.UDP:
      return (
        <ArrowRightFromLineIcon
          size={size}
          className={cn("shrink-0", className)}
        />
      );
    default:
      return <GlobeIcon size={size} className={cn("shrink-0", className)} />;
  }
};
