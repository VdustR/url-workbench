import { describe, expect, it } from "vitest";
import manifestSource from "../../public/manifest.webmanifest?raw";

const manifest = JSON.parse(manifestSource) as Record<string, unknown>;

describe("web app manifest", () => {
  it("does not request a PWA orientation lock", () => {
    expect(manifest).not.toHaveProperty("orientation");
  });
});
