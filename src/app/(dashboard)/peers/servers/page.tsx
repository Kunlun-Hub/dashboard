"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { usePortalElement } from "@hooks/usePortalElement";
import { ExternalLinkIcon } from "lucide-react";
import React, { lazy, Suspense, useMemo } from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import PeersProvider, { usePeers } from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { useI18n } from "@/i18n/I18nProvider";
import PageContainer from "@/layouts/PageContainer";
import { ResourceUsageInline } from "@/modules/account/ResourceUsage";
import { SetupModalContent } from "@/modules/setup-netbird-modal/SetupModal";

const PeersTable = lazy(() => import("@/modules/peers/PeersTable"));

export default function ServersPage() {
  const { isRestricted } = usePermissions();

  return (
    <PageContainer>
      {isRestricted ? (
        <ServersBlockedView />
      ) : (
        <PeersProvider>
          <ServersView />
        </PeersProvider>
      )}
    </PageContainer>
  );
}

function ServersView() {
  const { t } = useI18n();
  const { peers, isLoading: isPeersLoading } = usePeers();
  const { users, isLoading: isUsersLoading } = useUsers();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  // The kind filter classifies peers by whether their owner is a real
  // user vs a service/no-user, so we must wait until both peers and
  // users have loaded before joining them — otherwise peers temporarily
  // render with peer.user === undefined and get misclassified.
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
            href={"/peers/servers"}
            label={t("peers.servers")}
            active
          />
        </Breadcrumbs>
        <div
          className={
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <div>
            <h1 ref={headingRef}>{t("peers.servers")}</h1>
            <Paragraph>
              {t("peers.serversDescription")}{" "}
              <InlineLink
                href={
                  "https://docs.netbird.io/how-to/register-machines-using-setup-keys"
                }
                target={"_blank"}
              >
                {t("common.learnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <ResourceUsageInline
            limit={"peers"}
            className={"sm:min-w-[18rem]"}
          />
        </div>
      </div>
      <Suspense fallback={<SkeletonTable />}>
        <PeersTable
          isLoading={isLoading}
          peers={peersWithUser}
          headingTarget={portalTarget}
          kind={"servers"}
        />
      </Suspense>
    </>
  );
}

function ServersBlockedView() {
  const { t } = useI18n();

  return (
    <div className={"flex items-center justify-center flex-col"}>
      <div className={"p-default py-6 max-w-3xl text-center"}>
        <h1>{t("peers.serversBlockedTitle")}</h1>
        <Paragraph className={"inline"}>
          {t("peers.serversBlockedDescription")}{" "}
          <InlineLink
            href={"https://docs.netbird.io/how-to/getting-started#installation"}
            target={"_blank"}
          >
            {t("peers.installationGuide")}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </Paragraph>
      </div>
      <div className={"px-3 pt-1 pb-8 max-w-3xl w-full"}>
        <div
          className={
            "rounded-md border border-neutral-200 bg-white grid w-full stepper-bg-variant dark:border-nb-gray-900/70 dark:bg-nb-gray-930/40"
          }
        >
          <SetupModalContent header={false} footer={false} isUserDevice={false} />
        </div>
      </div>
    </div>
  );
}
