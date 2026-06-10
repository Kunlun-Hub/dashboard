import assert from "node:assert/strict";
import test from "node:test";
import {
  pendingPeerApprovalsPath,
  shouldShowPendingPeerApprovalsNavItem,
} from "./Navigation.helpers";

test("pending peer approvals nav item uses the pending approval route", () => {
  assert.equal(pendingPeerApprovalsPath, "/peers/pending-approval");
});

test("pending peer approvals nav item requires unrestricted peer read access", () => {
  assert.equal(
    shouldShowPendingPeerApprovalsNavItem(false, {
      peers: { create: false, read: true, update: false, delete: false },
    }),
    true,
  );

  assert.equal(
    shouldShowPendingPeerApprovalsNavItem(false, {
      peers: { create: false, read: false, update: true, delete: true },
    }),
    false,
  );

  assert.equal(
    shouldShowPendingPeerApprovalsNavItem(true, {
      peers: { create: false, read: true, update: true, delete: true },
    }),
    false,
  );
});
