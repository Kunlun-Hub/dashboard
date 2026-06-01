import { globalMetaTitle } from "@utils/meta";
import type { Metadata, Viewport } from "next";
import AppLayout from "@/layouts/AppLayout";

export const metadata: Metadata = {
  title: `${globalMetaTitle}`,
  description:
    "云链 Cloink 将免配置点对点私有网络与集中式访问控制整合到同一个开源平台中。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#181a1d" },
  ],
};

export default AppLayout;
