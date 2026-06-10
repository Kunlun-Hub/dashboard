import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApprovePeerPayload,
  shouldShowApprovePeerAction,
} from "./PeerActionCell.helpers";

test("approve action is visible only for pending peers with update permission", () => {
  assert.equal(
    shouldShowApprovePeerAction(
      { approval_required: false },
      { peers: { create: false, read: true, update: true, delete: false } },
    ),
    false,
  );

  assert.equal(
    shouldShowApprovePeerAction(
      { approval_required: true },
      { peers: { create: false, read: true, update: false, delete: true } },
    ),
    false,
  );

  assert.equal(
    shouldShowApprovePeerAction(
      { approval_required: true },
      { peers: { create: false, read: false, update: true, delete: false } },
    ),
    true,
  );
});

test("approve action payload clears approval while preserving editable peer state", () => {
  assert.deepEqual(
    buildApprovePeerPayload({
      name: "pending-device",
      ssh_enabled: true,
      login_expiration_enabled: false,
    }),
    {
      name: "pending-device",
      ssh: true,
      loginExpiration: false,
      approval_required: false,
    },
  );
});
