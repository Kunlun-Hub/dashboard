import assert from "node:assert/strict";
import test from "node:test";
import { GroupType } from "@/interfaces/Group";
import { Peer } from "@/interfaces/Peer";
import { Role } from "@/interfaces/User";
import {
  canShowPeerActions,
  filterPeersForTable,
  getPeersTableColumnVisibility,
  matchesPeerKind,
  peerSearchIndex,
  shouldShowAddPeerButton,
  shouldShowPeerMultiSelect,
  shouldShowPendingApprovalFilter,
} from "./PeersTable.helpers";

function peer(overrides: Partial<Peer>): Peer {
  return {
    id: "peer-id",
    name: "device-a",
    ip: "100.64.0.10",
    connected: false,
    last_seen: new Date("2026-06-09T00:00:00Z"),
    os: "linux",
    version: "1.0.0",
    ssh_enabled: false,
    hostname: "device-a",
    dns_label: "device-a",
    last_login: new Date("2026-06-09T00:00:00Z"),
    login_expired: false,
    login_expiration_enabled: true,
    inactivity_expiration_enabled: true,
    approval_required: false,
    city_name: "",
    country_code: "",
    connection_ip: "",
    serial_number: "serial-a",
    ephemeral: false,
    ...overrides,
  };
}

const realUser = {
  id: "user-a",
  email: "alice@example.com",
  name: "Alice Admin",
  role: Role.User,
  status: "active",
  auto_groups: [],
  user_groups: [],
  permissions: {},
};

const serviceUser = {
  ...realUser,
  id: "service-user",
  email: "svc@example.com",
  name: "Service User",
  is_service_user: true,
};

test("matchesPeerKind separates user devices from servers", () => {
  assert.equal(matchesPeerKind(peer({ user: realUser }), "users"), true);
  assert.equal(matchesPeerKind(peer({ user: serviceUser }), "users"), false);
  assert.equal(matchesPeerKind(peer({ user: serviceUser }), "servers"), true);
  assert.equal(matchesPeerKind(peer({ user: undefined }), "servers"), true);
});

test("filterPeersForTable returns only pending user devices for approvals page", () => {
  const pendingUserDevice = peer({
    id: "pending-user-device",
    approval_required: true,
    user: realUser,
  });
  const approvedUserDevice = peer({
    id: "approved-user-device",
    approval_required: false,
    user: realUser,
  });
  const pendingServer = peer({
    id: "pending-server",
    approval_required: true,
    user: serviceUser,
  });

  assert.deepEqual(
    filterPeersForTable(
      [pendingUserDevice, approvedUserDevice, pendingServer],
      "users",
      true,
    )?.map((p) => p.id),
    ["pending-user-device"],
  );
});

test("peerSearchIndex includes device and user fields", () => {
  const searchIndex = peerSearchIndex(
    peer({
      name: "MacBook-Pro",
      hostname: "macbook-pro.local",
      dns_label: "macbook-pro",
      ip: "100.64.0.20",
      ipv6: "fd00::20",
      serial_number: "serial-mbp",
      user: realUser,
      groups: [{ id: "group-a", name: "Finance", type: GroupType.PEER }],
    }),
  );

  assert.match(searchIndex, /MacBook-Pro/);
  assert.match(searchIndex, /macbook-pro.local/);
  assert.match(searchIndex, /100\.64\.0\.20/);
  assert.match(searchIndex, /fd00::20/);
  assert.match(searchIndex, /Alice Admin/);
  assert.match(searchIndex, /alice@example\.com/);
  assert.match(searchIndex, /Finance/);
});

test("pending approval table shows owner and actions but disables bulk and add flows", () => {
  const permission = {
    groups: { read: true },
    peers: { read: true, update: false, delete: true },
  };
  const visibility = getPeersTableColumnVisibility(permission, true);

  assert.equal(visibility.owner, true);
  assert.equal(visibility.actions, true);
  assert.equal(visibility.select, false);
  assert.equal(visibility.groups, true);
  assert.equal(shouldShowPeerMultiSelect(true), false);
  assert.equal(shouldShowAddPeerButton([peer({})], true), false);
  assert.equal(shouldShowPendingApprovalFilter(3, true), false);
});

test("regular peers table keeps add, bulk select, and pending filter controls", () => {
  const permission = {
    groups: { read: true },
    peers: { read: false, update: true, delete: false },
  };
  const visibility = getPeersTableColumnVisibility(permission, false);

  assert.equal(visibility.owner, false);
  assert.equal(visibility.actions, true);
  assert.equal(visibility.select, true);
  assert.equal(shouldShowPeerMultiSelect(false), true);
  assert.equal(shouldShowAddPeerButton([peer({})], false), true);
  assert.equal(shouldShowPendingApprovalFilter(1, false), true);
});

test("peer actions are visible when any peer operation permission is available", () => {
  assert.equal(
    canShowPeerActions({
      groups: { read: false },
      peers: { read: false, update: false, delete: false },
    }),
    false,
  );
  assert.equal(
    canShowPeerActions({
      groups: { read: false },
      peers: { read: true, update: false, delete: false },
    }),
    true,
  );
  assert.equal(
    canShowPeerActions({
      groups: { read: false },
      peers: { read: false, update: false, delete: true },
    }),
    true,
  );
});
