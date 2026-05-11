import Badge from "@components/Badge";
import Button from "@components/Button";
import { LayersIcon, PlusCircle } from "lucide-react";
import * as React from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Network } from "@/interfaces/Network";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";

type Props = {
  network: Network;
};

export const NetworkResourceCell = ({ network }: Props) => {
  const { t } = useI18n();
  const { permission } = usePermissions();

  const { openResourceModal } = useNetworksContext();

  const hasResources = network?.resources && network?.resources?.length > 0;
  const count = network?.resources?.length || 0;

  return hasResources ? (
    <div className={"flex gap-3"}>
      <a href={`/network?id=${network.id}`} className={"inline-flex"}>
        <Badge variant={"gray"} useHover={true} className={"cursor-pointer"}>
          <LayersIcon size={14} />
          <div>
            <span className={"font-medium text-xs"}>{count}</span>
          </div>
        </Badge>
      </a>
      <Button
        size={"xs"}
        variant={"secondary"}
        className={"min-w-[130px]"}
        onClick={() => openResourceModal(network)}
        disabled={!permission.networks.update}
      >
        <PlusCircle size={12} />
        {t("networks.addResource")}
      </Button>
    </div>
  ) : (
    <>
      <Button
        size={"xs"}
        variant={"secondary"}
        className={"min-w-[130px]"}
        onClick={() => openResourceModal(network)}
      >
        <PlusCircle size={12} />
        {t("networks.addResource")}
      </Button>
    </>
  );
};
