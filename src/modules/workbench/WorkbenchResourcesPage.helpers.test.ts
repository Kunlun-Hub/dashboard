import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWorkbenchResourcePathSuffix,
  cleanIDList,
  isValidWorkbenchHTTPURL,
  normalizedWorkbenchAssetPath,
  safeWorkbenchIconDisplayURL,
  stringListValue,
  textValue,
  workbenchAssetPath,
} from "./WorkbenchResourcesPage.helpers";

test("workbench helpers normalize text and string lists from dirty values", () => {
  assert.equal(textValue("  企业门户  "), "企业门户");
  assert.equal(textValue(42), "");
  assert.deepEqual(cleanIDList([" group-1 ", "", "group-1", "group-2"]), [
    "group-1",
    "group-2",
  ]);
  assert.deepEqual(cleanIDList("group-1"), []);
  assert.deepEqual(stringListValue(undefined), []);
});

test("workbench helper accepts only valid http and https URLs", () => {
  assert.equal(isValidWorkbenchHTTPURL("https://portal.example.com"), true);
  assert.equal(isValidWorkbenchHTTPURL("HTTP://portal.example.com"), true);
  assert.equal(isValidWorkbenchHTTPURL("javascript:alert(1)"), false);
  assert.equal(isValidWorkbenchHTTPURL("https://"), false);
});

test("workbench helper builds encoded resource path suffixes", () => {
  assert.equal(buildWorkbenchResourcePathSuffix(" server/1 "), "/server%2F1");
  assert.equal(buildWorkbenchResourcePathSuffix(""), "");
  assert.equal(buildWorkbenchResourcePathSuffix(undefined), "");
});

test("workbench asset path helpers normalize protected asset URLs", () => {
  assert.equal(normalizedWorkbenchAssetPath("/api/workbench/assets/icon-1"), "/workbench/assets/icon-1");
  assert.equal(normalizedWorkbenchAssetPath("/management/api/workbench/assets/icon-2"), "/workbench/assets/icon-2");
  assert.equal(normalizedWorkbenchAssetPath("api/workbench/assets/icon-3"), "/workbench/assets/icon-3");
  assert.equal(workbenchAssetPath("https://host/management/api/workbench/assets/icon-4"), "/workbench/assets/icon-4");
  assert.equal(workbenchAssetPath("https://cdn.example.com/icon.png"), "");
});

test("workbench icon display helper allows only safe renderable URLs", () => {
  assert.equal(safeWorkbenchIconDisplayURL("https://cdn.example.com/icon.png"), "https://cdn.example.com/icon.png");
  assert.equal(safeWorkbenchIconDisplayURL("data:image/png;base64,abc"), "data:image/png;base64,abc");
  assert.equal(safeWorkbenchIconDisplayURL("blob:https://dashboard/icon"), "blob:https://dashboard/icon");
  assert.equal(safeWorkbenchIconDisplayURL("javascript:alert(1)"), "");
  assert.equal(safeWorkbenchIconDisplayURL("file:///tmp/icon.png"), "");
});
