import { notify } from "@components/Notification";
import { ToggleSwitch } from "@components/ToggleSwitch";
import { useApiCall } from "@utils/api";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { NameserverGroup } from "@/interfaces/Nameserver";

type Props = {
  ns: NameserverGroup;
};
export default function NameserverActiveCell({ ns }: Readonly<Props>) {
  const nsRequest = useApiCall<NameserverGroup>("/dns/nameservers");
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const { t } = useI18n();

  const update = async (enabled: boolean) => {
    notify({
      title: ns.name,
      description: t("nameservers.updateToggleDescription", {
        status: enabled ? t("common.on") : t("common.off"),
      }),
      loadingMessage: t("nameservers.updating"),
      promise: nsRequest
        .put(
          {
            name: ns.name,
            description: ns.description,
            nameservers: ns.nameservers,
            enabled: enabled,
            groups: ns.groups,
            primary: ns.primary,
            domains: ns.domains,
            search_domains_enabled: ns.search_domains_enabled,
          },
          `/${ns?.id}`,
        )
        .then(() => {
          mutate("/dns/nameservers");
        }),
    });
  };

  const isChecked = useMemo(() => {
    return ns.enabled;
  }, [ns]);

  return (
    <div className={"flex"}>
      <ToggleSwitch
        disabled={!permission.nameservers.update}
        checked={isChecked}
        size={"small"}
        onClick={() => update(!isChecked)}
      />
    </div>
  );
}
