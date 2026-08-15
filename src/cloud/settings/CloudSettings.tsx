"use client";

import * as React from "react";
import {
  PlansAndBillingTab,
  PlansAndBillingTabTrigger,
} from "@/modules/billing/PlansAndBillingTab";
import { InvoicesTab, InvoicesTabTrigger } from "@/cloud/invoices/InvoicesTab";
import {
  NotificationsTabTrigger,
  NotificationTab,
} from "@/cloud/notifications/NotificationTab";
import { useDashboardFeatures } from "@/modules/account/useDashboardFeatures";

export const CloudSettingsTabContent = () => {
  const { billing } = useDashboardFeatures();
  if (!billing) return null;
  return (
    <>
      <NotificationTab />
      <PlansAndBillingTab />
      <InvoicesTab />
    </>
  );
};

export const CloudSettingsTabTrigger = () => {
  const { billing } = useDashboardFeatures();
  if (!billing) return null;
  return (
    <>
      <NotificationsTabTrigger />
      <PlansAndBillingTabTrigger />
      <InvoicesTabTrigger />
    </>
  );
};
