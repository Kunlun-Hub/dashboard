"use client";

import FullScreenLoading from "@components/ui/FullScreenLoading";
import useRedirect from "@hooks/useRedirect";
import React from "react";
import { useDashboardFeatures } from "@/modules/account/useDashboardFeatures";

type Props = {
  feature: "cloud" | "billing" | "agentNetwork";
  children: React.ReactNode;
};

/** Prevent a disabled feature from being reached through a deep link. */
export default function DashboardFeatureGuard({ feature, children }: Props) {
  const features = useDashboardFeatures();
  if (features.loading) return <FullScreenLoading fullScreen={false} />;
  if (!features[feature]) return <Redirect />;
  return <>{children}</>;
}

function Redirect() {
  useRedirect("/peers");
  return <FullScreenLoading fullScreen={false} />;
}
