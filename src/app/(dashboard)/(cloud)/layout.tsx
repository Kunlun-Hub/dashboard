import type { ReactNode } from "react";
import DashboardFeatureGuard from "@/components/DashboardFeatureGuard";

export default function CloudLayout({ children }: { children: ReactNode }) {
  return <DashboardFeatureGuard feature="cloud">{children}</DashboardFeatureGuard>;
}
