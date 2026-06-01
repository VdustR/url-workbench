import { describe, expect, it } from "vitest";
import { decodeShareUrl, encodeShareUrl } from "../../src/domain/share/shareState";
import { defaultSettings, sampleRows } from "../../src/test/fixtures";

describe("share state", () => {
  it("round trips target URL, row order, disabled rows, and settings", () => {
    const share = encodeShareUrl("https://example.com/?tag=ui", sampleRows, defaultSettings);
    const decoded = decodeShareUrl(share);
    expect(decoded.url).toBe("https://example.com/?tag=ui");
    expect(decoded.rows.map((row) => row.id)).toEqual(sampleRows.map((row) => row.id));
    expect(decoded.rows.find((row) => row.id === "row-debug")?.enabled).toBe(false);
    expect(decoded.settings.mode).toBe("qs");
    expect(decoded.settings.sort).toBe("preserveRows");
  });
});
