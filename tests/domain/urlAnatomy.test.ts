import { describe, expect, it } from "vitest";
import { editUrlPart, parseUrlInput } from "../../src/domain/url/urlAnatomy";

describe("parseUrlInput", () => {
  it("parses editable URL anatomy", () => {
    const result = parseUrlInput("https://user:pass@docs.example.com:8443/a/b?tag=ui#notes");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.parts.protocol).toBe("https:");
    expect(result.parts.username).toBe("user");
    expect(result.parts.password).toBe("pass");
    expect(result.parts.hostname).toBe("docs.example.com");
    expect(result.parts.port).toBe("8443");
    expect(result.parts.pathname).toBe("/a/b");
    expect(result.parts.search).toBe("?tag=ui");
    expect(result.parts.hash).toBe("#notes");
  });

  it("preserves raw input on invalid URL", () => {
    const result = parseUrlInput("not a url");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid URL");
    expect(result.raw).toBe("not a url");
    expect(result.error).toContain("Invalid URL");
  });
});

describe("editUrlPart", () => {
  it("updates hostname and recalculates href", () => {
    const result = editUrlPart("https://docs.example.com:8443/a", {
      hostname: "api.example.com",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.parts.href).toBe("https://api.example.com:8443/a");
  });

  it("updates protocol and port", () => {
    const result = editUrlPart("http://example.com/a", {
      protocol: "https:",
      port: "8443",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.parts.href).toBe("https://example.com:8443/a");
  });
});
