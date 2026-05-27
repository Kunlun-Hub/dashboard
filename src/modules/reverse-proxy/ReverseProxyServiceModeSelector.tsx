import React, { ReactNode, useEffect } from "react";
import {
  isL4Mode as isL4ServiceMode,
  type ReverseProxyDomain,
  ServiceMode,
} from "@/interfaces/ReverseProxy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { ArrowRightFromLine, Globe, LockKeyhole } from "lucide-react";
import { HelpTooltip } from "@components/HelpTooltip";
import { Label } from "@components/Label";
import HelpText from "@components/HelpText";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  value?: ServiceMode;
  onChange: (value: ServiceMode) => void;
  disabled?: boolean;
  domain?: ReverseProxyDomain;
};

type ServiceModeConfig = {
  label: string;
  description: string;
  icon: ReactNode;
};

type ServiceModeStaticConfig = {
  labelKey:
    | "reverseProxy.serviceModeHttp"
    | "reverseProxy.serviceModeTls"
    | "reverseProxy.serviceModeTcp"
    | "reverseProxy.serviceModeUdp";
  descriptionKey:
    | "reverseProxy.serviceModeHttpDescription"
    | "reverseProxy.serviceModeTlsDescription"
    | "reverseProxy.serviceModeTcpDescription"
    | "reverseProxy.serviceModeUdpDescription";
};

export const SERVICE_MODES: Record<ServiceMode, ServiceModeStaticConfig> = {
  [ServiceMode.HTTP]: {
    labelKey: "reverseProxy.serviceModeHttp",
    descriptionKey: "reverseProxy.serviceModeHttpDescription",
  },
  [ServiceMode.TLS]: {
    labelKey: "reverseProxy.serviceModeTls",
    descriptionKey: "reverseProxy.serviceModeTlsDescription",
  },
  [ServiceMode.TCP]: {
    labelKey: "reverseProxy.serviceModeTcp",
    descriptionKey: "reverseProxy.serviceModeTcpDescription",
  },
  [ServiceMode.UDP]: {
    labelKey: "reverseProxy.serviceModeUdp",
    descriptionKey: "reverseProxy.serviceModeUdpDescription",
  },
};

export const ReverseProxyServiceModeSelector = ({
  value,
  onChange,
  disabled,
  domain,
}: Props) => {
  const { t } = useI18n();
  const selected = value ?? ServiceMode.HTTP;
  const serviceModes: Record<ServiceMode, ServiceModeConfig> = {
    [ServiceMode.HTTP]: {
      label: t(SERVICE_MODES[ServiceMode.HTTP].labelKey),
      description: t(SERVICE_MODES[ServiceMode.HTTP].descriptionKey),
      icon: <Globe size={14} />,
    },
    [ServiceMode.TLS]: {
      label: t(SERVICE_MODES[ServiceMode.TLS].labelKey),
      description: t(SERVICE_MODES[ServiceMode.TLS].descriptionKey),
      icon: <LockKeyhole size={14} />,
    },
    [ServiceMode.TCP]: {
      label: t(SERVICE_MODES[ServiceMode.TCP].labelKey),
      description: t(SERVICE_MODES[ServiceMode.TCP].descriptionKey),
      icon: <ArrowRightFromLine size={14} />,
    },
    [ServiceMode.UDP]: {
      label: t(SERVICE_MODES[ServiceMode.UDP].labelKey),
      description: t(SERVICE_MODES[ServiceMode.UDP].descriptionKey),
      icon: <ArrowRightFromLine size={14} />,
    },
  };
  const selectedMode = serviceModes[selected];
  const isL4Supported = domain?.supports_custom_ports === true;

  // Reset to HTTP if the current L4 mode becomes unsupported (e.g. domain changed)
  useEffect(() => {
    if (!isL4Supported && isL4ServiceMode(selected)) {
      onChange(ServiceMode.HTTP);
    }
  }, [isL4Supported, selected, onChange]);

  return (
    <div className="flex justify-between items-center gap-10 mt-2">
      <div>
        <Label>{t("reverseProxy.serviceType")}</Label>
        <HelpText>
          {t("reverseProxy.serviceTypeHelp")}
        </HelpText>
      </div>
      <Select
        value={selected}
        onValueChange={(v) => onChange(v as ServiceMode)}
        disabled={disabled}
      >
        <SelectTrigger className="max-w-[240px] min-w-[200px]">
          <div
            className={"flex items-center gap-2 whitespace-nowrap"}
            data-cy={"service-mode-select-button"}
          >
            {selectedMode.icon}
            <SelectValue placeholder={t("reverseProxy.selectServiceType")} />
          </div>
        </SelectTrigger>
        <SelectContent data-cy={"service-mode-selection"}>
          {Object.entries(serviceModes)
            .filter(
              ([mode]) =>
                isL4Supported || !isL4ServiceMode(mode as ServiceMode),
            )
            .map(([mode, config]) => (
              <SelectItem
                key={mode}
                value={mode}
                extra={
                  <HelpTooltip
                    triggerClassName={"ml-[0.01rem]"}
                    align={"center"}
                    side={"right"}
                    content={<>{config.description}</>}
                  />
                }
              >
                <span className="whitespace-nowrap">{config.label}</span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};
