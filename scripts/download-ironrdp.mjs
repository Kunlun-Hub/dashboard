import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const repo = "netbirdio/IronRDP";
const requiredAssets = [
  "ironrdp_web.d.ts",
  "ironrdp_web.js",
  "ironrdp_web_bg.wasm",
  "ironrdp_web_bg.wasm.d.ts",
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "ironrdp-pkg");
const force = process.env.IRONRDP_FORCE_DOWNLOAD === "1";
const tag = process.env.IRONRDP_RELEASE_TAG;

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function download(url, destination) {
  const response = await fetch(url, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });

  if (!response.ok || !response.body) {
    throw new Error(`failed to download ${url}: ${response.status}`);
  }

  await mkdir(dirname(destination), { recursive: true });
  await pipeline(response.body, createWriteStream(destination));
}

async function main() {
  const missingAssets = [];
  for (const assetName of requiredAssets) {
    const assetPath = join(outputDir, assetName);
    if (force || !(await exists(assetPath))) {
      missingAssets.push(assetName);
    }
  }

  if (missingAssets.length === 0) {
    console.log("IronRDP package already exists in public/ironrdp-pkg");
    return;
  }

  const releaseUrl = tag
    ? `https://api.github.com/repos/${repo}/releases/tags/${tag}`
    : `https://api.github.com/repos/${repo}/releases/latest`;
  const release = await fetchJson(releaseUrl);
  const assets = new Map(
    release.assets.map((asset) => [asset.name, asset.browser_download_url]),
  );

  for (const assetName of requiredAssets) {
    const url = assets.get(assetName);
    if (!url) {
      throw new Error(`IronRDP release ${release.tag_name} is missing ${assetName}`);
    }

    const assetPath = join(outputDir, assetName);
    if (!force && (await exists(assetPath))) {
      continue;
    }

    console.log(`Downloading ${assetName} from ${release.tag_name}`);
    await download(url, assetPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
