import { Permissions } from "@/interfaces/Permission";

export const pendingPeerApprovalsPath = "/peers/pending-approval";

export function shouldShowPendingPeerApprovalsNavItem(
  isRestricted: boolean,
  permission: Pick<Permissions["modules"], "peers">,
): boolean {
  return !isRestricted && !!permission.peers.read;
}
