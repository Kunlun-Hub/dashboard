export function getAccountPeerApprovalActivityKey(activityCode: string) {
  if (activityCode === "account.setting.peer.approval.enable") {
    return "activity.accountPeerApprovalEnabled";
  }
  if (activityCode === "account.setting.peer.approval.disable") {
    return "activity.accountPeerApprovalDisabled";
  }
  return undefined;
}

export function getPeerApprovalActivityActorKey(activityCode: string) {
  if (activityCode === "peer.approve") {
    return "activity.peerApproveActor";
  }
  if (activityCode === "peer.approval.revoke") {
    return "activity.peerApprovalRevokeActor";
  }
  return undefined;
}
