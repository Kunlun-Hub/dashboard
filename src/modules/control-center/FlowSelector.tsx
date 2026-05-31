import { SegmentedTabs } from "@components/SegmentedTabs";
import {
  FolderGit2,
  MonitorSmartphoneIcon,
  NetworkIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

export enum FlowView {
  NETWORKS = "networks",
  GROUPS = "groups",
  PEERS = "peers",
  USERS = "users",
}

type Props = {
  value?: FlowView;
  onChange?: (value: FlowView) => void;
};

export const FlowSelector = ({ value, onChange }: Props) => {
  const { t } = useI18n();

  return (
    <SegmentedTabs value={value} onChange={(v) => onChange?.(v as FlowView)}>
      <SegmentedTabs.List
        className={
          "border-b rounded-b-lg text-sm font-medium bg-white p-1 dark:bg-nb-gray-930"
        }
      >
        <SegmentedTabs.Trigger
          value={FlowView.PEERS}
          className={"text-xs px-3 py-1"}
        >
          <MonitorSmartphoneIcon size={12} />
          {t("peers.title")}
        </SegmentedTabs.Trigger>
        <SegmentedTabs.Trigger
          value={FlowView.USERS}
          className={"text-xs px-3 py-1"}
        >
          <UsersIcon size={12} />
          {t("users.title")}
        </SegmentedTabs.Trigger>
        <SegmentedTabs.Trigger
          value={FlowView.GROUPS}
          className={"text-xs px-3 py-1"}
        >
          <FolderGit2 size={12} />
          {t("groups.title")}
        </SegmentedTabs.Trigger>
        <SegmentedTabs.Trigger
          value={FlowView.NETWORKS}
          className={"text-xs px-3 py-[0.45rem]"}
        >
          <NetworkIcon size={12} />
          {t("networks.title")}
        </SegmentedTabs.Trigger>
      </SegmentedTabs.List>
    </SegmentedTabs>
  );
};
