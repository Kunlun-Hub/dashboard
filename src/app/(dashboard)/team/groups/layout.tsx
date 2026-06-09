import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `User Groups - Team - ${globalMetaTitle}`,
};

export default BlankLayout;
