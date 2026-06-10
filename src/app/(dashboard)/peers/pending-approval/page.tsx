"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { usePortalElement } from "@hooks/usePortalElement";
import React, { lazy, Suspense, useMemo } from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import PeersProvider, { usePeers } from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";

const PeersTable = lazy(() => import("@/modules/peers/PeersTable"));

export default function PendingApprovalPeersPage() {
  const { isRestricted, permission } = usePermissions();

  return (
    <PageContainer>
      {isRestricted || !permission.peers.read ? null : (
        <PeersProvider>
          <PendingApprovalPeersView />
        </PeersProvider>
      )}
    </PageContainer>
  );
}

function PendingApprovalPeersView() {
  const { t } = useI18n();
  const { peers, isLoading: isPeersLoading } = usePeers();
  const { users, isLoading: isUsersLoading } = useUsers();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  const isLoading = isPeersLoading || isUsersLoading;
  const peersWithUser = useMemo(() => {
    if (!peers || !users) return undefined;
    return peers.map((peer) => ({
      ...peer,
      user: users.find((u) => u.id === peer.user_id),
    }));
  }, [peers, users]);

  return (
    <>
      <div className={"p-default py-6"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("peers.title")}
            icon={<PeerIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/peers/pending-approval"}
            label={t("peers.pendingApprovalTitle")}
            active
          />
        </Breadcrumbs>
        <div>
          <h1 ref={headingRef}>{t("peers.pendingApprovalTitle")}</h1>
        </div>
      </div>
      <Suspense fallback={<SkeletonTable />}>
        <PeersTable
          isLoading={isLoading}
          peers={peersWithUser}
          headingTarget={portalTarget}
          kind={"users"}
          pendingOnly
        />
      </Suspense>
    </>
  );
}
