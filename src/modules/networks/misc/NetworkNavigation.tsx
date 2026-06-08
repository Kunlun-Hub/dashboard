import SidebarItem from "@components/SidebarItem";
import * as React from "react";
import NetworkRoutesIcon from "@/assets/icons/NetworkRoutesIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";

import { useI18n } from "@/i18n/I18nProvider";

export const NetworkNavigation = () => {
  const { t } = useI18n();
  const { permission } = usePermissions();
  return (
    <SidebarItem
      icon={<NetworkRoutesIcon />}
      label={"Network Routing"}
      collapsible
      visible={permission.networks.read || permission.routes.read}
    >
      <SidebarItem
        label={"Networks"}
        isChild
        href={"/networks"}
        exactPathMatch={true}
        visible={permission.networks.read}
      />
      <SidebarItem
        label={"Routes"}
        isChild
        href={"/network-routes"}
        exactPathMatch={true}
        visible={permission.routes.read}
      />
    </SidebarItem>
  );
};
