import { Peer } from "@/interfaces/Peer";
import { Permissions } from "@/interfaces/Permission";

export function shouldShowApprovePeerAction(
  peer: Pick<Peer, "approval_required">,
  permission: Pick<Permissions["modules"], "peers">,
): boolean {
  return !!peer.approval_required && !!permission.peers.update;
}

export function buildApprovePeerPayload(
  peer: Pick<Peer, "name" | "ssh_enabled" | "login_expiration_enabled">,
) {
  return {
    name: peer.name,
    ssh: peer.ssh_enabled,
    loginExpiration: peer.login_expiration_enabled,
    approval_required: false,
  };
}
