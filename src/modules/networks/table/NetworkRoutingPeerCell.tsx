import Badge from "@components/Badge";
import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Network } from "@/interfaces/Network";
import { useAccountEntitlements } from "@/modules/account/useAccountEntitlements";
import { navigateToNetwork } from "@/modules/networks/networkNavigation";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";

type Props = {
  network: Network;
};
export default function NetworkRoutingPeerCell({ network }: Props) {
  const { t } = useI18n();
  const { permission } = usePermissions();
  const { isFeatureEnabled } = useAccountEntitlements();
  const highAvailabilityEnabled = isFeatureEnabled("ha_routes");
  const router = useRouter();
  const disabledText = useMemo(
    () => (
      <>
        {t("networkDetails.highAvailabilityInactivePrefix")}{" "}
        <span className={"text-yellow-600 dark:text-yellow-400 font-medium"}>
          {t("networkDetails.inactive")}
        </span>{" "}
        {t("networkDetails.highAvailabilitySuffix")}
      </>
    ),
    [t],
  );

  const enabledText = useMemo(
    () => (
      <>
        {t("networkDetails.highAvailabilityActivePrefix")}{" "}
        <span className={"text-emerald-600 dark:text-green-500 font-medium"}>
          {t("networkDetails.active")}
        </span>{" "}
        {t("networkDetails.highAvailabilitySuffix")}
      </>
    ),
    [t],
  );

  const lockedText = useMemo(
    () => (
      <>
        {t("networkDetails.highAvailability")}{" "}
        <span className={"text-neutral-500 dark:text-nb-gray-300 font-medium"}>
          {t("networkDetails.highAvailabilityLocked")}
        </span>
      </>
    ),
    [t],
  );

  const { openAddRoutingPeerModal } = useNetworksContext();

  const isHighlyAvailable = !!(
    network?.routing_peers_count && network.routing_peers_count >= 2
  );
  const isActive = !!(
    network?.routing_peers_count && network.routing_peers_count > 0
  );
  const highAvailabilityLocked =
    !highAvailabilityEnabled && (network?.routing_peers_count ?? 0) > 0;

  return (
    <div className={"flex gap-3 items-center"}>
      <FullTooltip
        interactive={false}
        content={
          <div className={"max-w-xs text-xs"}>
            <>
              {!highAvailabilityEnabled
                ? lockedText
                : isHighlyAvailable
                ? enabledText
                : disabledText}
              {!highAvailabilityEnabled ? (
                <div className={"inline-flex mt-2"}>
                  {t("networkDetails.highAvailabilityLockedHelp")}
                </div>
              ) : isHighlyAvailable ? (
                <div className={"inline-flex mt-2"}>
                  {t("networkDetails.highAvailabilityEnabledHelp")}
                </div>
              ) : (
                <div className={"inline-flex mt-2"}>
                  {t("networkDetails.highAvailabilityDisabledHelp")}
                </div>
              )}
            </>
          </div>
        }
      >
        {isActive && (
          <Badge
            variant={isHighlyAvailable ? "green" : "gray"}
            className={cn(
              "inline-flex gap-2  min-w-[110px] font-medium items-center justify-center min-h-[34px] cursor-pointer",
            )}
            onClick={() =>
              navigateToNetwork(router, {
                id: network.id,
                tab: "routing-peers",
              })
            }
            useHover={true}
          >
            <>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  !highAvailabilityEnabled
                    ? "bg-neutral-400 dark:bg-nb-gray-500"
                    : isHighlyAvailable
                    ? "bg-emerald-500 dark:bg-green-500"
                    : "bg-yellow-500 dark:bg-yellow-400",
                )}
              ></div>
              {!highAvailabilityEnabled ? (
                t("networkDetails.highAvailabilityLocked")
              ) : (
                <>
                  {network?.routing_peers_count &&
                    network.routing_peers_count}{" "}
                  {t("networkRouting.peer")}
                </>
              )}
            </>

            <HelpCircle size={12} />
          </Badge>
        )}
      </FullTooltip>
      <Button
        size={"xs"}
        variant={"secondary"}
        className={"min-w-[130px]"}
        onClick={() => openAddRoutingPeerModal(network)}
        disabled={!permission.networks.update || highAvailabilityLocked}
        title={
          highAvailabilityLocked
            ? t("networkDetails.highAvailabilityLockedHelp")
            : undefined
        }
      >
        <PlusCircle size={12} />
        {t("networkRouting.add")}
      </Button>
    </div>
  );
}
