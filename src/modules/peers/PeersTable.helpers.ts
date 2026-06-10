import { Peer } from "@/interfaces/Peer";

export type PeersTableKind = "users" | "servers";

export type PeersTablePermissionSnapshot = {
  groups: {
    read?: boolean;
  };
  peers: {
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
};

export function canShowPeerActions(
  permission: PeersTablePermissionSnapshot,
): boolean {
  return !!(
    permission.peers.read ||
    permission.peers.update ||
    permission.peers.delete
  );
}

export function getPeersTableColumnVisibility(
  permission: PeersTablePermissionSnapshot,
  pendingOnly = false,
): Record<string, boolean> {
  return {
    select: !pendingOnly && !!permission.groups.read,
    connected: false,
    search_index: false,
    owner: pendingOnly,
    approval_required: false,
    group_name_strings: false,
    group_names: false,
    ip: false,
    serial: false,
    user_name: false,
    user_email: false,
    actions: canShowPeerActions(permission),
    groups: !!permission.groups.read,
    os: false,
    os_kind: false,
    ipv6: false,
  };
}

export function shouldShowPeerMultiSelect(pendingOnly = false): boolean {
  return !pendingOnly;
}

export function shouldShowAddPeerButton(
  peers: Peer[] | undefined,
  pendingOnly = false,
): boolean {
  return !pendingOnly && !!peers?.length;
}

export function shouldShowPendingApprovalFilter(
  pendingApprovalCount: number,
  pendingOnly = false,
): boolean {
  return !pendingOnly && pendingApprovalCount > 0;
}

// Peers split into two kinds:
//   users   - owner is a real (non-service) user, typically added via SSO
//   servers - no owner, or owner is a service user, typically enrolled via setup key
export function matchesPeerKind(peer: Peer, kind?: PeersTableKind) {
  if (!kind) return true;
  const hasRealUser = !!peer.user && !peer.user.is_service_user;
  return kind === "users" ? hasRealUser : !hasRealUser;
}

export function filterPeersForTable(
  peers: Peer[] | undefined,
  kind?: PeersTableKind,
  pendingOnly = false,
) {
  const filtered = peers?.filter((peer) => matchesPeerKind(peer, kind));
  return pendingOnly
    ? filtered?.filter((peer) => peer.approval_required)
    : filtered;
}

export function peerSearchIndex(peer: Peer) {
  return [
    peer.name,
    peer.hostname,
    peer.dns_label,
    peer.ip,
    peer.ipv6,
    peer.serial_number,
    peer.user?.name,
    peer.user?.email,
    ...(peer.groups?.map((group) => group?.name) ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}
