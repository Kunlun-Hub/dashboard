import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import AppLayout from "@/layouts/AppLayout";

export const metadata: Metadata = {
  title: `${globalMetaTitle}`,
  description:
    "云链 Cloink 将免配置点对点私有网络与集中式访问控制整合到同一个开源平台中。",
};
export default AppLayout;
