import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import DashboardFeatureGuard from "@/components/DashboardFeatureGuard";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Plans - ${globalMetaTitle}`,
};
export default function PlansLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardFeatureGuard feature="billing">{children}</DashboardFeatureGuard>
  );
}
