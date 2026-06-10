import assert from "node:assert/strict";
import test from "node:test";
import { buildDeviceApprovalCopy } from "./DeviceApprovalContent";

test("buildDeviceApprovalCopy renders Chinese query parameters", () => {
  const copy = buildDeviceApprovalCopy({
    user: "test@example.com",
    device: "test-device",
    network: "test-vpn",
  });

  assert.equal(copy.title, "设备接入");
  assert.equal(
    copy.message,
    "test-device test@example.com 接入 test-vpn，需要管理员审批。",
  );
  assert.equal(
    copy.hint,
    "请联系管理员进行审批操作。审批通过后，您可以返回客户端查看接入状态。",
  );
});

test("buildDeviceApprovalCopy renders English query parameters", () => {
  const copy = buildDeviceApprovalCopy({
    lang: "en-US",
    user: "test@example.com",
    device: "test-device",
    network: "test-vpn",
  });

  assert.equal(copy.title, "Device access");
  assert.equal(
    copy.message,
    "New device test-device for test@example.com is joining the test-vpn network and needs administrator approval.",
  );
  assert.equal(
    copy.hint,
    "Please contact an administrator. After approval, return to the client to check the connection status.",
  );
});

test("buildDeviceApprovalCopy falls back to default values", () => {
  const copy = buildDeviceApprovalCopy({});

  assert.equal(copy.title, "设备接入");
  assert.equal(copy.message, "新设备 当前账号 接入 中通快运 VPN，需要管理员审批。");
});
