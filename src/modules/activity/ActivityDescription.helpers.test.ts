import assert from "node:assert/strict";
import test from "node:test";
import {
  getAccountPeerApprovalActivityKey,
  getPeerApprovalActivityActorKey,
} from "./ActivityDescription.helpers";

test("maps account peer approval activity codes to translation keys", () => {
  assert.equal(
    getAccountPeerApprovalActivityKey("account.setting.peer.approval.enable"),
    "activity.accountPeerApprovalEnabled",
  );
  assert.equal(
    getAccountPeerApprovalActivityKey("account.setting.peer.approval.disable"),
    "activity.accountPeerApprovalDisabled",
  );
  assert.equal(getAccountPeerApprovalActivityKey("peer.approve"), undefined);
});

test("maps peer approval activity codes to actor translation keys", () => {
  assert.equal(
    getPeerApprovalActivityActorKey("peer.approve"),
    "activity.peerApproveActor",
  );
  assert.equal(
    getPeerApprovalActivityActorKey("peer.approval.revoke"),
    "activity.peerApprovalRevokeActor",
  );
  assert.equal(getPeerApprovalActivityActorKey("peer.rename"), undefined);
});
