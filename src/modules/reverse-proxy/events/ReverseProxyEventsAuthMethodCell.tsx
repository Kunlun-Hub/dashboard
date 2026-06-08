import Badge from "@components/Badge";
import FullTooltip from "@components/FullTooltip";
import {
  Braces,
  Flag,
  GlobeOff,
  Link2,
  Network,
  ShieldAlert,
  ShieldOff,
  Users,
} from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { ReverseProxyEvent } from "@/interfaces/ReverseProxy";

type Props = {
  event: ReverseProxyEvent;
  compact?: boolean;
};

export const ReverseProxyEventsAuthMethodCell = ({
  event,
  compact = false,
}: Props) => {
  const { t } = useI18n();
  const authMethod = event.auth_method_used;

  if (!authMethod) {
    if (compact) return null;
    return <span className="text-nb-gray-400 text-sm px-3 py-2">-</span>;
  }

  const getAuthMethodDisplay = () => {
    switch (authMethod.toLowerCase()) {
      case "oidc":
      case "sso":
      case "bearer":
        return {
          icon: <Users size={12} />,
          label: t("reverseProxy.authMethodSso"),
        };
      case "password":
        return {
          icon: (
            <span
              className={
                "font-mono text-[9px] font-medium tracking-wider leading-none px-1 py-0.5 rounded border border-current"
              }
            >
              PWD
            </span>
          ),
          label: "Password",
        };
      case "pin":
        return {
          icon: (
            <span
              className={
                "font-mono text-[9px] font-medium tracking-wider leading-none px-1 py-0.5 rounded border border-current"
              }
            >
              PIN
            </span>
          ),
          label: "PIN Code",
        };
      case "header":
        return {
          icon: <Braces size={12} />,
          label: "HTTP Headers",
        };
      case "link":
      case "magic_link":
      case "magic-link":
        return {
          icon: <Link2 size={12} />,
          label: "Magic Link",
        };
      case "ip_restricted":
        return {
          icon: <Network size={12} />,
          label: t("reverseProxy.authMethodIpRestricted"),
        };
      case "country_restricted":
        return {
          icon: <Flag size={12} />,
          label: t("reverseProxy.authMethodCountryRestricted"),
        };
      case "geo_unavailable":
        return {
          icon: <GlobeOff size={12} />,
          label: t("reverseProxy.authMethodGeoUnavailable"),
        };
      case "crowdsec_ban":
        return {
          icon: <ShieldAlert size={12} />,
          label: t("reverseProxy.crowdsecBan"),
        };
      case "crowdsec_captcha":
        return {
          icon: <ShieldAlert size={12} />,
          label: t("reverseProxy.crowdsecCaptcha"),
        };
      case "crowdsec_throttle":
        return {
          icon: <ShieldAlert size={12} />,
          label: t("reverseProxy.crowdsecThrottle"),
        };
      case "crowdsec_unavailable":
        return {
          icon: <ShieldOff size={12} />,
          label: t("reverseProxy.crowdsecUnavailable"),
        };
      default:
        return {
          icon: null,
          label: authMethod,
        };
    }
  };

  const { icon, label } = getAuthMethodDisplay();

  if (compact) {
    return (
      <FullTooltip
        interactive={false}
        content={
          <span className={"text-xs"}>
            <span className={"text-nb-gray-400"}>Auth: </span>
            <span className={"text-nb-gray-100"}>{label}</span>
          </span>
        }
      >
        <span
          className={
            "inline-flex items-center justify-center text-nb-gray-300 cursor-help"
          }
        >
          {icon}
        </span>
      </FullTooltip>
    );
  }

  return (
    <div className="px-3 py-2">
      <Badge variant="gray" className="gap-1.5">
        {icon}
        {label}
      </Badge>
    </div>
  );
};
