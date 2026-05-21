import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `自托管代理 - 反向代理 - ${globalMetaTitle}`,
};
export default BlankLayout;
