import { describe, expect, it } from "vitest";
import { getWarnings } from "../../src/domain/warnings/warnings";
import { defaultSettings, sampleRows } from "../../src/test/fixtures";

describe("warning engine", () => {
  it("warns about disabled rows", () => {
    const warnings = getWarnings({ rows: sampleRows, settings: defaultSettings });
    expect(warnings.some((warning) => warning.id === "row-disabled-row-debug")).toBe(true);
  });

  it("warns when sort mode ignores drag-and-drop order", () => {
    const warnings = getWarnings({
      rows: sampleRows,
      settings: { ...defaultSettings, sort: "alpha" },
    });
    expect(warnings.some((warning) => warning.id === "sort-ignores-dnd")).toBe(true);
  });

  it("warns about userinfo in the URL", () => {
    const warnings = getWarnings({
      parts: {
        href: "https://user:pass@example.com/",
        protocol: "https:",
        username: "user",
        password: "pass",
        host: "example.com",
        hostname: "example.com",
        port: "",
        origin: "https://example.com",
        pathname: "/",
        search: "",
        hash: "",
      },
      rows: [],
      settings: defaultSettings,
    });
    expect(warnings.some((warning) => warning.id === "url-userinfo")).toBe(true);
  });

  it("warns about token-like keys and query-string nesting", () => {
    const warnings = getWarnings({
      rows: [
        {
          id: "secret",
          enabled: true,
          key: "api_token",
          value: "123",
          valueKind: "value",
        },
        {
          id: "nested",
          enabled: true,
          key: "filter[name]",
          value: "Ada",
          valueKind: "value",
        },
      ],
      settings: { ...defaultSettings, mode: "query-string" },
    });
    expect(warnings.some((warning) => warning.id === "row-token-like-secret")).toBe(true);
    expect(warnings.some((warning) => warning.id === "query-string-nesting-nested")).toBe(true);
  });
});
