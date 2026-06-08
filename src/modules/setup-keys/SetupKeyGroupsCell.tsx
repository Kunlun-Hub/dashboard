import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Group } from "@/interfaces/Group";
import { SetupKey } from "@/interfaces/SetupKey";
import { useI18n } from "@/i18n/I18nProvider";
import GroupsRow from "@/modules/common-table-rows/GroupsRow";

type Props = {
  setupKey: SetupKey;
};
export default function SetupKeyGroupsCell({ setupKey }: Readonly<Props>) {
  const [modal, setModal] = useState(false);
  const { permission } = usePermissions();
  const request = useApiCall<SetupKey>("/setup-keys/" + setupKey.id);
  const { mutate } = useSWRConfig();
  const { t } = useI18n();
  const setupKeyName = setupKey?.name || t("setupKeys.defaultName");
  const handleSave = async (promises: Promise<Group>[]) => {
    const groups = await Promise.all(promises);

    notify({
      title: setupKeyName,
      description: t("setupKeys.groupsSaved"),
      promise: request
        .put({
          name: setupKeyName,
          type: setupKey.type,
          expires_in: setupKey.expires_in,
          revoked: setupKey.revoked,
          auto_groups: groups?.map((group) => group.id) || [],
          usage_limit: setupKey.usage_limit,
          ephemeral: setupKey.ephemeral,
          allow_extra_dns_labels: setupKey.allow_extra_dns_labels,
        })
        .then(() => {
          setModal(false);
          mutate("/setup-keys");
          mutate("/groups");
        }),
      loadingMessage: t("setupKeys.groupsSaving"),
    });
  };

  return (
    permission.groups.read && (
      <GroupsRow
        label={t("setupKeys.autoAssignedGroups")}
        description={t("setupKeys.autoAssignedGroupsDescription")}
        groups={setupKey.auto_groups || []}
        onSave={handleSave}
        hideAllGroup={true}
        disabled={!permission.setup_keys.update}
        showAddGroupButton={permission.setup_keys.update}
        modal={modal}
        setModal={setModal}
        countOnly={true}
      />
    )
  );
}
