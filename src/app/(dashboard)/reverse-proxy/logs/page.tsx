"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import dayjs from "dayjs";
import ReverseProxyIcon from "@/assets/icons/ReverseProxyIcon";
import React, { useMemo } from "react";
import PeersProvider from "@/contexts/PeersProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import ServerPaginationProvider from "@/contexts/ServerPaginationProvider";
import PageContainer from "@/layouts/PageContainer";
import ReverseProxyEventsTable from "@/modules/reverse-proxy/events/ReverseProxyEventsTable";
import { usePortalElement } from "@hooks/usePortalElement";
import { useI18n } from "@/i18n/I18nProvider";

export default function ProxyLogsPage() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  const defaultFilters = useMemo(
    () => ({
      start_date: dayjs().subtract(7, "day").startOf("day").toISOString(),
      end_date: dayjs().endOf("day").toISOString(),
      sort_by: "timestamp",
      sort_order: "desc",
    }),
    [],
  );

  return (
    <PageContainer>
      <div className="p-default py-6">
        <Breadcrumbs>
          <Breadcrumbs.Item
            label={t("nav.reverseProxy")}
            disabled
            icon={<ReverseProxyIcon size={15} />}
          />
          <Breadcrumbs.Item
            href="/reverse-proxy/logs"
            label={t("reverseProxy.accessLogs")}
            icon={<ReverseProxyIcon size={15} />}
          />
        </Breadcrumbs>

        <h1 ref={headingRef}>{t("reverseProxy.accessLogs")}</h1>
      </div>

      <RestrictedAccess
        page={t("reverseProxy.accessLogs")}
        hasAccess={permission?.services?.read}
      >
        <ServerPaginationProvider
          url="/events/proxy"
          defaultPageSize={25}
          defaultFilters={defaultFilters}
        >
          <PeersProvider>
            <ReverseProxyEventsTable headingTarget={portalTarget} />
          </PeersProvider>
        </ServerPaginationProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
