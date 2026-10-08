import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { profile } from "../src/content/profile";

const root = resolve(import.meta.dirname, "..");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function metaContent(
  html: string,
  attribute: "name" | "property",
  value: string,
): string {
  const match = html.match(
    new RegExp(
      `<meta\\s+${attribute}="${escapeRegExp(value)}"\\s+content="([^"]+)"\\s*/?>`,
    ),
  );
  if (match?.[1] === undefined) {
    throw new Error(`Missing ${attribute}="${value}" metadata.`);
  }
  return match[1];
}

describe("metadata and public assets", () => {
  it("matches profile metadata in index.html", async () => {
    const html = await readFile(resolve(root, "index.html"), "utf8");
    const metadata = profile.metadata;

    expect(html).toContain(`<title>${metadata.title}</title>`);
    expect(metaContent(html, "name", "description")).toBe(metadata.description);
    expect(html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/)?.[1]).toBe(
      metadata.canonicalUrl,
    );
    expect(metaContent(html, "property", "og:type")).toBe(metadata.openGraph.type);
    expect(metaContent(html, "property", "og:title")).toBe(metadata.title);
    expect(metaContent(html, "property", "og:description")).toBe(metadata.description);
    expect(metaContent(html, "property", "og:url")).toBe(metadata.openGraph.url);
    expect(metaContent(html, "property", "og:image")).toBe(metadata.openGraph.imageUrl);
    expect(metaContent(html, "property", "og:image:type")).toBe(
      metadata.openGraph.imageType,
    );
    expect(metaContent(html, "property", "og:image:width")).toBe(
      String(metadata.openGraph.imageWidth),
    );
    expect(metaContent(html, "property", "og:image:height")).toBe(
      String(metadata.openGraph.imageHeight),
    );
    expect(metaContent(html, "property", "og:image:alt")).toBe(
      metadata.openGraph.imageAlt,
    );
    expect(metaContent(html, "name", "twitter:card")).toBe(metadata.twitter.card);
    expect(metaContent(html, "name", "twitter:title")).toBe(metadata.title);
    expect(metaContent(html, "name", "twitter:description")).toBe(metadata.description);
    expect(metaContent(html, "name", "twitter:image")).toBe(metadata.twitter.imageUrl);
    expect(metaContent(html, "name", "twitter:image:alt")).toBe(
      metadata.openGraph.imageAlt,
    );
    expect(metaContent(html, "name", "theme-color")).toBe(metadata.themeColor);
    expect(html).toContain('href="/vladislav-card/favicon.svg"');
    expect(new URL(metadata.openGraph.imageUrl).pathname).toBe(
      "/vladislav-card/og-image.png",
    );
  });

  it("configures the GitHub Pages base and production CSP", async () => {
    const config = await readFile(resolve(root, "vite.config.ts"), "utf8");
    expect(config).toContain('base: "/vladislav-card/"');
    expect(config).toContain("default-src 'self'");
    expect(config).toContain(
      "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
    );
  });

  it("generates an exact 1200 by 630 PNG", async () => {
    const image = await sharp(resolve(root, "public/og-image.png")).metadata();
    expect(image.format).toBe("png");
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
  });
});
