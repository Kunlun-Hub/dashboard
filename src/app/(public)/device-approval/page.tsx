import type { Metadata } from "next";
import DeviceApprovalClient from "./DeviceApprovalClient";

export const metadata: Metadata = {
  title: "设备接入 - Cloink",
};

export default function DeviceApprovalPage() {
  return <DeviceApprovalClient />;
}
