import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { profile } from "../src/content/profile";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const copy = profile.metadata.imageCopy;
const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0e0f13"/>
  <rect x="72" y="72" width="1056" height="486" rx="32" fill="#161820"
    stroke="#2a2e3a" stroke-width="2"/>
  <rect x="112" y="112" width="88" height="8" rx="4" fill="#3ddc97"/>
  <circle cx="1064" cy="116" r="16" fill="#a78bfa"/>
  <text x="112" y="218" fill="#e7e9ee" font-family="system-ui, sans-serif"
    font-size="68" font-weight="600">${escapeXml(copy.name)}</text>
  <text x="112" y="304" fill="#a78bfa" font-family="system-ui, sans-serif"
    font-size="42" font-weight="600">${escapeXml(copy.tagline)}</text>
  <text x="112" y="406" fill="#9aa0ad" font-family="system-ui, sans-serif"
    font-size="30" font-weight="400">${escapeXml(copy.identity)}</text>
  <text x="112" y="500" fill="#3ddc97" font-family="ui-monospace, monospace"
    font-size="30" font-weight="600">${escapeXml(copy.contact)}</text>
</svg>`;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "public", "og-image.png");

await mkdir(dirname(outputPath), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(outputPath);
