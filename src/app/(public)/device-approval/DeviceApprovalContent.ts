export type DeviceApprovalCopy = {
  title: string;
  message: string;
  hint: string;
};

export type DeviceApprovalParams = {
  lang?: string | null;
  user?: string | null;
  device?: string | null;
  network?: string | null;
};

export function buildDeviceApprovalCopy(
  params: DeviceApprovalParams,
): DeviceApprovalCopy {
  const isEnglish = params.lang?.toLowerCase().startsWith("en") ?? false;
  const user = params.user || "当前账号";
  const device = params.device || "新设备";
  const network = params.network || "中通快运 VPN";

  return {
    title: isEnglish ? "Device access" : "设备接入",
    message: isEnglish
      ? `New device ${device} for ${user} is joining the ${network} network and needs administrator approval.`
      : `${device} ${user} 接入 ${network}，需要管理员审批。`,
    hint: isEnglish
      ? "Please contact an administrator. After approval, return to the client to check the connection status."
      : "请联系管理员进行审批操作。审批通过后，您可以返回客户端查看接入状态。",
  };
}
