"use client";

import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePermissions } from "@/contexts/PermissionsProvider";
import PageContainer from "@/layouts/PageContainer";
import WorkbenchResourcesPage from "@/modules/workbench/WorkbenchResourcesPage";

export default function WorkbenchPage() {
  const { permission } = usePermissions();

  return (
    <PageContainer>
      <RestrictedAccess page={"工作台"} hasAccess={permission.settings.read}>
        <WorkbenchResourcesPage />
      </RestrictedAccess>
    </PageContainer>
  );
}
